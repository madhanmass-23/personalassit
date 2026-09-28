<?php

namespace Middleware;

use Utils\Response;
use Utils\JWT;
use Models\User;

class AuthMiddleware {
    public static function handle() {
        $token = null;
        
        // Check Bearer Token in Header (if cross-domain)
        $authHeader = null;
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $authHeader = trim($_SERVER['HTTP_AUTHORIZATION']);
        } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $authHeader = trim($_SERVER['REDIRECT_HTTP_AUTHORIZATION']);
        } elseif (function_exists('getallheaders')) {
            $headers = getallheaders();
            foreach ($headers as $key => $value) {
                if (strtolower($key) === 'authorization') {
                    $authHeader = trim($value);
                    break;
                }
            }
        }

        if ($authHeader) {
            $matches = [];
            if (preg_match('/Bearer\s(\S+)/i', $authHeader, $matches)) {
                $token = $matches[1];
            }
        }        
        // Check HttpOnly Cookie (if same domain)
        if (!$token && isset($_COOKIE['auth_token'])) {
            $token = $_COOKIE['auth_token'];
        }
        
        if (!$token) {
            Response::error('Authentication required', 'UNAUTHORIZED', 401);
        }

        $payload = JWT::decode($token);
        if (!$payload || !isset($payload['user_id'])) {
            Response::error('Invalid or expired token', 'UNAUTHORIZED', 401);
        }

        // Verify user still exists
        $user = User::findById($payload['user_id']);
        if (!$user) {
            Response::error('User not found', 'UNAUTHORIZED', 401);
        }

        // Attach user to request global for downstream controllers
        $GLOBALS['user'] = $user;
        if (session_status() === PHP_SESSION_NONE && !headers_sent()) {
            @session_start();
        }
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user'] = $user;

        if (!empty($user['timezone'])) {
            date_default_timezone_set($user['timezone']);
        }
        return $user;
    }
}
