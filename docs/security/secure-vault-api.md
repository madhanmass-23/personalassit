# Personal Assistant v1.1 — Secure Vault Backend API Specification

## 1. Executive Summary & Zero-Knowledge Boundary

> **The backend stores and serves encrypted vault material but does not possess the master password or plaintext vault contents.**

The Personal Assistant Secure Vault backend API operates as a **zero-knowledge ciphertext storage and synchronization service**. All cryptographic key derivation (PBKDF2-HMAC-SHA-256 with 600,000 iterations), symmetric authenticated encryption (AES-256-GCM), and decryption occur strictly on the user's client device.

### Core Security Guarantees:
- **Master Password**: NEVER sent to the API, NEVER stored in MySQL, NEVER logged.
- **Key Encryption Key (KEK)**: Derived ephemerally on client; never transmitted.
- **Data Encryption Key (DEK)**: Only sent and stored in encrypted form (`encrypted_dek` wrapped with KEK).
- **Vault Entry Payloads**: Encrypted as opaque authenticated ciphertext strings prior to transmission.
- **No Server Plaintext**: Server administrator, database operator, and network interceptor cannot decrypt or inspect credentials, usernames, passwords, notes, URLs, or secrets.

---

## 2. API Endpoints Overview

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/vault` | Create an initialized secure vault for the authenticated user | **Yes** (JWT) |
| `GET` | `/api/vault` | Retrieve the authenticated user's vault metadata & encrypted DEK | **Yes** (JWT) |
| `PATCH` | `/api/vault/key` | Update encrypted DEK & KDF parameters (Master Password Rotation) | **Yes** (JWT) |
| `DELETE` | `/api/vault` | Delete the authenticated user's vault (cascades to all entries) | **Yes** (JWT) |
| `GET` | `/api/vault/entries` | List all encrypted entries for the authenticated user's vault | **Yes** (JWT) |
| `POST` | `/api/vault/entries` | Create a new encrypted vault entry | **Yes** (JWT) |
| `GET` | `/api/vault/entries/{id}` | Retrieve a single encrypted vault entry by UUID | **Yes** (JWT) |
| `PATCH` | `/api/vault/entries/{id}` | Update an encrypted vault entry payload and nonce by UUID | **Yes** (JWT) |
| `DELETE` | `/api/vault/entries/{id}` | Delete an encrypted vault entry by UUID | **Yes** (JWT) |

---

## 3. Authentication & Authorization Model

### Authentication:
All vault endpoints enforce standard JWT Bearer token authentication via `AuthMiddleware`:
```http
Authorization: Bearer <jwt_token>
```
The server resolves the authenticated user context directly from the verified token (`$GLOBALS['user']['id']`). Request body `user_id` parameters are ignored and never trusted.

### Authorization & Multi-Tenancy Isolation:
Every database query strictly enforces tenancy constraints:
```
Authenticated User (JWT)
        ↓
secure_vaults.user_id = :user_id
        ↓
secure_vault_entries.user_id = :user_id AND secure_vault_entries.vault_id = :vault_id
```
- **IDOR Defense**: Accessing an entry ID belonging to another user returns `404 NOT_FOUND` to prevent resource enumeration.
- **Single-Vault Invariant**: Users can create at most one secure vault. Duplicate creation attempts return `409 VAULT_EXISTS`.

---

## 4. Size Limits & Input Validation

To protect backend resources against denial-of-service and malicious payloads, strict validation rules and size limits are enforced:

| Field | Max Size / Length | Format / Constraints |
|---|---|---|
| `encrypted_dek` | **16 KB** (16,384 bytes) | Base64-encoded AES-256-GCM ciphertext |
| `encrypted_dek_nonce` | **255 chars** | Base64-encoded **exactly 12 bytes** (96-bit AES-GCM nonce) |
| `kdf_salt` | **255 chars** | Base64-encoded **16 to 64 bytes** (standard 32 bytes / 256 bits) |
| `kdf_iterations` | Integer | **Min: 100,000**, **Max: 5,000,000** (Standard: 600,000) |
| `kdf_algorithm` | String | Supported: `'PBKDF2-HMAC-SHA-256'`, `'argon2id'` |
| `encryption_algorithm` | String | Supported: `'AES-256-GCM'` |
| `encrypted_payload` | **1 MB** (1,048,576 bytes) | Base64-encoded AES-256-GCM ciphertext |
| `payload_nonce` | **255 chars** | Base64-encoded **exactly 12 bytes** (96-bit AES-GCM nonce) |
| `version` / `payload_version`| Integer | Positive integer $\ge 1$ |

Requests exceeding size limits are rejected with `HTTP 413 PAYLOAD_TOO_LARGE`. Unsupported algorithms or invalid encodings are rejected with `HTTP 400 INVALID_VAULT_DATA` or `INVALID_ENTRY_DATA`.

---

## 5. Detailed Endpoint Specifications

### 5.1. Create Vault — `POST /api/vault`

#### Request:
```json
{
  "version": 1,
  "kdf_algorithm": "PBKDF2-HMAC-SHA-256",
  "kdf_version": "1",
  "kdf_salt": "q3B+7hR9... (32 bytes Base64)",
  "kdf_iterations": 600000,
  "encryption_algorithm": "AES-256-GCM",
  "encrypted_dek": "8KxL... (Base64 encrypted DEK)",
  "encrypted_dek_nonce": "9Z1m... (12 bytes Base64 nonce)"
}
```

#### Response (`201 Created`):
```json
{
  "success": true,
  "data": {
    "vault": {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "user_id": 42,
      "version": 1,
      "kdf_algorithm": "PBKDF2-HMAC-SHA-256",
      "kdf_version": "1",
      "kdf_salt": "q3B+7hR9...",
      "kdf_memory_cost": null,
      "kdf_time_cost": null,
      "kdf_parallelism": null,
      "kdf_iterations": 600000,
      "encryption_algorithm": "AES-256-GCM",
      "encrypted_dek": "8KxL...",
      "encrypted_dek_nonce": "9Z1m...",
      "created_at": "2026-09-29 07:00:00",
      "updated_at": "2026-09-29 07:00:00",
      "last_unlocked_at": null
    }
  }
}
```

---

### 5.2. Get Vault — `GET /api/vault`

#### Response (`200 OK`):
```json
{
  "success": true,
  "data": {
    "vault": {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "user_id": 42,
      "version": 1,
      "kdf_algorithm": "PBKDF2-HMAC-SHA-256",
      "kdf_version": "1",
      "kdf_salt": "q3B+7hR9...",
      "kdf_memory_cost": null,
      "kdf_time_cost": null,
      "kdf_parallelism": null,
      "kdf_iterations": 600000,
      "encryption_algorithm": "AES-256-GCM",
      "encrypted_dek": "8KxL...",
      "encrypted_dek_nonce": "9Z1m...",
      "created_at": "2026-09-29 07:00:00",
      "updated_at": "2026-09-29 07:00:00",
      "last_unlocked_at": null
    }
  }
}
```
*Note: `last_unlocked_at` is NOT modified during GET requests, preserving server-side zero-knowledge guarantees.*

---

### 5.3. Rotate Master Password / Update Key — `PATCH /api/vault/key`

#### Request:
```json
{
  "encrypted_dek": "NewEncryptedDekBase64...",
  "encrypted_dek_nonce": "NewNonceBase64...",
  "kdf_salt": "NewSaltBase64...",
  "kdf_iterations": 600000,
  "kdf_algorithm": "PBKDF2-HMAC-SHA-256",
  "version": 1
}
```

#### Response (`200 OK`):
```json
{
  "success": true,
  "data": {
    "vault": {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "user_id": 42,
      "version": 1,
      "kdf_algorithm": "PBKDF2-HMAC-SHA-256",
      "kdf_version": "1",
      "kdf_salt": "NewSaltBase64...",
      "kdf_iterations": 600000,
      "encryption_algorithm": "AES-256-GCM",
      "encrypted_dek": "NewEncryptedDekBase64...",
      "encrypted_dek_nonce": "NewNonceBase64...",
      "created_at": "2026-09-29 07:00:00",
      "updated_at": "2026-09-29 07:15:00",
      "last_unlocked_at": null
    }
  }
}
```

---

### 5.4. Delete Vault — `DELETE /api/vault`

#### Response (`200 OK`):
```json
{
  "success": true,
  "message": "Vault deleted successfully"
}
```

---

### 5.5. List Entries — `GET /api/vault/entries`

#### Response (`200 OK`):
```json
{
  "success": true,
  "data": {
    "entries": [
      {
        "id": "a1b2c3d4-1234-5678-90ab-cdef12345678",
        "vault_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "encrypted_payload": "EncryptedBase64PayloadString...",
        "payload_nonce": "Base64Nonce12Bytes...",
        "payload_version": 1,
        "created_at": "2026-09-29 07:00:00",
        "updated_at": "2026-09-29 07:00:00"
      }
    ]
  }
}
```

---

### 5.6. Create Entry — `POST /api/vault/entries`

#### Request:
```json
{
  "encrypted_payload": "EncryptedBase64PayloadString...",
  "payload_nonce": "Base64Nonce12Bytes...",
  "payload_version": 1
}
```

#### Response (`201 Created`):
```json
{
  "success": true,
  "data": {
    "entry": {
      "id": "a1b2c3d4-1234-5678-90ab-cdef12345678",
      "vault_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "encrypted_payload": "EncryptedBase64PayloadString...",
      "payload_nonce": "Base64Nonce12Bytes...",
      "payload_version": 1,
      "created_at": "2026-09-29 07:00:00",
      "updated_at": "2026-09-29 07:00:00"
    }
  }
}
```

---

### 5.7. Get Single Entry — `GET /api/vault/entries/{id}`

#### Response (`200 OK`):
```json
{
  "success": true,
  "data": {
    "entry": {
      "id": "a1b2c3d4-1234-5678-90ab-cdef12345678",
      "vault_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "encrypted_payload": "EncryptedBase64PayloadString...",
      "payload_nonce": "Base64Nonce12Bytes...",
      "payload_version": 1,
      "created_at": "2026-09-29 07:00:00",
      "updated_at": "2026-09-29 07:00:00"
    }
  }
}
```

---

### 5.8. Update Entry — `PATCH /api/vault/entries/{id}`

#### Request:
```json
{
  "encrypted_payload": "NewEncryptedBase64PayloadString...",
  "payload_nonce": "NewBase64Nonce12Bytes...",
  "payload_version": 1
}
```

#### Response (`200 OK`):
```json
{
  "success": true,
  "data": {
    "entry": {
      "id": "a1b2c3d4-1234-5678-90ab-cdef12345678",
      "vault_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "encrypted_payload": "NewEncryptedBase64PayloadString...",
      "payload_nonce": "NewBase64Nonce12Bytes...",
      "payload_version": 1,
      "created_at": "2026-09-29 07:00:00",
      "updated_at": "2026-09-29 07:20:00"
    }
  }
}
```

---

### 5.9. Delete Entry — `DELETE /api/vault/entries/{id}`

#### Response (`200 OK`):
```json
{
  "success": true,
  "message": "Vault entry deleted successfully"
}
```

---

## 6. Error Handling & Standard Error Codes

All error responses adhere strictly to the production API format:
```json
{
  "success": false,
  "error": {
    "code": "<ERROR_CODE>",
    "message": "<SAFE_ERROR_MESSAGE>"
  }
}
```

| HTTP Status | Error Code | Example Scenario |
|---|---|---|
| `401 Unauthorized` | `UNAUTHORIZED` | Missing, expired, or invalid JWT token |
| `404 Not Found` | `NOT_FOUND` | Vault not initialized, or entry does not exist / unowned |
| `409 Conflict` | `VAULT_EXISTS` | Vault already exists for this user account |
| `400 Bad Request` | `INVALID_VAULT_DATA` | Invalid Base64, unsupported algorithm, bad salt/nonce |
| `400 Bad Request` | `INVALID_ENTRY_DATA` | Missing ciphertext, invalid nonce format |
| `413 Payload Too Large`| `PAYLOAD_TOO_LARGE` | Encrypted payload > 1 MB or encrypted DEK > 16 KB |
| `405 Method Not Allowed`| `METHOD_NOT_ALLOWED` | Invalid HTTP verb on endpoint |
| `500 Server Error` | `SERVER_ERROR` | Generic server failure (no SQL or stack details exposed) |

---

## 7. Zero-Knowledge Logging Policy

- Under NO circumstances do PHP server error logs or access logs capture:
  - Master passwords
  - Decrypted entry fields (passwords, usernames, secrets, notes, URLs)
  - Raw JSON bodies of vault endpoints
  - JWT authorization credentials
- All internal database or PDO exceptions caught by controllers log sanitized error codes without echoing client request ciphertext.

---

## 8. Frontend Integration Guidelines (For Phase v1.1.3+)

When connecting the Next.js frontend to this API:
1. **Vault Initialization**: Use `src/lib/crypto/vault.ts` (`deriveKeyFromMasterPassword`, `generateVaultKey`, `encryptVaultKey`) -> `POST /api/vault`.
2. **Vault Unlock**: `GET /api/vault` -> `deriveKeyFromMasterPassword` -> `decryptVaultKey` to restore DEK in volatile memory.
3. **Entry Operations**: Encrypt entry payload locally (`encryptVaultPayload`) with the DEK -> dispatch ciphertext to `POST /api/vault/entries` or `PATCH /api/vault/entries/{id}`.
4. **Master Password Rotation**: `reencryptVaultKey` -> `PATCH /api/vault/key`. Zero entry re-encryption required.
