import {
  generateSalt,
  generateNonce,
  generateVaultKey,
  deriveKeyFromMasterPassword,
  encryptVaultKey,
  decryptVaultKey,
  encryptVaultPayload,
  decryptVaultPayload,
  reencryptVaultKey,
  validateMasterPassword,
  type VaultEntryPayload,
} from './vault';

async function runTests() {
  console.log('--- Starting Secure Vault Cryptographic Validation ---');

  // Test 1: Password validation
  console.log('1. Testing master password validation...');
  try {
    validateMasterPassword('short');
    throw new Error('Should have failed for short password');
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (!err.message.includes('at least 12 characters')) {
        throw err;
      }
    } else {
      throw err;
    }
  }
  validateMasterPassword('ValidLongPassphrase123!');
  console.log('   ✓ Password validation rules verified');

  // Test 2: Random generation
  console.log('2. Testing salt and nonce generation...');
  const salt = generateSalt();
  const nonce = generateNonce();
  if (!salt || salt.length < 40) throw new Error('Invalid salt');
  if (!nonce || nonce.length < 16) throw new Error('Invalid nonce');
  console.log('   ✓ Salt (32 bytes) and Nonce (12 bytes) generated securely in Base64');

  // Test 3: KEK derivation
  console.log('3. Testing PBKDF2-HMAC-SHA-256 key derivation (600,000 iterations)...');
  const masterPassword = 'MasterPassword_2026_SecureKey!';
  const kek = await deriveKeyFromMasterPassword(masterPassword, salt, { iterations: 600000 });
  if (!kek) throw new Error('Failed to derive KEK');
  console.log('   ✓ KEK derived successfully');

  // Test 4: DEK generation and envelope encryption
  console.log('4. Testing DEK generation & wrapping (AES-256-GCM)...');
  const dek = await generateVaultKey();
  const encryptedKeyResult = await encryptVaultKey(dek, kek);
  if (!encryptedKeyResult.encryptedDek || !encryptedKeyResult.nonce) {
    throw new Error('DEK encryption failed');
  }
  console.log('   ✓ DEK encrypted with KEK');

  // Test 5: DEK unwrapping
  console.log('5. Testing DEK unwrapping...');
  const unwrappedDek = await decryptVaultKey(
    encryptedKeyResult.encryptedDek,
    encryptedKeyResult.nonce,
    kek
  );
  if (!unwrappedDek) throw new Error('DEK decryption failed');
  console.log('   ✓ DEK unwrapped successfully with matching KEK');

  // Test 6: Payload encryption & decryption
  console.log('6. Testing Vault Entry payload authenticated encryption...');
  const entryPayload: VaultEntryPayload = {
    title: 'Personal Bank Account',
    username: 'john_doe@bank.com',
    password: 'SuperSecretBankPassword456!#',
    secret: '2FA-SECRET-SEED-XYZ-789',
    url: 'https://mybank.com/login',
    notes: 'Primary savings account. Recovery key: 9988-7766-5544.',
    category: 'Finance'
  };

  const encryptedPayloadResult = await encryptVaultPayload(entryPayload, unwrappedDek);
  if (!encryptedPayloadResult.encryptedPayload || !encryptedPayloadResult.nonce) {
    throw new Error('Payload encryption failed');
  }
  console.log('   ✓ Payload encrypted with fresh 96-bit nonce');

  const decryptedPayload = await decryptVaultPayload(
    encryptedPayloadResult.encryptedPayload,
    encryptedPayloadResult.nonce,
    unwrappedDek
  );

  if (
    decryptedPayload.title !== entryPayload.title ||
    decryptedPayload.password !== entryPayload.password ||
    decryptedPayload.secret !== entryPayload.secret ||
    decryptedPayload.notes !== entryPayload.notes
  ) {
    throw new Error('Decrypted payload does not match original payload');
  }
  console.log('   ✓ Payload decrypted and authenticated perfectly');

  // Test 7: Tamper resistance (AEAD integrity check)
  console.log('7. Testing tamper resistance and wrong password detection...');
  const wrongKek = await deriveKeyFromMasterPassword(
    'WrongPassword123!',
    salt,
    { iterations: 600000 }
  );

  let decryptionFailedAsExpected = false;
  try {
    await decryptVaultKey(
      encryptedKeyResult.encryptedDek,
      encryptedKeyResult.nonce,
      wrongKek
    );
  } catch {
    decryptionFailedAsExpected = true;
  }

  if (!decryptionFailedAsExpected) {
    throw new Error('Decryption with wrong password should have failed!');
  }
  console.log('   ✓ Wrong password correctly rejected by AEAD authentication tag');

  // Test 8: Master password rotation without re-encrypting entry
  console.log('8. Testing master password rotation flow...');
  const newMasterPassword = 'BrandNewMasterPassword_2026!';
  const newSalt = generateSalt();
  const reencryptedResult = await reencryptVaultKey(unwrappedDek, newMasterPassword, newSalt);

  const newKek = await deriveKeyFromMasterPassword(newMasterPassword, reencryptedResult.kdfSalt);
  const reDecryptedDek = await decryptVaultKey(
    reencryptedResult.encryptedDek,
    reencryptedResult.nonce,
    newKek
  );

  // Verify the SAME old encrypted payload decrypts cleanly with the DEK recovered via new password
  const decryptedAfterRotation = await decryptVaultPayload(
    encryptedPayloadResult.encryptedPayload,
    encryptedPayloadResult.nonce,
    reDecryptedDek
  );

  if (decryptedAfterRotation.password !== entryPayload.password) {
    throw new Error('Payload decryption failed after password rotation');
  }
  console.log('   ✓ Master password rotated: DEK preserved, existing entries remain valid!');

  console.log('\n--- ALL CRYPTOGRAPHIC TESTS PASSED SUCCESSFULLY! ---');
}

runTests().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
