/**
 * Personal Assistant v1.1 — Secure Vault Cryptographic Service
 * 
 * Cryptographic Architecture: Envelope Encryption
 * Master Password -> KDF (PBKDF2-HMAC-SHA-256 / Argon2id) -> KEK (Key Encryption Key)
 * KEK -> AES-256-GCM -> DEK (Data Encryption Key)
 * DEK -> AES-256-GCM -> Vault Entry Payload (JSON)
 * 
 * Security Principles:
 * 1. Master password is NEVER sent to server, NEVER logged, NEVER stored in MySQL or localStorage.
 * 2. Authenticated encryption with AES-256-GCM ensures confidentiality and integrity.
 * 3. Fresh 96-bit (12-byte) random nonces generated per encryption operation.
 * 4. All sensitive vault entry attributes are encrypted as a single authenticated JSON payload.
 * 5. Cryptography runs strictly in the client environment via W3C Web Cryptography API.
 */

// ============================================================================
// Types & Constants
// ============================================================================

export type VaultLockState = 'LOCKED' | 'UNLOCKING' | 'UNLOCKED' | 'LOCKING';

export type KdfAlgorithm = 'PBKDF2-HMAC-SHA-256' | 'argon2id';
export type EncryptionAlgorithm = 'AES-256-GCM';

export const MIN_MASTER_PASSWORD_LENGTH = 12;
export const DEFAULT_PBKDF2_ITERATIONS = 600000; // Minimum 600k iterations per security specification
export const AES_GCM_NONCE_LENGTH_BYTES = 12;   // 96-bit nonce standard for AES-GCM (NIST SP 800-38D)
export const KDF_SALT_LENGTH_BYTES = 32;        // 256-bit salt for key derivation
export const DEK_KEY_LENGTH_BITS = 256;          // 256-bit AES key

export interface KdfOptions {
  algorithm?: KdfAlgorithm;
  iterations?: number;
  memoryCost?: number;
  timeCost?: number;
  parallelism?: number;
  version?: string;
}

export interface VaultEntryPayload {
  title: string;
  username?: string;
  password?: string;
  secret?: string;
  url?: string;
  notes?: string;
  category?: string;
  [key: string]: unknown;
}

export interface EncryptedVaultKey {
  encryptedDek: string;
  nonce: string;
  algorithm: EncryptionAlgorithm;
}

export interface EncryptedPayloadResult {
  encryptedPayload: string;
  nonce: string;
  version: number;
  algorithm: EncryptionAlgorithm;
}

export interface VaultMetadata {
  id: string;
  userId: number | string;
  version: number;
  kdfAlgorithm: KdfAlgorithm;
  kdfVersion?: string;
  kdfSalt: string;
  kdfMemoryCost?: number | null;
  kdfTimeCost?: number | null;
  kdfParallelism?: number | null;
  kdfIterations: number;
  encryptionAlgorithm: EncryptionAlgorithm;
  encryptedDek: string;
  encryptedDekNonce: string;
  createdAt?: string;
  updatedAt?: string;
  lastUnlockedAt?: string | null;
}

// ============================================================================
// Encoding Utilities (Browser & Node.js Compatible)
// ============================================================================

/**
 * Convert a Uint8Array to a Base64 string.
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert a Base64 string to a Uint8Array.
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    const buf = Buffer.from(base64, 'base64');
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  }
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Get the Web Crypto API instance from global scope.
 */
function getCrypto(): Crypto {
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto;
  }
  throw new Error('Web Cryptography API is not supported in this runtime environment.');
}

/**
 * Get SubtleCrypto interface.
 */
function getSubtle(): SubtleCrypto {
  const cryptoObj = getCrypto();
  if (!cryptoObj.subtle) {
    throw new Error('SubtleCrypto is not available. Ensure you are running in a secure context (HTTPS/localhost).');
  }
  return cryptoObj.subtle;
}

// ============================================================================
// Master Password Validation
// ============================================================================

/**
 * Validates master password criteria.
 * Does NOT trim or alter whitespace. Master password must be evaluated exactly as entered.
 */
export function validateMasterPassword(password: string): void {
  if (!password || typeof password !== 'string') {
    throw new Error('Master password is required and must be a string.');
  }
  if (password.length < MIN_MASTER_PASSWORD_LENGTH) {
    throw new Error(
      `Master password must be at least ${MIN_MASTER_PASSWORD_LENGTH} characters long.`
    );
  }
}

// ============================================================================
// Random Salt & Nonce Generation
// ============================================================================

/**
 * Generates a cryptographically secure random salt for KDF.
 * Default is 32 bytes (256 bits).
 * Returns Base64-encoded string.
 */
export function generateSalt(byteLength: number = KDF_SALT_LENGTH_BYTES): string {
  const cryptoObj = getCrypto();
  const bytes = new Uint8Array(byteLength);
  cryptoObj.getRandomValues(bytes);
  return uint8ArrayToBase64(bytes);
}

/**
 * Generates a cryptographically secure random nonce (IV) for AES-GCM.
 * Standard length for AES-GCM is 12 bytes (96 bits).
 * NEVER reuse a nonce with the same key.
 * Returns Base64-encoded string.
 */
export function generateNonce(byteLength: number = AES_GCM_NONCE_LENGTH_BYTES): string {
  const cryptoObj = getCrypto();
  const bytes = new Uint8Array(byteLength);
  cryptoObj.getRandomValues(bytes);
  return uint8ArrayToBase64(bytes);
}

// ============================================================================
// Key Derivation (Master Password -> KEK)
// ============================================================================

/**
 * Derives a Key Encryption Key (KEK) from the master password using PBKDF2-HMAC-SHA-256.
 * Enforces minimum 600,000 iterations for high work factor.
 * The derived key is configured for AES-256-GCM wrap/unwrap/encrypt/decrypt.
 * 
 * Note on Argon2id:
 * Standard W3C Web Cryptography API does not natively support Argon2id.
 * PBKDF2-HMAC-SHA-256 with >= 600,000 iterations is the native audited standard fallback.
 * The KdfOptions interface is structured to preserve future Argon2id parameters.
 */
export async function deriveKeyFromMasterPassword(
  password: string,
  saltBase64: string,
  options?: KdfOptions
): Promise<CryptoKey> {
  validateMasterPassword(password);

  const subtle = getSubtle();
  const saltBytes = base64ToUint8Array(saltBase64);
  const iterations = Math.max(options?.iterations ?? DEFAULT_PBKDF2_ITERATIONS, DEFAULT_PBKDF2_ITERATIONS);

  // Encode password as UTF-8 bytes without trimming or lowercasing
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);

  // Import raw password as key derivation material
  const baseKey = await subtle.importKey(
    'raw',
    passwordBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveKey', 'deriveBits']
  );

  // Derive 256-bit AES-GCM KEK
  const kek = await subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes as BufferSource,
      iterations,
      hash: 'SHA-256'
    },
    baseKey,
    {
      name: 'AES-GCM',
      length: DEK_KEY_LENGTH_BITS
    },
    false, // KEK is non-extractable from memory
    ['encrypt', 'decrypt']
  );

  return kek;
}

// ============================================================================
// Vault Data Encryption Key (DEK) Lifecycle
// ============================================================================

/**
 * Generates a fresh, cryptographically secure 256-bit AES-GCM Data Encryption Key (DEK).
 * The DEK is completely independent of the master password.
 */
export async function generateVaultKey(): Promise<CryptoKey> {
  const subtle = getSubtle();
  return subtle.generateKey(
    {
      name: 'AES-GCM',
      length: DEK_KEY_LENGTH_BITS
    },
    true, // Extractable so it can be encrypted by KEK before storage
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts the Vault Data Encryption Key (DEK) using the Key Encryption Key (KEK) with AES-256-GCM.
 * A fresh 96-bit random nonce is generated.
 * Returns Base64-encoded encrypted DEK and Base64-encoded nonce.
 */
export async function encryptVaultKey(
  dek: CryptoKey,
  kek: CryptoKey
): Promise<EncryptedVaultKey> {
  const subtle = getSubtle();

  // Export DEK to raw bytes
  const rawDek = await subtle.exportKey('raw', dek);

  // Generate unique nonce for this encryption
  const nonceBytes = new Uint8Array(AES_GCM_NONCE_LENGTH_BYTES);
  getCrypto().getRandomValues(nonceBytes);

  // Encrypt DEK with KEK using AES-256-GCM
  const ciphertextBuffer = await subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: nonceBytes,
      tagLength: 128
    },
    kek,
    rawDek
  );

  return {
    encryptedDek: uint8ArrayToBase64(new Uint8Array(ciphertextBuffer)),
    nonce: uint8ArrayToBase64(nonceBytes),
    algorithm: 'AES-256-GCM'
  };
}

/**
 * Decrypts the Vault Data Encryption Key (DEK) using the Key Encryption Key (KEK) with AES-256-GCM.
 * Restores the 256-bit AES-GCM DEK for in-memory use during an unlocked session.
 */
export async function decryptVaultKey(
  encryptedDekBase64: string,
  nonceBase64: string,
  kek: CryptoKey
): Promise<CryptoKey> {
  const subtle = getSubtle();
  const ciphertextBytes = base64ToUint8Array(encryptedDekBase64);
  const nonceBytes = base64ToUint8Array(nonceBase64);

  // Decrypt with KEK
  const decryptedRawBuffer = await subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: nonceBytes as BufferSource,
      tagLength: 128
    },
    kek,
    ciphertextBytes as BufferSource
  );

  // Re-import as AES-GCM CryptoKey
  return subtle.importKey(
    'raw',
    decryptedRawBuffer,
    {
      name: 'AES-GCM',
      length: DEK_KEY_LENGTH_BITS
    },
    true,
    ['encrypt', 'decrypt']
  );
}

// ============================================================================
// Vault Entry Encryption & Decryption (DEK -> Payload)
// ============================================================================

/**
 * Encrypts a vault entry payload using AES-256-GCM with the DEK.
 * All sensitive entry fields (title, username, password, secret, url, notes, category)
 * are serialized into an authenticated JSON payload.
 * A fresh 96-bit nonce is generated for every operation.
 */
export async function encryptVaultPayload(
  payload: VaultEntryPayload,
  dek: CryptoKey,
  version: number = 1
): Promise<EncryptedPayloadResult> {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload must be a valid object.');
  }

  const subtle = getSubtle();
  const jsonString = JSON.stringify(payload);
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(jsonString);

  // Fresh 96-bit nonce
  const nonceBytes = new Uint8Array(AES_GCM_NONCE_LENGTH_BYTES);
  getCrypto().getRandomValues(nonceBytes);

  const ciphertextBuffer = await subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: nonceBytes,
      tagLength: 128
    },
    dek,
    dataBytes
  );

  return {
    encryptedPayload: uint8ArrayToBase64(new Uint8Array(ciphertextBuffer)),
    nonce: uint8ArrayToBase64(nonceBytes),
    version,
    algorithm: 'AES-256-GCM'
  };
}

/**
 * Decrypts an encrypted vault entry payload using AES-256-GCM with the DEK.
 * Authenticates ciphertext and tag before parsing JSON.
 */
export async function decryptVaultPayload(
  encryptedPayloadBase64: string,
  nonceBase64: string,
  dek: CryptoKey
): Promise<VaultEntryPayload> {
  const subtle = getSubtle();
  const ciphertextBytes = base64ToUint8Array(encryptedPayloadBase64);
  const nonceBytes = base64ToUint8Array(nonceBase64);

  const decryptedBuffer = await subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: nonceBytes as BufferSource,
      tagLength: 128
    },
    dek,
    ciphertextBytes as BufferSource
  );

  const decoder = new TextDecoder();
  const jsonString = decoder.decode(decryptedBuffer);
  return JSON.parse(jsonString) as VaultEntryPayload;
}

// ============================================================================
// Master Password Change Workflow (Zero-Re-encryption of Entries)
// ============================================================================

/**
 * Re-encrypts the existing DEK with a new master password.
 * Crucial envelope-encryption property:
 * Existing vault entries DO NOT need to be re-encrypted because the DEK remains identical.
 * Only the encrypted_dek and KDF salt/iteration metadata are updated.
 */
export async function reencryptVaultKey(
  dek: CryptoKey,
  newMasterPassword: string,
  newSaltBase64: string = generateSalt(),
  options?: KdfOptions
): Promise<{
  encryptedDek: string;
  nonce: string;
  kdfSalt: string;
  kdfIterations: number;
  kdfAlgorithm: KdfAlgorithm;
}> {
  validateMasterPassword(newMasterPassword);

  const iterations = Math.max(options?.iterations ?? DEFAULT_PBKDF2_ITERATIONS, DEFAULT_PBKDF2_ITERATIONS);
  const newKek = await deriveKeyFromMasterPassword(newMasterPassword, newSaltBase64, {
    ...options,
    iterations
  });

  const encrypted = await encryptVaultKey(dek, newKek);

  return {
    encryptedDek: encrypted.encryptedDek,
    nonce: encrypted.nonce,
    kdfSalt: newSaltBase64,
    kdfIterations: iterations,
    kdfAlgorithm: options?.algorithm ?? 'PBKDF2-HMAC-SHA-256'
  };
}

// ============================================================================
// Memory Zeroization / Lock Cleanup
// ============================================================================

/**
 * Overwrites a typed array with zeros to minimize memory lingering of sensitive data.
 */
export function zeroizeBuffer(buffer: Uint8Array): void {
  buffer.fill(0);
}

// ============================================================================
// Cryptographically Secure Password Generator & Strength Evaluator
// ============================================================================

export interface PasswordGeneratorOptions {
  length?: number;
  uppercase?: boolean;
  lowercase?: boolean;
  numbers?: boolean;
  symbols?: boolean;
}

const CHAR_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

/**
 * Generates a cryptographically strong random password using CSPRNG.
 * NEVER uses Math.random().
 */
export function generateSecurePassword(options: PasswordGeneratorOptions = {}): string {
  const {
    length = 18,
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true
  } = options;

  const validLength = Math.max(12, Math.min(64, length));
  const cryptoObj = getCrypto();

  let pool = '';
  const guaranteedChars: string[] = [];

  if (uppercase) {
    pool += CHAR_SETS.uppercase;
    const rnd = new Uint32Array(1);
    cryptoObj.getRandomValues(rnd);
    guaranteedChars.push(CHAR_SETS.uppercase[rnd[0] % CHAR_SETS.uppercase.length]);
  }
  if (lowercase) {
    pool += CHAR_SETS.lowercase;
    const rnd = new Uint32Array(1);
    cryptoObj.getRandomValues(rnd);
    guaranteedChars.push(CHAR_SETS.lowercase[rnd[0] % CHAR_SETS.lowercase.length]);
  }
  if (numbers) {
    pool += CHAR_SETS.numbers;
    const rnd = new Uint32Array(1);
    cryptoObj.getRandomValues(rnd);
    guaranteedChars.push(CHAR_SETS.numbers[rnd[0] % CHAR_SETS.numbers.length]);
  }
  if (symbols) {
    pool += CHAR_SETS.symbols;
    const rnd = new Uint32Array(1);
    cryptoObj.getRandomValues(rnd);
    guaranteedChars.push(CHAR_SETS.symbols[rnd[0] % CHAR_SETS.symbols.length]);
  }

  // Fallback if no sets selected
  if (pool.length === 0) {
    pool = CHAR_SETS.lowercase + CHAR_SETS.numbers;
  }

  const remainingLength = validLength - guaranteedChars.length;
  const randomIndices = new Uint32Array(remainingLength);
  cryptoObj.getRandomValues(randomIndices);

  const passwordChars = [...guaranteedChars];
  for (let i = 0; i < remainingLength; i++) {
    passwordChars.push(pool[randomIndices[i] % pool.length]);
  }

  // Fisher-Yates shuffle with CSPRNG
  const shuffleIndices = new Uint32Array(passwordChars.length);
  cryptoObj.getRandomValues(shuffleIndices);

  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = shuffleIndices[i] % (i + 1);
    const temp = passwordChars[i];
    passwordChars[i] = passwordChars[j];
    passwordChars[j] = temp;
  }

  return passwordChars.join('');
}

export interface PasswordStrengthResult {
  score: number; // 0 to 4
  label: 'Too Short' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  hasMinLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
}

/**
 * Evaluates password strength without logging or transmitting.
 */
export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return {
      score: 0,
      label: 'Too Short',
      hasMinLength: false,
      hasUpper: false,
      hasLower: false,
      hasNumber: false,
      hasSymbol: false
    };
  }

  const hasMinLength = password.length >= MIN_MASTER_PASSWORD_LENGTH;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  let score = 0;
  if (hasMinLength) score++;
  if (password.length >= 16) score++;
  if ((hasUpper ? 1 : 0) + (hasLower ? 1 : 0) + (hasNumber ? 1 : 0) + (hasSymbol ? 1 : 0) >= 3) score++;
  if (hasUpper && hasLower && hasNumber && hasSymbol) score++;

  let label: 'Too Short' | 'Weak' | 'Fair' | 'Good' | 'Strong' = 'Weak';
  if (!hasMinLength) {
    label = 'Too Short';
  } else if (score === 1) {
    label = 'Weak';
  } else if (score === 2) {
    label = 'Fair';
  } else if (score === 3) {
    label = 'Good';
  } else if (score >= 4) {
    label = 'Strong';
  }

  return {
    score,
    label,
    hasMinLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSymbol
  };
}

