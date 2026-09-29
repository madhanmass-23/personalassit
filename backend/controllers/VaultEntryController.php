<?php

namespace Controllers;

use Models\Vault;
use Models\VaultEntry;
use Utils\Response;
use Utils\Uuid;
use Exception;

class VaultEntryController {
    // Maximum allowable sizes
    private const MAX_ENCRYPTED_PAYLOAD_BYTES = 1048576; // 1 MB

    /**
     * GET /api/vault/entries
     * List all encrypted entries for the authenticated user's vault.
     */
    public static function index() {
        $userId = self::getAuthenticatedUserId();

        try {
            $vault = Vault::findByUserId($userId);
            if (!$vault) {
                Response::json(['entries' => []]);
            }

            $entries = VaultEntry::findAllByVaultId($vault['id'], $userId);
            Response::json(['entries' => $entries]);
        } catch (Exception $e) {
            error_log("VaultEntryController::index error: " . $e->getMessage());
            Response::error('An error occurred while retrieving vault entries', 'SERVER_ERROR', 500);
        }
    }

    /**
     * POST /api/vault/entries
     * Create a new encrypted entry in the user's vault.
     */
    public static function create() {
        $userId = self::getAuthenticatedUserId();

        try {
            $vault = Vault::findByUserId($userId);
            if (!$vault) {
                Response::error('Secure vault not found. Please initialize your vault before creating entries.', 'NOT_FOUND', 404);
            }

            $rawBody = file_get_contents('php://input');
            if (empty($rawBody)) {
                Response::error('Request body is required', 'INVALID_ENTRY_DATA', 400);
            }

            $data = json_decode($rawBody, true);
            if (!is_array($data)) {
                Response::error('Invalid JSON payload', 'INVALID_ENTRY_DATA', 400);
            }

            // Validate Encrypted Payload
            $payload = $data['encrypted_payload'] ?? '';
            if (!is_string($payload) || !self::isValidBase64($payload)) {
                Response::error('Invalid encrypted payload (must be valid Base64 ciphertext string)', 'INVALID_ENTRY_DATA', 400);
            }
            if (strlen($payload) > self::MAX_ENCRYPTED_PAYLOAD_BYTES) {
                Response::error('Encrypted payload exceeds maximum allowed size (1 MB)', 'PAYLOAD_TOO_LARGE', 413);
            }

            // Validate Payload Nonce (AES-GCM 96-bit nonce = exactly 12 bytes)
            $nonce = $data['payload_nonce'] ?? '';
            if (!is_string($nonce) || !self::isValidNonce($nonce)) {
                Response::error('Invalid payload nonce (must be valid Base64-encoded 12-byte AES-GCM nonce)', 'INVALID_ENTRY_DATA', 400);
            }

            // Validate Payload Version
            $version = isset($data['payload_version']) ? (int)$data['payload_version'] : 1;
            if ($version < 1) {
                Response::error('Payload version must be a positive integer', 'INVALID_ENTRY_DATA', 400);
            }

            $filtered = [
                'encrypted_payload' => $payload,
                'payload_nonce' => $nonce,
                'payload_version' => $version
            ];

            $entry = VaultEntry::create($vault['id'], $userId, $filtered);
            Response::json(['entry' => $entry], 201);
        } catch (Exception $e) {
            error_log("VaultEntryController::create error: " . $e->getMessage());
            Response::error('Failed to create vault entry', 'SERVER_ERROR', 500);
        }
    }

    /**
     * GET /api/vault/entries/{id}
     * Retrieve a single encrypted vault entry by ID.
     */
    public static function show(string $id) {
        $userId = self::getAuthenticatedUserId();

        if (empty($id)) {
            Response::error('Entry ID is required', 'INVALID_ENTRY_DATA', 400);
        }

        try {
            $entry = VaultEntry::findByIdAndUser($id, $userId);
            if (!$entry) {
                Response::error('Vault entry not found', 'NOT_FOUND', 404);
            }

            Response::json(['entry' => $entry]);
        } catch (Exception $e) {
            error_log("VaultEntryController::show error: " . $e->getMessage());
            Response::error('An error occurred while retrieving vault entry', 'SERVER_ERROR', 500);
        }
    }

    /**
     * PATCH /api/vault/entries/{id}
     * Update an encrypted vault entry.
     */
    public static function update(string $id) {
        $userId = self::getAuthenticatedUserId();

        if (empty($id)) {
            Response::error('Entry ID is required', 'INVALID_ENTRY_DATA', 400);
        }

        try {
            $existing = VaultEntry::findByIdAndUser($id, $userId);
            if (!$existing) {
                Response::error('Vault entry not found', 'NOT_FOUND', 404);
            }

            $rawBody = file_get_contents('php://input');
            if (empty($rawBody)) {
                Response::error('Request body is required', 'INVALID_ENTRY_DATA', 400);
            }

            $data = json_decode($rawBody, true);
            if (!is_array($data)) {
                Response::error('Invalid JSON payload', 'INVALID_ENTRY_DATA', 400);
            }

            $filtered = [];

            // Validate Encrypted Payload if provided
            if (array_key_exists('encrypted_payload', $data)) {
                $payload = $data['encrypted_payload'];
                if (!is_string($payload) || !self::isValidBase64($payload)) {
                    Response::error('Invalid encrypted payload (must be valid Base64 ciphertext string)', 'INVALID_ENTRY_DATA', 400);
                }
                if (strlen($payload) > self::MAX_ENCRYPTED_PAYLOAD_BYTES) {
                    Response::error('Encrypted payload exceeds maximum allowed size (1 MB)', 'PAYLOAD_TOO_LARGE', 413);
                }
                $filtered['encrypted_payload'] = $payload;
            }

            // Validate Payload Nonce if provided
            if (array_key_exists('payload_nonce', $data)) {
                $nonce = $data['payload_nonce'];
                if (!is_string($nonce) || !self::isValidNonce($nonce)) {
                    Response::error('Invalid payload nonce (must be valid Base64-encoded 12-byte AES-GCM nonce)', 'INVALID_ENTRY_DATA', 400);
                }
                $filtered['payload_nonce'] = $nonce;
            }

            // Validate Payload Version if provided
            if (array_key_exists('payload_version', $data)) {
                $version = (int)$data['payload_version'];
                if ($version < 1) {
                    Response::error('Payload version must be a positive integer', 'INVALID_ENTRY_DATA', 400);
                }
                $filtered['payload_version'] = $version;
            }

            if (empty($filtered)) {
                Response::json(['entry' => $existing]);
            }

            $updatedEntry = VaultEntry::updateEncryptedPayload($id, $userId, $filtered);
            Response::json(['entry' => $updatedEntry]);
        } catch (Exception $e) {
            error_log("VaultEntryController::update error: " . $e->getMessage());
            Response::error('Failed to update vault entry', 'SERVER_ERROR', 500);
        }
    }

    /**
     * DELETE /api/vault/entries/{id}
     * Delete an encrypted vault entry.
     */
    public static function delete(string $id) {
        $userId = self::getAuthenticatedUserId();

        if (empty($id)) {
            Response::error('Entry ID is required', 'INVALID_ENTRY_DATA', 400);
        }

        try {
            $existing = VaultEntry::findByIdAndUser($id, $userId);
            if (!$existing) {
                Response::error('Vault entry not found', 'NOT_FOUND', 404);
            }

            VaultEntry::deleteByIdAndUser($id, $userId);
            Response::message('Vault entry deleted successfully');
        } catch (Exception $e) {
            error_log("VaultEntryController::delete error: " . $e->getMessage());
            Response::error('Failed to delete vault entry', 'SERVER_ERROR', 500);
        }
    }

    /**
     * Resolve the authenticated user ID from context.
     *
     * @return int|string
     */
    private static function getAuthenticatedUserId() {
        $userId = $GLOBALS['user']['id'] ?? $_SESSION['user_id'] ?? null;
        if (!$userId) {
            Response::error('Authentication required', 'UNAUTHORIZED', 401);
        }
        return $userId;
    }

    /**
     * Validate whether a string is valid Base64.
     */
    public static function isValidBase64(string $str): bool {
        if ($str === '' || strlen($str) % 4 !== 0) {
            return false;
        }
        if (!preg_match('/^[a-zA-Z0-9\+\/]+={0,2}$/', $str)) {
            return false;
        }
        $decoded = base64_decode($str, true);
        return $decoded !== false;
    }

    /**
     * Validate 96-bit (12-byte) AES-GCM nonce encoded in Base64.
     */
    public static function isValidNonce(string $str): bool {
        if (strlen($str) > 255 || !self::isValidBase64($str)) {
            return false;
        }
        $decoded = base64_decode($str, true);
        return $decoded !== false && strlen($decoded) === 12; // Exactly 12 bytes
    }
}
