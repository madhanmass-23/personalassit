<?php

namespace Controllers;

use Models\User;
use Utils\Response;
use Utils\JWT;

class AuthController {
    
    public static function register() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $name = trim($data['name'] ?? '');
        $email = strtolower(trim($data['email'] ?? ''));
        $password = $data['password'] ?? '';
        $timezone = $data['timezone'] ?? 'UTC';

        if (empty($name) || empty($email) || empty($password)) {
            Response::error('Name, email, and password are required', 'VALIDATION_ERROR', 422);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::error('Invalid email format', 'VALIDATION_ERROR', 422);
        }

        if (strlen($password) < 8) {
            Response::error('Password must be at least 8 characters long', 'VALIDATION_ERROR', 422);
        }

        $existingUser = User::findByEmail($email);
        if ($existingUser) {
            // Avoid leaking whether email exists by generic message, though for register it's standard to say it's taken
            Response::error('Email already in use', 'CONFLICT', 409);
        }

        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        
        try {
            $userId = User::create($name, $email, $passwordHash, $timezone);
            
            // Auto login after register
            $token = self::generateAndSetToken($userId);
            
            Response::json([
                'user' => User::findById($userId),
                'token' => $token
            ], 201);
        } catch (\Exception $e) {
            Response::error('Registration failed', 'SERVER_ERROR', 500);
        }
    }

    public static function login() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $email = strtolower(trim($data['email'] ?? ''));
        $password = $data['password'] ?? '';

        if (empty($email) || empty($password)) {
            Response::error('Email and password are required', 'VALIDATION_ERROR', 422);
        }

        $user = User::findByEmail($email);
        
        // Use time-safe comparison or generic error to prevent email enumeration
        if (!$user || !password_verify($password, $user['password_hash'])) {
            Response::error('Invalid email or password', 'UNAUTHORIZED', 401);
        }

        User::updateLastLogin($user['id']);
        
        $token = self::generateAndSetToken($user['id']);
        
        Response::json([
            'user' => User::findById($user['id']),
            'token' => $token
        ]);
    }

    public static function logout() {
        // Clear HttpOnly cookie
        setcookie('auth_token', '', [
            'expires' => time() - 3600,
            'path' => '/',
            'secure' => true,
            'httponly' => true,
            'samesite' => 'Lax'
        ]);
        
        Response::json(['message' => 'Logged out successfully']);
    }

    public static function me() {
        // This route is protected by AuthMiddleware, so $GLOBALS['user'] is set
        $user = $GLOBALS['user'];
        Response::json(['user' => $user]);
    }
    
    private static function generateAndSetToken($userId) {
        $token = JWT::encode([
            'user_id' => $userId,
            'exp' => time() + (86400 * 7) // 7 days
        ]);
        
        // Set HttpOnly cookie for same-domain auth
        setcookie('auth_token', $token, [
            'expires' => time() + (86400 * 7),
            'path' => '/',
            'secure' => true, // Ensure HTTPS in prod
            'httponly' => true,
            'samesite' => 'Lax'
        ]);
        
        return $token;
    }
}
