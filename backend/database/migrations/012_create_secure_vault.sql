-- Migration 012: Create Secure Vault and Secure Vault Entries
-- Personal Assistant v1.1 — Secure Vault Architecture
-- Zero-Knowledge Envelope Encryption: Master Password -> KEK -> DEK -> Vault Entries
-- Server stores only ciphertext, salts, and nonces. Plaintext secrets are never sent to or stored in MySQL.

CREATE TABLE IF NOT EXISTS secure_vaults (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    version INT NOT NULL DEFAULT 1,
    kdf_algorithm VARCHAR(50) NOT NULL DEFAULT 'PBKDF2-HMAC-SHA-256',
    kdf_version VARCHAR(20) NULL DEFAULT '1',
    kdf_salt VARCHAR(255) NOT NULL,
    kdf_memory_cost INT UNSIGNED NULL,
    kdf_time_cost INT UNSIGNED NULL,
    kdf_parallelism INT UNSIGNED NULL,
    kdf_iterations INT UNSIGNED NULL DEFAULT 600000,
    encryption_algorithm VARCHAR(50) NOT NULL DEFAULT 'AES-256-GCM',
    encrypted_dek TEXT NOT NULL,
    encrypted_dek_nonce VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_unlocked_at TIMESTAMP NULL DEFAULT NULL,

    UNIQUE INDEX uk_secure_vaults_user (user_id),
    INDEX idx_secure_vaults_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS secure_vault_entries (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    vault_id VARCHAR(36) NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    encrypted_payload LONGTEXT NOT NULL,
    payload_nonce VARCHAR(255) NOT NULL,
    payload_version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_vault_entries_vault (vault_id),
    INDEX idx_vault_entries_user (user_id),
    FOREIGN KEY (vault_id) REFERENCES secure_vaults(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
