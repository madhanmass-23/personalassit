<?php

// Autoloader for project namespace-to-folder mapping
spl_autoload_register(function ($class) {
    $base_dir = dirname(__DIR__) . '/';

    $parts = explode('\\', $class);
    $className = array_pop($parts);

    // Project directories are lowercase
    $path = strtolower(implode('/', $parts));

    // Try exact class filename first
    $file = $base_dir . ($path ? $path . '/' : '') . $className . '.php';

    // Then try lowercase filename
    if (!file_exists($file)) {
        $file = $base_dir . ($path ? $path . '/' : '') . strtolower($className) . '.php';
    }

    if (file_exists($file)) {
        require_once $file;
    }
});

use Config\Environment;
use Utils\Response;
use Middleware\RateLimitMiddleware;
use Middleware\AuthMiddleware;
use Controllers\AuthController;
use Controllers\UserController;

// Load environment variables
Environment::load(dirname(__DIR__) . '/.env');

// Apply Security Headers
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

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Ensure JSON Content-Type for endpoints (except avatar upload)
if ($_SERVER['REQUEST_METHOD'] !== 'GET' && $_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {
    $contentType = $_SERVER["CONTENT_TYPE"] ?? '';
    $isUpload = strpos($request_uri, '/api/profile/avatar') !== false;
    if (!$isUpload && strpos($contentType, 'application/json') === false) {
        Response::error('Content-Type must be application/json', 'UNSUPPORTED_MEDIA_TYPE', 415);
    }
}

// Simple Router
$request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Strip deployment base path if present
$base_path = '/personal-assistant-api';
if (strpos($request_uri, $base_path) === 0) {
    $request_uri = substr($request_uri, strlen($base_path));
}
$method = $_SERVER['REQUEST_METHOD'];

// Health Endpoint
if ($request_uri === '/api/health' && $method === 'GET') {
    Response::json(['status' => 'ok']);
}

// Auth Routes (Rate Limited)
if (strpos($request_uri, '/api/auth/') === 0) {
    RateLimitMiddleware::handle(20, 60); // 20 requests per minute
    
    if ($request_uri === '/api/auth/register' && $method === 'POST') {
        AuthController::register();
    } elseif ($request_uri === '/api/auth/login' && $method === 'POST') {
        AuthController::login();
    } elseif ($request_uri === '/api/auth/google-login' && $method === 'POST') {
        AuthController::googleLogin();
    } elseif ($request_uri === '/api/auth/logout' && $method === 'POST') {
        AuthController::logout();
    } elseif ($request_uri === '/api/auth/me' && $method === 'GET') {
        AuthMiddleware::handle();
        AuthController::me();
    }
}

// Profile Routes (Protected)
if (strpos($request_uri, '/api/profile') === 0) {
    AuthMiddleware::handle();
    
    if ($request_uri === '/api/profile' && $method === 'GET') {
        UserController::getProfile();
    } elseif ($request_uri === '/api/profile' && $method === 'PATCH') {
        UserController::updateProfile();
    } elseif ($request_uri === '/api/profile/avatar' && $method === 'POST') {
        UserController::uploadAvatar();
    }
}

// Preferences Route
if (strpos($request_uri, '/api/preferences') === 0) {
    AuthMiddleware::handle();
    if ($request_uri === '/api/preferences' && $method === 'GET') {
        UserController::getPreferences();
        exit;
    } elseif ($request_uri === '/api/preferences' && $method === 'PATCH') {
        UserController::updatePreferences();
        exit;
    }
}

// Reports Route
if (strpos($request_uri, '/api/reports/') === 0) {
    AuthMiddleware::handle();
    if ($request_uri === '/api/reports/today' && $method === 'GET') {
        \Controllers\ReportController::today();
        exit;
    } elseif ($request_uri === '/api/reports/week' && $method === 'GET') {
        \Controllers\ReportController::week();
        exit;
    } elseif ($request_uri === '/api/reports/month' && $method === 'GET') {
        \Controllers\ReportController::month();
        exit;
    } elseif ($request_uri === '/api/reports/export/expenses' && $method === 'GET') {
        \Controllers\ReportController::exportExpenses();
        exit;
    } elseif ($request_uri === '/api/reports/export/income' && $method === 'GET') {
        \Controllers\ReportController::exportIncome();
        exit;
    } elseif ($request_uri === '/api/reports/export/monthly' && $method === 'GET') {
        \Controllers\ReportController::exportMonthly();
        exit;
    }
}

// Helper for resource routes
function handleResourceRoute($path, $controller) {
    global $request_uri, $method;
    
    if (strpos($request_uri, $path) === 0) {
        $remainder = substr($request_uri, strlen($path));
        
        // Ensure we don't partially match like /api/tasks matching /api/task-categories if they were similar
        if ($remainder !== '' && $remainder[0] !== '/') {
            return; // Not a match for this path
        }
        
        $user = AuthMiddleware::handle();
        $GLOBALS['user'] = $user;
        if (session_status() === PHP_SESSION_NONE && !headers_sent()) {
            @session_start();
        }
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
        
        // Custom sub-routes like /tasks/1/complete
        if ($path === '/api/tasks' && preg_match('#^/(\d+)/(complete|incomplete)$#', $remainder, $matches)) {
            $id = $matches[1];
            $action = $matches[2];
            if ($method === 'PATCH') {
                if ($action === 'complete') $controller::complete($id);
                else $controller::incomplete($id);
                exit;
            }
        }
    }
}

handleResourceRoute('/api/tasks', \Controllers\TaskController::class);
handleResourceRoute('/api/task-categories', \Controllers\TaskCategoryController::class);
handleResourceRoute('/api/expenses', \Controllers\ExpenseController::class);
handleResourceRoute('/api/expense-categories', \Controllers\ExpenseCategoryController::class);
handleResourceRoute('/api/income', \Controllers\IncomeController::class);
handleResourceRoute('/api/income-categories', \Controllers\IncomeCategoryController::class);
handleResourceRoute('/api/focus-sessions', \Controllers\FocusSessionController::class);

// 404 Not Found
Response::error('Endpoint not found', 'NOT_FOUND', 404);

