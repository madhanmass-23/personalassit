# Personal Assistant v1.1 — Secure Vault Architecture & Threat Model

## 1. Purpose

The Secure Vault module provides end-to-end zero-knowledge confidential storage for credentials, secrets, recovery codes, and sensitive personal notes within Personal Assistant.

The core cryptographic guarantee is:
> **The server stores ciphertext and encryption metadata but does not receive the master password or plaintext vault secrets.**

Plaintext data is accessible exclusively in trusted client memory when the vault is unlocked by the authenticated user with their master password.

---

## 2. Threat Model

The Secure Vault is designed under a **Zero-Knowledge / Untrusted Server** threat model.

### Untrusted Entities:
- **Server administrators and hosting providers**: Even with root or `SUPERUSER` privileges on the database server or PHP API server, secrets cannot be decrypted.
- **Compromised database dumps**: Stolen SQL backups or exposed replica databases contain only authenticated AES-256-GCM ciphertexts and salts.
- **Network eavesdroppers (Man-in-the-Middle)**: TLS protects the transport layer, but even if TLS were terminated or inspected by an intermediary proxy, the payloads transmitted to and from the server are encrypted ciphertexts.
- **Cross-user isolation violations**: Even if an unauthorized user bypasses API authorization layers and downloads another user's encrypted rows, they cannot decrypt them without that user's master password.

---

## 3. What the Design Protects Against

1. **Database Compromise & Data Breaches**: Leaked MySQL database dumps contain only AES-256-GCM ciphertext, unique salts, and initialization vectors (nonces).
2. **Malicious or Compromised Server Backend**: A compromised PHP backend cannot expose user secrets because plaintext secrets and master passwords are never transmitted to the server.
3. **Internal Operator Snooping**: Database administrators (DBAs) and cloud infrastructure technicians cannot view passwords, credit cards, or notes.
4. **Ciphertext Tampering (Bit-Flipping)**: AES-256-GCM computes an authenticated 128-bit authentication tag. Any modification of ciphertext or nonce fails authentication immediately during decryption.
5. **Credential Stuffing across Services**: The vault uses a distinct Master Password with dedicated KDF salts, separating vault security from the account login credential.
6. **Master Password Rotation Friction**: Master passwords can be rotated without re-encrypting hundreds of individual vault entries, reducing client-side compute overhead and risk of network failure during rotation.

---

## 4. What the Design Does NOT Protect Against

Understanding non-goals and physical boundaries is critical for secure system design:

1. **Compromised Client Device (Malware / Keyloggers / Spyware)**: If the client workstation or smartphone contains an active kernel keylogger, memory scraper, or compromised browser extension, sensitive keys in active RAM can be captured.
2. **Forgotten Master Password**: 
   > **If the user's master password is forgotten and there is no recovery mechanism, encrypted vault contents may become unrecoverable.**
   > **The system will NOT implement a fake password-recovery mechanism or escrow backdoor that would allow the server to decrypt the vault.**
3. **Cross-Site Scripting (XSS) on Frontend**: An XSS vulnerability in the frontend application executing in the user's browser context could read variables in memory while the vault is in the `UNLOCKED` state. Robust CSP and strict dependency auditing are required.
4. **Client-Side Shoulder Surfing**: Physical observation of the unlocked screen.
5. **Denial of Service / Data Deletion**: An attacker with root database access cannot read the secrets, but could delete the user's encrypted rows (mitigated by automated encrypted backups).

---

## 5. Key Hierarchy

The Secure Vault utilizes an **Envelope Encryption** architecture:

```
+-------------------------------------------------------------+
|                     Master Password                         |
|             (Held only in user's mind / client)             |
+-------------------------------------------------------------+
                              |
                              | [KDF: PBKDF2-HMAC-SHA-256 / Argon2id]
                              v
+-------------------------------------------------------------+
|                 Key Encryption Key (KEK)                    |
|             (256-bit AES-GCM Key, ephemeral)                |
+-------------------------------------------------------------+
                              |
                              | [AES-256-GCM Decrypt / Unwrap]
                              v
+-------------------------------------------------------------+
|                Data Encryption Key (DEK)                    |
|             (Random 256-bit Cryptographic Key)              |
|               [Ephemeral in-memory only]                    |
+-------------------------------------------------------------+
                              |
                              | [AES-256-GCM Encrypt / Decrypt]
                              v
+-------------------------------------------------------------+
|             Vault Entry Authenticated Payloads              |
|      { title, username, password, secret, url, notes }      |
+-------------------------------------------------------------+
```

### Roles of Keys:
- **Master Password**: Never leaves the client. Used solely to derive the KEK.
- **Key Encryption Key (KEK)**: Ephemeral 256-bit AES key derived deterministically via KDF. Used strictly to encrypt and decrypt the DEK. Never stored anywhere.
- **Data Encryption Key (DEK)**: Independent 256-bit cryptographically secure random key. Encrypted with the KEK and stored in MySQL as `encrypted_dek`. Used to encrypt and decrypt all individual vault entries.
- **Vault Entries**: Encrypted using the DEK with AES-256-GCM.

---

## 6. Master Password Handling

1. **Minimum Length**: Minimum 12 characters. Long passphrases are encouraged.
2. **No Arbitrary Restrictions**: No unnecessarily low maximum length limit.
3. **No Transformation**: The master password must **never** be silently trimmed, converted to lowercase, normalized, or altered in any manner. It is evaluated exactly as entered.
4. **Zero-Knowledge Handling**:
   - Master password is **never sent to the PHP API**.
   - Master password is **never saved to MySQL**.
   - Master password is **never written to `localStorage` or `sessionStorage`**.
   - Master password is **never logged** (console, telemetry, server logs).
   - In memory, the string reference is discarded as soon as KDF derivation finishes.

---

## 7. Key Derivation Function (KDF)

### Specification:
- **Primary Standard Implementation**: `PBKDF2-HMAC-SHA-256`
  - **Iterations**: Minimum **600,000** iterations (matching and exceeding OWASP 2023/2024 recommendations for PBKDF2-HMAC-SHA-256).
  - **Salt**: 32 bytes (256 bits) of cryptographically secure random bytes per vault (`crypto.getRandomValues`).
  - **Hash**: SHA-256.
  - **Rationale & Compatibility**: Natively implemented in the W3C Web Cryptography API (`crypto.subtle.deriveKey`) across all modern web browsers (Chrome, Firefox, Safari, Edge, Android WebView, and Node.js) with hardware optimization and zero external dependencies.

- **Argon2id Compatibility & Parameters**:
  - The database schema is future-ready for `Argon2id` (v1.3) with explicit parameter columns:
    - `kdf_memory_cost`: 65,536 KiB (64 MiB)
    - `kdf_time_cost`: 3 passes
    - `kdf_parallelism`: 1 thread
  - *Browser Compatibility Note*: Standard Web Cryptography API does not include Argon2id natively. Running Argon2id in a browser requires WebAssembly (`hash-wasm` / `@noble/hashes`). Because WebAssembly memory allocation can fail on constrained mobile devices or strictly sandboxed PWAs, PBKDF2-HMAC-SHA-256 at 600,000 iterations is the guaranteed zero-friction baseline, with metadata tracking algorithm choice per vault.

---

## 8. Authenticated Encryption: AES-256-GCM

- **Cipher**: AES (Advanced Encryption Standard) in Galois/Counter Mode (GCM).
- **Key Length**: 256 bits.
- **Tag Length**: 128 bits (16 bytes) authentication tag.
- **Properties**:
  - **Confidentiality**: Plaintext cannot be read without the key.
  - **Integrity**: Any bit-level modification is detected.
  - **Authentication**: Guarantees ciphertext was produced by the legitimate key holder.

---

## 9. Nonce (Initialization Vector) Generation

- **Length**: 96 bits (12 bytes), the standard and cryptographically optimal IV size for AES-GCM (NIST Special Publication 800-38D).
- **Generation**: Generated using a cryptographically secure pseudorandom number generator (`crypto.getRandomValues`).
- **Rule of Nonce Uniqueness**:
  - **A nonce MUST NEVER be reused with the same key.**
  - Every single encryption operation (both encrypting the DEK and encrypting each vault entry payload) generates a fresh, independent 12-byte nonce.
  - The nonce is transmitted and stored alongside the ciphertext (in `payload_nonce` / `encrypted_dek_nonce`). Nonces do not need to be secret, but must never repeat.

---

## 10. Database Schema

The database migration `012_create_secure_vault.sql` establishes two tables:

### Table: `secure_vaults`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | Unique Vault UUID |
| `user_id` | `BIGINT UNSIGNED` | `NOT NULL`, `UNIQUE`, `FK(users.id) CASCADE` | Owner user ID (strictly 1:1) |
| `version` | `INT` | `NOT NULL DEFAULT 1` | Vault metadata schema version |
| `kdf_algorithm` | `VARCHAR(50)` | `NOT NULL` | 'PBKDF2-HMAC-SHA-256' or 'argon2id' |
| `kdf_version` | `VARCHAR(20)` | `NULL DEFAULT '1'` | Version of KDF algorithm |
| `kdf_salt` | `VARCHAR(255)` | `NOT NULL` | Base64-encoded 256-bit random salt |
| `kdf_memory_cost` | `INT UNSIGNED` | `NULL` | Memory cost (KiB) for Argon2id |
| `kdf_time_cost` | `INT UNSIGNED` | `NULL` | Time cost (iterations) for Argon2id |
| `kdf_parallelism` | `INT UNSIGNED` | `NULL` | Parallelism (threads) for Argon2id |
| `kdf_iterations` | `INT UNSIGNED` | `NULL DEFAULT 600000` | Iteration count for PBKDF2 |
| `encryption_algorithm` | `VARCHAR(50)` | `NOT NULL DEFAULT 'AES-256-GCM'` | Symmetric cipher |
| `encrypted_dek` | `TEXT` | `NOT NULL` | Base64 DEK encrypted with KEK |
| `encrypted_dek_nonce`| `VARCHAR(255)` | `NOT NULL` | Base64 96-bit AES-GCM nonce |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Creation timestamp |
| `updated_at` | `TIMESTAMP` | `ON UPDATE CURRENT_TIMESTAMP` | Last update timestamp |
| `last_unlocked_at` | `TIMESTAMP` | `NULL` | Client-reported unlock timestamp |

### Table: `secure_vault_entries`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | Unique Entry UUID |
| `vault_id` | `VARCHAR(36)` | `NOT NULL`, `FK(secure_vaults.id) CASCADE` | Owning vault reference |
| `user_id` | `BIGINT UNSIGNED` | `NOT NULL`, `FK(users.id) CASCADE` | User ID for direct authorization verification |
| `encrypted_payload` | `LONGTEXT` | `NOT NULL` | Base64 AES-256-GCM ciphertext of JSON payload |
| `payload_nonce` | `VARCHAR(255)` | `NOT NULL` | Base64 96-bit AES-GCM nonce |
| `payload_version` | `INT` | `NOT NULL DEFAULT 1` | Payload format version |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Creation timestamp |
| `updated_at` | `TIMESTAMP` | `ON UPDATE CURRENT_TIMESTAMP` | Last update timestamp |

### Opaque Encrypted Payload:
All sensitive attributes are encrypted into a single JSON string before AES-GCM encryption:
```json
{
  "title": "GitHub Enterprise",
  "username": "user@company.com",
  "password": "CorrectHorseBatteryStaple123!",
  "secret": "JBSWY3DPEHPK3PXP",
  "url": "https://github.com",
  "notes": "Backup recovery codes: 1234-5678, 8765-4321",
  "category": "Development"
}
```
**No plaintext username, password, secret, or notes columns exist in MySQL.**

---

## 11. Client-Side Encryption Flow (Creating Vault)

```
[User enters Master Password]
             │
             ▼
1. Validate length >= 12 chars
2. Generate 32-byte cryptographically secure random salt (kdf_salt)
3. Derive KEK via PBKDF2-HMAC-SHA-256 (600,000 iterations)
4. Generate random 256-bit AES-GCM DEK
5. Generate fresh 12-byte random nonce (encrypted_dek_nonce)
6. Encrypt raw DEK with KEK using AES-256-GCM -> encrypted_dek
7. Send { kdf_algorithm, kdf_salt, kdf_iterations, encryption_algorithm, encrypted_dek, encrypted_dek_nonce } to API
8. Keep decrypted DEK in volatile memory (state: UNLOCKED)
9. Discard master password string and temporary buffers
```

---

## 12. Vault Unlock Flow

```
[User enters Master Password]
             │
             ▼
1. Fetch vault metadata from API: { kdf_salt, kdf_iterations, encrypted_dek, encrypted_dek_nonce }
2. Validate entered master password format
3. Derive KEK from entered password and kdf_salt using PBKDF2-HMAC-SHA-256
4. Decrypt encrypted_dek using KEK with encrypted_dek_nonce
   ├─ IF Decryption succeeds (Tag matches):
   │   └─ Store DEK in volatile client memory; set state to UNLOCKED
   └─ IF Decryption fails (AEAD tag mismatch):
       └─ Throw "Invalid Master Password"; clear all buffers; remain LOCKED
5. Discard master password from memory
```

---

## 13. Vault Lock Flow

When the user clicks "Lock", navigating away, closing the tab, or when an inactivity timer expires:

1. Transition state: `UNLOCKED` -> `LOCKING` -> `LOCKED`.
2. Clear and dereference the in-memory `DEK` (`CryptoKey` instance).
3. Zeroize any temporary `Uint8Array` buffers using `zeroizeBuffer()`.
4. Clear all decrypted entries from component state / React state.
5. Destroy all clipboard timer references.
6. Verify no decrypted data or keys remain in `localStorage`, `sessionStorage`, or window global scope.

---

## 14. Master Password Change Flow

Because of envelope encryption, rotating the master password does **not** require re-encrypting existing vault entries:

```
[User provides Old Master Password & New Master Password]
             │
             ▼
1. Derive old KEK -> Decrypt existing DEK
2. Generate fresh 32-byte salt (new_salt)
3. Derive new KEK from New Master Password using new_salt
4. Generate fresh 12-byte nonce
5. Encrypt same DEK with new KEK -> new_encrypted_dek
6. Send new { encrypted_dek, nonce, kdf_salt, kdf_iterations } to API
7. API updates secure_vaults row
   ==> ALL EXISTING VAULT ENTRIES REMAIN FULLY VALID AND UNTOUCHED!
```

---

## 15. Account Deletion Implications

- Foreign keys are defined with `ON DELETE CASCADE ON UPDATE CASCADE`:
  - Deleting a user in `users` cascades to `secure_vaults` and `secure_vault_entries`.
  - Deleting a vault in `secure_vaults` cascades to all associated `secure_vault_entries`.
- No orphaned ciphertexts or metadata linger in the database.

---

## 16. Backup Implications

- Standard database backups (`mysqldump`, ServerByte snapshots) contain only:
  - Base64 ciphertext
  - Random salts
  - Random nonces
- A leaked backup archive does not give the attacker access to plaintext credentials.
- Recovery from backup restores the encrypted vault seamlessly; users unlock with their master password as normal.

---

## 17. Logging Rules

The following items are **STRICTLY PROHIBITED** from ever being logged:
- Master passwords or passphrases
- Derived Key Encryption Keys (KEK)
- Data Encryption Keys (DEK)
- Decrypted vault payloads or entry fields (passwords, usernames, secrets, notes)
- Clipboard contents
- Plaintext error messages containing sensitive inputs

All logging statements in frontend and backend must log only metadata (e.g., entry IDs, timestamps, status codes).

---

## 18. LocalStorage & Persistence Rules

**NEVER store in `localStorage`, `sessionStorage`, cookies, or IndexedDB:**
- Master password
- Derived KEK
- Decrypted DEK
- Plaintext passwords or decrypted entries

The existing JWT authentication token stored in localStorage for user session management remains **completely isolated** from the vault cryptography. Session tokens authenticate the HTTP user; they have zero mathematical ability to decrypt the vault.

---

## 19. Server Visibility Matrix

| Data Item | Server Can See? | Stored in MySQL? | Explanation |
|---|---|---|---|
| User ID | **Yes** | Yes | Required for tenancy and authorization |
| Vault ID / Entry ID | **Yes** | Yes | UUID primary keys for CRUD routing |
| KDF Algorithm & Iterations | **Yes** | Yes | Public parameters necessary for client derivation |
| KDF Salt | **Yes** | Yes | Cryptographic salt (public parameter) |
| Nonces (IVs) | **Yes** | Yes | Must be preserved to decrypt AES-GCM ciphertext |
| Encrypted DEK | **Yes** | Yes | Ciphertext only; unintelligible without KEK |
| Encrypted Entry Payload | **Yes** | Yes | Ciphertext only; unintelligible without DEK |
| **Master Password** | **NO** | **NO** | Never sent to server |
| **Key Encryption Key (KEK)** | **NO** | **NO** | Derived ephemerally on client only |
| **Data Encryption Key (DEK)** | **NO** | **NO** | Exists in client RAM only while unlocked |
| **Plaintext Passwords / Secrets** | **NO** | **NO** | Encrypted prior to network dispatch |
| **Plaintext Notes / URLs** | **NO** | **NO** | Packaged inside encrypted JSON payload |

---

## 20. Future Android Compatibility (v2.0 Readiness)

The architecture is deliberately aligned with native Android security primitives:

1. **Cryptographic Parity**:
   - `AES/GCM/NoPadding` (256-bit key, 96-bit IV) is natively supported by Java `javax.crypto.Cipher` on Android API level 19+.
   - `PBKDF2WithHmacSHA256` is natively supported by `SecretKeyFactory` on Android API level 26+.
2. **Android Keystore & Biometrics**:
   - In v2.0, the Android app can optionally wrap the DEK or master password using a key generated in the **Android Keystore System** backed by the device's hardware Secure Enclave / TEE (Trusted Execution Environment) with `BiometricPrompt` authentication.
   - The remote MySQL database schema, envelope format, and encrypted payloads will require **zero changes** to support the native Android client.
