<?php

namespace Controllers;

use Models\Vault;
use Utils\Response;
use PDOException;
use Exception;

class VaultController {
    // Maximum allowable sizes
    private const MAX_ENCRYPTED_DEK_BYTES = 16384;      // 16 KB
    private const MIN_KDF_ITERATIONS = 100000;
    private const MAX_KDF_ITERATIONS = 5000000;
    private const SUPPORTED_KDF_ALGORITHMS = ['PBKDF2-HMAC-SHA-256', 'argon2id'];
    private const SUPPORTED_ENCRYPTION_ALGORITHMS = ['AES-256-GCM'];

    /**
     * GET /api/vault
     * Get the authenticated user's secure vault metadata and encrypted DEK.
     */
    public static function get() {
        $userId = self::getAuthenticatedUserId();

        try {
            $vault = Vault::findByUserId($userId);
            if (!$vault) {
                Response::error('Secure vault not found', 'NOT_FOUND', 404);
            }

            Response::json(['vault' => $vault]);
        } catch (Exception $e) {
            error_log("VaultController::get error: " . $e->getMessage());
            Response::error('An error occurred while retrieving secure vault', 'SERVER_ERROR', 500);
        }
    }

    /**
     * POST /api/vault
     * Create a new secure vault for the authenticated user.
     */
    public static function create() {
        $userId = self::getAuthenticatedUserId();

        $rawBody = file_get_contents('php://input');
        if (empty($rawBody)) {
            Response::error('Request body is required', 'INVALID_VAULT_DATA', 400);
        }

        $data = json_decode($rawBody, true);
        if (!is_array($data)) {
            Response::error('Invalid JSON payload', 'INVALID_VAULT_DATA', 400);
        }

        // Check if vault already exists for this user
        $existingVault = Vault::findByUserId($userId);
        if ($existingVault) {
            Response::error('Secure vault already exists', 'VAULT_EXISTS', 409);
        }

        // Validate KDF Algorithm
        $kdfAlgorithm = $data['kdf_algorithm'] ?? 'PBKDF2-HMAC-SHA-256';
        if (!in_array($kdfAlgorithm, self::SUPPORTED_KDF_ALGORITHMS, true)) {
            Response::error('Unsupported KDF algorithm: ' . htmlspecialchars((string)$kdfAlgorithm), 'INVALID_VAULT_DATA', 400);
        }

        // Validate Encryption Algorithm
        $encryptionAlgorithm = $data['encryption_algorithm'] ?? 'AES-256-GCM';
        if (!in_array($encryptionAlgorithm, self::SUPPORTED_ENCRYPTION_ALGORITHMS, true)) {
            Response::error('Unsupported encryption algorithm: ' . htmlspecialchars((string)$encryptionAlgorithm), 'INVALID_VAULT_DATA', 400);
        }

        // Validate KDF Salt
        $salt = $data['kdf_salt'] ?? '';
        if (!is_string($salt) || !self::isValidSalt($salt)) {
            Response::error('Invalid KDF salt (must be valid Base64 string between 16 and 64 bytes)', 'INVALID_VAULT_DATA', 400);
        }

        // Validate KDF Iterations
        $iterations = isset($data['kdf_iterations']) ? (int)$data['kdf_iterations'] : 600000;
        if ($iterations < self::MIN_KDF_ITERATIONS || $iterations > self::MAX_KDF_ITERATIONS) {
            Response::error('KDF iterations must be between ' . self::MIN_KDF_ITERATIONS . ' and ' . self::MAX_KDF_ITERATIONS, 'INVALID_VAULT_DATA', 400);
        }

        // Validate Encrypted DEK
        $encryptedDek = $data['encrypted_dek'] ?? '';
        if (!is_string($encryptedDek) || !self::isValidBase64($encryptedDek)) {
            Response::error('Invalid encrypted DEK (must be valid Base64 string)', 'INVALID_VAULT_DATA', 400);
        }
        if (strlen($encryptedDek) > self::MAX_ENCRYPTED_DEK_BYTES) {
            Response::error('Encrypted DEK exceeds maximum allowed size (16 KB)', 'PAYLOAD_TOO_LARGE', 413);
        }

        // Validate Encrypted DEK Nonce (AES-GCM 96-bit nonce = exactly 12 bytes)
        $nonce = $data['encrypted_dek_nonce'] ?? '';
        if (!is_string($nonce) || !self::isValidNonce($nonce)) {
            Response::error('Invalid encrypted DEK nonce (must be valid Base64-encoded 12-byte AES-GCM nonce)', 'INVALID_VAULT_DATA', 400);
        }

        // Validate Version
        $version = isset($data['version']) ? (int)$data['version'] : 1;
        if ($version < 1) {
            Response::error('Version must be a positive integer', 'INVALID_VAULT_DATA', 400);
        }

        // Prepare sanitized payload
        $filtered = [
            'version' => $version,
            'kdf_algorithm' => $kdfAlgorithm,
            'kdf_version' => isset($data['kdf_version']) ? (string)$data['kdf_version'] : '1',
            'kdf_salt' => $salt,
            'kdf_iterations' => $iterations,
            'kdf_memory_cost' => isset($data['kdf_memory_cost']) ? (int)$data['kdf_memory_cost'] : null,
            'kdf_time_cost' => isset($data['kdf_time_cost']) ? (int)$data['kdf_time_cost'] : null,
            'kdf_parallelism' => isset($data['kdf_parallelism']) ? (int)$data['kdf_parallelism'] : null,
            'encryption_algorithm' => $encryptionAlgorithm,
            'encrypted_dek' => $encryptedDek,
            'encrypted_dek_nonce' => $nonce
        ];

        try {
            $createdVault = Vault::create($userId, $filtered);
            Response::json(['vault' => $createdVault], 201);
        } catch (PDOException $e) {
            // Handle unique constraint violation on user_id
            if ($e->getCode() == 23000 || strpos($e->getMessage(), 'Duplicate entry') !== false) {
                Response::error('Secure vault already exists', 'VAULT_EXISTS', 409);
            }
            error_log("VaultController::create PDOException: " . $e->getMessage());
            Response::error('Failed to create secure vault', 'SERVER_ERROR', 500);
        } catch (Exception $e) {
            error_log("VaultController::create Exception: " . $e->getMessage());
            Response::error('Failed to create secure vault', 'SERVER_ERROR', 500);
        }
    }

    /**
     * PATCH /api/vault/key
     * Update the encrypted DEK and KDF parameters (Master Password Rotation).
     */
    public static function updateKey() {
        $userId = self::getAuthenticatedUserId();

        $existingVault = Vault::findByUserId($userId);
        if (!$existingVault) {
            Response::error('Secure vault not found', 'NOT_FOUND', 404);
        }

        $rawBody = file_get_contents('php://input');
        if (empty($rawBody)) {
            Response::error('Request body is required', 'INVALID_VAULT_DATA', 400);
        }

        $data = json_decode($rawBody, true);
        if (!is_array($data)) {
            Response::error('Invalid JSON payload', 'INVALID_VAULT_DATA', 400);
        }

        // Validate Encrypted DEK
        $encryptedDek = $data['encrypted_dek'] ?? '';
        if (!is_string($encryptedDek) || !self::isValidBase64($encryptedDek)) {
            Response::error('Invalid encrypted DEK (must be valid Base64 string)', 'INVALID_VAULT_DATA', 400);
        }
        if (strlen($encryptedDek) > self::MAX_ENCRYPTED_DEK_BYTES) {
            Response::error('Encrypted DEK exceeds maximum allowed size (16 KB)', 'PAYLOAD_TOO_LARGE', 413);
        }

        // Validate Nonce
        $nonce = $data['encrypted_dek_nonce'] ?? $data['nonce'] ?? '';
        if (!is_string($nonce) || !self::isValidNonce($nonce)) {
            Response::error('Invalid encrypted DEK nonce (must be valid Base64-encoded 12-byte AES-GCM nonce)', 'INVALID_VAULT_DATA', 400);
        }

        // Validate Salt
        $salt = $data['kdf_salt'] ?? '';
        if (!is_string($salt) || !self::isValidSalt($salt)) {
            Response::error('Invalid KDF salt (must be valid Base64 string between 16 and 64 bytes)', 'INVALID_VAULT_DATA', 400);
        }

        $filtered = [
            'encrypted_dek' => $encryptedDek,
            'encrypted_dek_nonce' => $nonce,
            'kdf_salt' => $salt
        ];

        // Optional KDF Iterations
        if (isset($data['kdf_iterations'])) {
            $iterations = (int)$data['kdf_iterations'];
            if ($iterations < self::MIN_KDF_ITERATIONS || $iterations > self::MAX_KDF_ITERATIONS) {
                Response::error('KDF iterations must be between ' . self::MIN_KDF_ITERATIONS . ' and ' . self::MAX_KDF_ITERATIONS, 'INVALID_VAULT_DATA', 400);
            }
            $filtered['kdf_iterations'] = $iterations;
        }

        // Optional KDF Algorithm
        if (isset($data['kdf_algorithm'])) {
            if (!in_array($data['kdf_algorithm'], self::SUPPORTED_KDF_ALGORITHMS, true)) {
                Response::error('Unsupported KDF algorithm: ' . htmlspecialchars((string)$data['kdf_algorithm']), 'INVALID_VAULT_DATA', 400);
            }
            $filtered['kdf_algorithm'] = $data['kdf_algorithm'];
        }

        // Optional KDF Version
        if (isset($data['kdf_version'])) {
            $filtered['kdf_version'] = (string)$data['kdf_version'];
        }

        // Optional Version
        if (isset($data['version'])) {
            $version = (int)$data['version'];
            if ($version < 1) {
                Response::error('Version must be a positive integer', 'INVALID_VAULT_DATA', 400);
            }
            $filtered['version'] = $version;
        }

        try {
            $updatedVault = Vault::updateEncryptedKey($userId, $filtered);
            Response::json(['vault' => $updatedVault]);
        } catch (Exception $e) {
            error_log("VaultController::updateKey error: " . $e->getMessage());
            Response::error('Failed to update secure vault key', 'SERVER_ERROR', 500);
        }
    }

    /**
     * DELETE /api/vault
     * Delete the authenticated user's secure vault and all associated entries.
     */
    public static function delete() {
        $userId = self::getAuthenticatedUserId();

        $existingVault = Vault::findByUserId($userId);
        if (!$existingVault) {
            Response::error('Secure vault not found', 'NOT_FOUND', 404);
        }

        try {
            Vault::deleteByUserId($userId);
            Response::message('Vault deleted successfully');
        } catch (Exception $e) {
            error_log("VaultController::delete error: " . $e->getMessage());
            Response::error('Failed to delete secure vault', 'SERVER_ERROR', 500);
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

    /**
     * Validate KDF salt encoded in Base64 (16 to 64 bytes).
     */
    public static function isValidSalt(string $str): bool {
        if (strlen($str) > 255 || !self::isValidBase64($str)) {
            return false;
        }
        $decoded = base64_decode($str, true);
        if ($decoded === false) {
            return false;
        }
        $len = strlen($decoded);
        return $len >= 16 && $len <= 64; // At least 128-bit, standard 256-bit
    }
}
