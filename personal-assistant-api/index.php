<?php
/**
 * PUBLIC DEPLOYMENT BOOTSTRAP
 * 
 * This file lives in public_html/personal-assistant-api/index.php
 * It securely loads the isolated private backend.
 * 
 * Adjust the relative path if your server structure differs.
 */

$private_backend_path = realpath(__DIR__ . '/../../personal-assistant-backend/public/index.php');

if (!$private_backend_path || !file_exists($private_backend_path)) {
    header('HTTP/1.1 500 Internal Server Error');
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'error' => [
            'message' => 'Private backend not found. Verify server deployment structure.',
            'code' => 'BACKEND_NOT_FOUND'
        ]
    ]);
    exit;
}

require $private_backend_path;
