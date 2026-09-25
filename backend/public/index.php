<?php

// Autoloader for simplistic namespace to folder mapping
spl_autoload_register(function ($class) {
    $base_dir = dirname(__DIR__) . '/';
    $file = $base_dir . str_replace('\\', '/', $class) . '.php';
    if (file_exists($file)) {
        require $file;
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
$allowed_origins = explode(',', Environment::get('FRONTEND_URL', 'http://localhost:3000'));
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
}

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Ensure JSON Content-Type for endpoints
if ($_SERVER['REQUEST_METHOD'] !== 'GET' && $_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {
    $contentType = $_SERVER["CONTENT_TYPE"] ?? '';
    if (strpos($contentType, 'application/json') === false) {
        Response::error('Content-Type must be application/json', 'UNSUPPORTED_MEDIA_TYPE', 415);
    }
}

// Simple Router
$request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
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
    }
}

// 404 Not Found
Response::error('Endpoint not found', 'NOT_FOUND', 404);
