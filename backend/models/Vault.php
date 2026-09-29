<?php

namespace Models;

use Config\Database;
use Utils\Uuid;
use PDO;
use PDOException;

class Vault {
    /**
     * Find a user's vault by user ID.
     *
     * @param int|string $userId
     * @return array|null
     */
    public static function findByUserId($userId): ?array {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("
            SELECT 
                id,
                user_id,
                version,
                kdf_algorithm,
                kdf_version,
                kdf_salt,
                kdf_memory_cost,
                kdf_time_cost,
                kdf_parallelism,
                kdf_iterations,
                encryption_algorithm,
                encrypted_dek,
                encrypted_dek_nonce,
                created_at,
                updated_at,
                last_unlocked_at
            FROM secure_vaults 
            WHERE user_id = :user_id 
            LIMIT 1
        ");
        $stmt->execute(['user_id' => $userId]);
        $vault = $stmt->fetch();
        
        if (!$vault) {
            return null;
        }

        return self::formatVault($vault);
    }

    /**
     * Find a vault by vault ID and user ID.
     *
     * @param string $id
     * @param int|string $userId
     * @return array|null
     */
    public static function findByIdAndUser(string $id, $userId): ?array {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("
            SELECT 
                id,
                user_id,
                version,
                kdf_algorithm,
                kdf_version,
                kdf_salt,
                kdf_memory_cost,
                kdf_time_cost,
                kdf_parallelism,
                kdf_iterations,
                encryption_algorithm,
                encrypted_dek,
                encrypted_dek_nonce,
                created_at,
                updated_at,
                last_unlocked_at
            FROM secure_vaults 
            WHERE id = :id AND user_id = :user_id 
            LIMIT 1
        ");
        $stmt->execute([
            'id' => $id,
            'user_id' => $userId
        ]);
        $vault = $stmt->fetch();

        if (!$vault) {
            return null;
        }

        return self::formatVault($vault);
    }

    /**
     * Create a new secure vault record for a user.
     *
     * @param int|string $userId
     * @param array $data
     * @return array Created vault record
     * @throws PDOException
     */
    public static function create($userId, array $data): array {
        $db = Database::getInstance()->getConnection();
        $id = Uuid::v4();

        $sql = "
            INSERT INTO secure_vaults (
                id,
                user_id,
                version,
                kdf_algorithm,
                kdf_version,
                kdf_salt,
                kdf_memory_cost,
                kdf_time_cost,
                kdf_parallelism,
                kdf_iterations,
                encryption_algorithm,
                encrypted_dek,
                encrypted_dek_nonce
            ) VALUES (
                :id,
                :user_id,
                :version,
                :kdf_algorithm,
                :kdf_version,
                :kdf_salt,
                :kdf_memory_cost,
                :kdf_time_cost,
                :kdf_parallelism,
                :kdf_iterations,
                :encryption_algorithm,
                :encrypted_dek,
                :encrypted_dek_nonce
            )
        ";

        $stmt = $db->prepare($sql);
        $stmt->execute([
            'id' => $id,
            'user_id' => $userId,
            'version' => isset($data['version']) ? (int)$data['version'] : 1,
            'kdf_algorithm' => $data['kdf_algorithm'] ?? 'PBKDF2-HMAC-SHA-256',
            'kdf_version' => $data['kdf_version'] ?? '1',
            'kdf_salt' => $data['kdf_salt'],
            'kdf_memory_cost' => isset($data['kdf_memory_cost']) ? (int)$data['kdf_memory_cost'] : null,
            'kdf_time_cost' => isset($data['kdf_time_cost']) ? (int)$data['kdf_time_cost'] : null,
            'kdf_parallelism' => isset($data['kdf_parallelism']) ? (int)$data['kdf_parallelism'] : null,
            'kdf_iterations' => isset($data['kdf_iterations']) ? (int)$data['kdf_iterations'] : 600000,
            'encryption_algorithm' => $data['encryption_algorithm'] ?? 'AES-256-GCM',
            'encrypted_dek' => $data['encrypted_dek'],
            'encrypted_dek_nonce' => $data['encrypted_dek_nonce']
        ]);

        return self::findByUserId($userId);
    }

    /**
     * Update encrypted DEK and KDF parameters for master password rotation.
     *
     * @param int|string $userId
     * @param array $data
     * @return array|null Updated vault record
     */
    public static function updateEncryptedKey($userId, array $data): ?array {
        $db = Database::getInstance()->getConnection();

        $sets = [
            'encrypted_dek = :encrypted_dek',
            'encrypted_dek_nonce = :encrypted_dek_nonce',
            'kdf_salt = :kdf_salt'
        ];

        $params = [
            'user_id' => $userId,
            'encrypted_dek' => $data['encrypted_dek'],
            'encrypted_dek_nonce' => $data['encrypted_dek_nonce'],
            'kdf_salt' => $data['kdf_salt']
        ];

        if (isset($data['kdf_iterations'])) {
            $sets[] = 'kdf_iterations = :kdf_iterations';
            $params['kdf_iterations'] = (int)$data['kdf_iterations'];
        }

        if (isset($data['kdf_algorithm'])) {
            $sets[] = 'kdf_algorithm = :kdf_algorithm';
            $params['kdf_algorithm'] = $data['kdf_algorithm'];
        }

        if (isset($data['kdf_version'])) {
            $sets[] = 'kdf_version = :kdf_version';
            $params['kdf_version'] = $data['kdf_version'];
        }

        if (isset($data['version'])) {
            $sets[] = 'version = :version';
            $params['version'] = (int)$data['version'];
        }

        if (isset($data['encryption_algorithm'])) {
            $sets[] = 'encryption_algorithm = :encryption_algorithm';
            $params['encryption_algorithm'] = $data['encryption_algorithm'];
        }

        $sql = "UPDATE secure_vaults SET " . implode(', ', $sets) . " WHERE user_id = :user_id";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        return self::findByUserId($userId);
    }

    /**
     * Delete the authenticated user's vault.
     * Foreign key CASCADE automatically removes all associated entries.
     *
     * @param int|string $userId
     * @return bool
     */
    public static function deleteByUserId($userId): bool {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("DELETE FROM secure_vaults WHERE user_id = :user_id");
        $stmt->execute(['user_id' => $userId]);
        return $stmt->rowCount() > 0;
    }

    /**
     * Format vault record types for response consistency.
     *
     * @param array $vault
     * @return array
     */
    private static function formatVault(array $vault): array {
        return [
            'id' => (string)$vault['id'],
            'user_id' => (int)$vault['user_id'],
            'version' => (int)$vault['version'],
            'kdf_algorithm' => (string)$vault['kdf_algorithm'],
            'kdf_version' => $vault['kdf_version'] !== null ? (string)$vault['kdf_version'] : null,
            'kdf_salt' => (string)$vault['kdf_salt'],
            'kdf_memory_cost' => $vault['kdf_memory_cost'] !== null ? (int)$vault['kdf_memory_cost'] : null,
            'kdf_time_cost' => $vault['kdf_time_cost'] !== null ? (int)$vault['kdf_time_cost'] : null,
            'kdf_parallelism' => $vault['kdf_parallelism'] !== null ? (int)$vault['kdf_parallelism'] : null,
            'kdf_iterations' => (int)$vault['kdf_iterations'],
            'encryption_algorithm' => (string)$vault['encryption_algorithm'],
            'encrypted_dek' => (string)$vault['encrypted_dek'],
            'encrypted_dek_nonce' => (string)$vault['encrypted_dek_nonce'],
            'created_at' => $vault['created_at'],
            'updated_at' => $vault['updated_at'],
            'last_unlocked_at' => $vault['last_unlocked_at'] ?? null
        ];
    }
}