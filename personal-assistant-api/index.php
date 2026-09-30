<?php
/**
 * PUBLIC DEPLOYMENT BOOTSTRAP GATEWAY
 * 
 * Location on ServerByte: public_html/personal-assistant-api/index.php
 * Routes incoming requests to the isolated private backend at:
 * /home/sites/scaro.online/personal-assistant-backend/public/index.php
 */

// 1. Preserve original request for logging / downstream diagnostics
if (!isset($_SERVER['ORIGINAL_REQUEST_URI'])) {
    $_SERVER['ORIGINAL_REQUEST_URI'] = $_SERVER['REQUEST_URI'] ?? '';
}
if (!isset($_SERVER['HTTP_X_ORIGINAL_URI'])) {
    $_SERVER['HTTP_X_ORIGINAL_URI'] = $_SERVER['REQUEST_URI'] ?? '';
}

// 2. Preserve and extract Bearer token / auth_token cookie
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

if ($rawAuthHeader && empty($_SERVER['HTTP_AUTHORIZATION'])) {
    $_SERVER['HTTP_AUTHORIZATION'] = $rawAuthHeader;
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

// 3. Normalize REQUEST_URI before delegating (strips base path prefix while preserving query string)
if (isset($_SERVER['REQUEST_URI'])) {
    $parsedPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '';
    $parsedQuery = parse_url($_SERVER['REQUEST_URI'], PHP_URL_QUERY);

    $cleanPath = '/' . trim($parsedPath, '/');
    $prefixes = ['/personal-assistant-api', '/index.php', '/api.php'];
    $changed = true;
    while ($changed) {
        $changed = false;
        foreach ($prefixes as $prefix) {
            if (strpos($cleanPath, $prefix) === 0) {
                $cleanPath = substr($cleanPath, strlen($prefix));
                $cleanPath = '/' . trim($cleanPath, '/');
                $changed = true;
            }
        }
    }

    $normalizedPath = $cleanPath === '' ? '/' : $cleanPath;
    $_SERVER['REQUEST_URI'] = $normalizedPath . ($parsedQuery !== null && $parsedQuery !== '' ? '?' . $parsedQuery : '');
    $_SERVER['PATH_INFO'] = $normalizedPath;
    if (isset($_SERVER['REDIRECT_URL'])) {
        $_SERVER['REDIRECT_URL'] = $normalizedPath;
    }
}

// 4. Resolve private backend path with fallback candidate locations
$candidate_paths = [
    __DIR__ . '/../../personal-assistant-backend/public/index.php',
    realpath(__DIR__ . '/../../personal-assistant-backend/public/index.php'),
    '/home/sites/scaro.online/personal-assistant-backend/public/index.php',
    dirname(dirname(__DIR__)) . '/personal-assistant-backend/public/index.php',
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

if ($private_backend_path) {
    require $private_backend_path;
    exit;
}

// 5. Standalone Fallback Router (if private backend public/index.php cannot be directly required)
spl_autoload_register(function ($class) {
    $candidate_base_dirs = [
        dirname(dirname(__DIR__)) . '/personal-assistant-backend/',
        '/home/sites/scaro.online/personal-assistant-backend/',
        dirname(__DIR__) . '/backend/',
        dirname(__DIR__) . '/'
    ];

    $parts = explode('\\', $class);
    $className = array_pop($parts);
    $path = strtolower(implode('/', $parts));

    foreach ($candidate_base_dirs as $base_dir) {
        if (!is_dir($base_dir)) continue;

        $file = $base_dir . ($path ? $path . '/' : '') . $className . '.php';
        if (file_exists($file)) {
            require_once $file;
            return;
        }

        $fileLower = $base_dir . ($path ? $path . '/' : '') . strtolower($className) . '.php';
        if (file_exists($fileLower)) {
            require_once $fileLower;
            return;
        }
    }
});

use Config\Environment;
use Utils\Response;
use Middleware\RateLimitMiddleware;
use Middleware\AuthMiddleware;
use Controllers\AuthController;
use Controllers\UserController;
use Controllers\VaultController;
use Controllers\VaultEntryController;

// Load environment variables
$env_paths = [
    dirname(dirname(__DIR__)) . '/personal-assistant-backend/.env',
    '/home/sites/scaro.online/personal-assistant-backend/.env',
    dirname(__DIR__) . '/backend/.env',
    dirname(__DIR__) . '/.env'
];

foreach ($env_paths as $env_file) {
    if (file_exists($env_file)) {
        Environment::load($env_file);
        break;
    }
}

// Security Headers
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: DENY");
header("Content-Security-Policy: default-src 'none'");
header("Referrer-Policy: strict-origin-when-cross-origin");

// CORS setup
$allowed_origins = array_map('trim', explode(',', Environment::get('FRONTEND_URL', 'http://localhost:3000,https://personalassit.vercel.app')));
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Access-Control-Expose-Headers: Content-Disposition");
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$request_uri = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?? '/';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method !== 'GET' && $method !== 'OPTIONS' && $method !== 'DELETE') {
    $contentType = $_SERVER["CONTENT_TYPE"] ?? $_SERVER["HTTP_CONTENT_TYPE"] ?? '';
    $isUpload = strpos($request_uri, '/api/profile/avatar') !== false;
    if (!$isUpload && strpos($contentType, 'application/json') === false) {
        Response::error('Content-Type must be application/json', 'UNSUPPORTED_MEDIA_TYPE', 415);
    }
}

// Health
if ($request_uri === '/api/health' && $method === 'GET') {
    Response::json(['status' => 'ok']);
}

// Auth
if (strpos($request_uri, '/api/auth/') === 0) {
    RateLimitMiddleware::handle(20, 60);
    if ($request_uri === '/api/auth/register' && $method === 'POST') AuthController::register();
    elseif ($request_uri === '/api/auth/login' && $method === 'POST') AuthController::login();
    elseif ($request_uri === '/api/auth/google-login' && $method === 'POST') AuthController::googleLogin();
    elseif ($request_uri === '/api/auth/logout' && $method === 'POST') AuthController::logout();
    elseif ($request_uri === '/api/auth/me' && $method === 'GET') { AuthMiddleware::handle(); AuthController::me(); }
}

// Profile
if (strpos($request_uri, '/api/profile') === 0) {
    AuthMiddleware::handle();
    if ($request_uri === '/api/profile' && $method === 'GET') UserController::getProfile();
    elseif ($request_uri === '/api/profile' && $method === 'PATCH') UserController::updateProfile();
    elseif ($request_uri === '/api/profile/avatar' && $method === 'POST') UserController::uploadAvatar();
}

// Preferences
if (strpos($request_uri, '/api/preferences') === 0) {
    AuthMiddleware::handle();
    if ($request_uri === '/api/preferences' && $method === 'GET') { UserController::getPreferences(); exit; }
    elseif ($request_uri === '/api/preferences' && $method === 'PATCH') { UserController::updatePreferences(); exit; }
}

// Reports
if (strpos($request_uri, '/api/reports/') === 0) {
    AuthMiddleware::handle();
    if ($request_uri === '/api/reports/today' && $method === 'GET') { \Controllers\ReportController::today(); exit; }
    elseif ($request_uri === '/api/reports/week' && $method === 'GET') { \Controllers\ReportController::week(); exit; }
    elseif ($request_uri === '/api/reports/month' && $method === 'GET') { \Controllers\ReportController::month(); exit; }
    elseif ($request_uri === '/api/reports/export/expenses' && $method === 'GET') { \Controllers\ReportController::exportExpenses(); exit; }
    elseif ($request_uri === '/api/reports/export/income' && $method === 'GET') { \Controllers\ReportController::exportIncome(); exit; }
    elseif ($request_uri === '/api/reports/export/monthly' && $method === 'GET') { \Controllers\ReportController::exportMonthly(); exit; }
}

// Secure Vault
if (strpos($request_uri, '/api/vault') === 0) {
    AuthMiddleware::handle();

    if ($request_uri === '/api/vault/key' || $request_uri === '/api/vault/key/') {
        if ($method === 'PATCH' || $method === 'PUT') VaultController::updateKey();
        else Response::error('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
        exit;
    }

    if (strpos($request_uri, '/api/vault/entries') === 0) {
        $entryRemainder = substr($request_uri, strlen('/api/vault/entries'));
        if ($entryRemainder === '' || $entryRemainder === '/') {
            if ($method === 'GET') VaultEntryController::index();
            elseif ($method === 'POST') VaultEntryController::create();
            else Response::error('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
            exit;
        }

        if (preg_match('#^/([a-zA-Z0-9_-]+)$#', $entryRemainder, $matches)) {
            $entryId = $matches[1];
            if ($method === 'GET') VaultEntryController::show($entryId);
            elseif ($method === 'PATCH' || $method === 'PUT') VaultEntryController::update($entryId);
            elseif ($method === 'DELETE') VaultEntryController::delete($entryId);
            else Response::error('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
            exit;
        }

        Response::error('Endpoint not found', 'NOT_FOUND', 404);
        exit;
    }

    if ($request_uri === '/api/vault' || $request_uri === '/api/vault/') {
        if ($method === 'GET') VaultController::get();
        elseif ($method === 'POST') VaultController::create();
        elseif ($method === 'DELETE') VaultController::delete();
        else Response::error('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
        exit;
    }

    Response::error('Endpoint not found', 'NOT_FOUND', 404);
    exit;
}

// Resource Routes
function handleStandaloneRoute($path, $controller) {
    global $request_uri, $method;
    if (strpos($request_uri, $path) === 0) {
        $remainder = substr($request_uri, strlen($path));
        if ($remainder !== '' && $remainder[0] !== '/') return;

        $user = AuthMiddleware::handle();
        $GLOBALS['user'] = $user;
        if (session_status() === PHP_SESSION_NONE && !headers_sent()) @session_start();
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user'] = $user;

        if ($remainder === '' || $remainder === '/') {
            if ($method === 'GET') $controller::index();
            elseif ($method === 'POST') $controller::create();
            else Response::error('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
            exit;
        }

        if (preg_match('#^/(\d+)$#', $remainder, $matches)) {
            $id = $matches[1];
            if ($method === 'GET') $controller::show($id);
            elseif ($method === 'PATCH' || $method === 'PUT') $controller::update($id);
            elseif ($method === 'DELETE') $controller::delete($id);
            else Response::error('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
            exit;
        }

        if ($path === '/api/tasks' && preg_match('#^/(\d+)/(complete|incomplete)$#', $remainder, $matches)) {
            $id = $matches[1];
            if ($method === 'PATCH') {
                if ($matches[2] === 'complete') $controller::complete($id);
                else $controller::incomplete($id);
                exit;
            }
        }
    }
}

handleStandaloneRoute('/api/tasks', \Controllers\TaskController::class);
handleStandaloneRoute('/api/task-categories', \Controllers\TaskCategoryController::class);
handleStandaloneRoute('/api/expenses', \Controllers\ExpenseController::class);
handleStandaloneRoute('/api/expense-categories', \Controllers\ExpenseCategoryController::class);
handleStandaloneRoute('/api/income', \Controllers\IncomeController::class);
handleStandaloneRoute('/api/income-categories', \Controllers\IncomeCategoryController::class);
handleStandaloneRoute('/api/focus-sessions', \Controllers\FocusSessionController::class);

Response::error('Endpoint not found', 'NOT_FOUND', 404);
