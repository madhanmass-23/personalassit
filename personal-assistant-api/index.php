<?php
/**
 * PUBLIC DEPLOYMENT BOOTSTRAP GATEWAY
 * 
 * Location on ServerByte: public_html/personal-assistant-api/index.php
 * Securely routes all incoming requests to the isolated private backend:
 * /home/sites/scaro.online/personal-assistant-backend/public/index.php
 */

// 1. Extract Bearer token or cookie to populate session for legacy controllers
$rawAuthHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
if (!$rawAuthHeader && function_exists('getallheaders')) {
    $allHeaders = getallheaders();
    foreach ($allHeaders as $hdrKey => $hdrVal) {
        if (strtolower($hdrKey) === 'authorization') {
            $rawAuthHeader = $hdrVal;
            break;
        }
    }
}

$bootstrapToken = null;
if ($rawAuthHeader && preg_match('/Bearer\s+(\S+)/i', $rawAuthHeader, $matches)) {
    $bootstrapToken = $matches[1];
} elseif (isset($_COOKIE['auth_token'])) {
    $bootstrapToken = $_COOKIE['auth_token'];
}

if ($bootstrapToken) {
    $tokenSegments = explode('.', $bootstrapToken);
    if (count($tokenSegments) === 3) {
        $jwtPayload = json_decode(base64_decode(strtr($tokenSegments[1], '-_', '+/')), true);
        if ($jwtPayload && isset($jwtPayload['user_id'])) {
            if (session_status() === PHP_SESSION_NONE && !headers_sent()) {
                @session_start();
            }
            $_SESSION['user_id'] = $jwtPayload['user_id'];
        }
    }
}

// 2. Resolve private backend path with fallback candidate locations
$candidate_paths = [
    __DIR__ . '/../../personal-assistant-backend/public/index.php',
    realpath(__DIR__ . '/../../personal-assistant-backend/public/index.php'),
    '/home/sites/scaro.online/personal-assistant-backend/public/index.php',
    __DIR__ . '/../personal-assistant-backend/public/index.php',
    __DIR__ . '/../backend/public/index.php',
    __DIR__ . '/../../backend/public/index.php'
];

$private_backend_path = null;
foreach ($candidate_paths as $path) {
    if ($path && file_exists($path)) {
        $private_backend_path = $path;
        break;
    }
}

if (!$private_backend_path) {
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
