<?php

namespace Middleware;

use Utils\Response;
use Utils\JWT;
use Models\User;

class AuthMiddleware {
    public static function handle() {
        $token = null;
        
        // Check Bearer Token in Header (if cross-domain)
        $headers = apache_request_headers();
        if (isset($headers['Authorization'])) {
            $matches = [];
            if (preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
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
        return $user;
    }
}
