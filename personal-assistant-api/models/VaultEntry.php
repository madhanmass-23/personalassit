<?php

namespace Models;

use Config\Database;
use Utils\Uuid;
use PDO;
use PDOException;

class VaultEntry {
    /**
     * Find all encrypted entries for a user's vault.
     *
     * @param string $vaultId
     * @param int|string $userId
     * @return array
     */
    public static function findAllByVaultId(string $vaultId, $userId): array {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("
            SELECT 
                id,
                vault_id,
                encrypted_payload,
                payload_nonce,
                payload_version,
                created_at,
                updated_at
            FROM secure_vault_entries 
            WHERE vault_id = :vault_id AND user_id = :user_id 
            ORDER BY created_at DESC, id DESC
        ");
        $stmt->execute([
            'vault_id' => $vaultId,
            'user_id' => $userId
        ]);

        $rows = $stmt->fetchAll();
        return array_map([self::class, 'formatEntry'], $rows);
    }

    /**
     * Find a single encrypted entry by entry ID and user ID (enforcing strict ownership).
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
                vault_id,
                encrypted_payload,
                payload_nonce,
                payload_version,
                created_at,
                updated_at
            FROM secure_vault_entries 
            WHERE id = :id AND user_id = :user_id 
            LIMIT 1
        ");
        $stmt->execute([
            'id' => $id,
            'user_id' => $userId
        ]);

        $entry = $stmt->fetch();
        if (!$entry) {
            return null;
        }

        return self::formatEntry($entry);
    }

    /**
     * Create a new encrypted vault entry.
     *
     * @param string $vaultId
     * @param int|string $userId
     * @param array $data
     * @return array Created entry
     * @throws PDOException
     */
    public static function create(string $vaultId, $userId, array $data): array {
        $db = Database::getInstance()->getConnection();
        $id = Uuid::v4();

        $sql = "
            INSERT INTO secure_vault_entries (
                id,
                vault_id,
                user_id,
                encrypted_payload,
                payload_nonce,
                payload_version
            ) VALUES (
                :id,
                :vault_id,
                :user_id,
                :encrypted_payload,
                :payload_nonce,
                :payload_version
            )
        ";

        $stmt = $db->prepare($sql);
        $stmt->execute([
            'id' => $id,
            'vault_id' => $vaultId,
            'user_id' => $userId,
            'encrypted_payload' => $data['encrypted_payload'],
            'payload_nonce' => $data['payload_nonce'],
            'payload_version' => isset($data['payload_version']) ? (int)$data['payload_version'] : 1
        ]);

        return self::findByIdAndUser($id, $userId);
    }

    /**
     * Update an encrypted vault entry payload and nonce.
     *
     * @param string $id
     * @param int|string $userId
     * @param array $data
     * @return array|null Updated entry
     */
    public static function updateEncryptedPayload(string $id, $userId, array $data): ?array {
        $db = Database::getInstance()->getConnection();

        $sets = [];
        $params = [
            'id' => $id,
            'user_id' => $userId
        ];

        if (array_key_exists('encrypted_payload', $data)) {
            $sets[] = 'encrypted_payload = :encrypted_payload';
            $params['encrypted_payload'] = $data['encrypted_payload'];
        }

        if (array_key_exists('payload_nonce', $data)) {
            $sets[] = 'payload_nonce = :payload_nonce';
            $params['payload_nonce'] = $data['payload_nonce'];
        }

        if (array_key_exists('payload_version', $data)) {
            $sets[] = 'payload_version = :payload_version';
            $params['payload_version'] = (int)$data['payload_version'];
        }

        if (empty($sets)) {
            return self::findByIdAndUser($id, $userId);
        }

        $sql = "UPDATE secure_vault_entries SET " . implode(', ', $sets) . " WHERE id = :id AND user_id = :user_id";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        return self::findByIdAndUser($id, $userId);
    }

    /**
     * Delete an encrypted vault entry by ID and user ID.
     *
     * @param string $id
     * @param int|string $userId
     * @return bool
     */
    public static function deleteByIdAndUser(string $id, $userId): bool {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("DELETE FROM secure_vault_entries WHERE id = :id AND user_id = :user_id");
        $stmt->execute([
            'id' => $id,
            'user_id' => $userId
        ]);

        return $stmt->rowCount() > 0;
    }

    /**
     * Format entry record for response consistency.
     *
     * @param array $entry
     * @return array
     */
    private static function formatEntry(array $entry): array {
        return [
            'id' => (string)$entry['id'],
            'vault_id' => (string)$entry['vault_id'],
            'encrypted_payload' => (string)$entry['encrypted_payload'],
            'payload_nonce' => (string)$entry['payload_nonce'],
            'payload_version' => (int)$entry['payload_version'],
            'created_at' => $entry['created_at'],
            'updated_at' => $entry['updated_at']
        ];
    }
}
