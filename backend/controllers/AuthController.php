<?php

namespace Controllers;

use Models\User;
use Utils\Response;
use Utils\JWT;
use Config\Environment;

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
    
    public static function googleLogin() {
        $data = json_decode(file_get_contents('php://input'), true);
        $credential = $data['credential'] ?? '';
        
        if (empty($credential)) {
            Response::error('Google credential is required', 'VALIDATION_ERROR', 422);
        }
        
        // Verify Google Token Server-Side
        $ch = curl_init('https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($credential));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            Response::error('Invalid Google credential', 'UNAUTHORIZED', 401);
        }
        
        $googleData = json_decode($response, true);
        
        $clientId = Environment::get('GOOGLE_CLIENT_ID');
        if (empty($clientId) || $googleData['aud'] !== $clientId) {
            Response::error('Invalid client ID audience', 'UNAUTHORIZED', 401);
        }
        
        if (!isset($googleData['email_verified']) || $googleData['email_verified'] !== "true") {
            Response::error('Google email is not verified', 'UNAUTHORIZED', 401);
        }
        
        $sub = $googleData['sub'];
        $email = strtolower($googleData['email']);
        $name = $googleData['name'] ?? 'User';
        $picture = $googleData['picture'] ?? null;
        
        // 1. Try finding by Google SUB
        $user = User::findByGoogleSub($sub);
        
        if (!$user) {
            // 2. Try finding by email to link accounts
            $user = User::findByEmail($email);
            if ($user) {
                // Link Google to existing account
                User::updateGoogleAuth($user['id'], $sub, $picture);
                $user = User::findById($user['id']);
            } else {
                // 3. Create new user
                $timezone = $data['timezone'] ?? 'UTC';
                $userId = User::create($name, $email, null, $timezone, 'google', $sub, $picture);
                $user = User::findById($userId);
            }
        }
        
        User::updateLastLogin($user['id']);
        $token = self::generateAndSetToken($user['id']);
        
        Response::json([
            'user' => $user,
            'token' => $token
        ]);
    }

    public static function logout() {
        self::setAuthCookie('', time() - 3600);
        Response::json(['message' => 'Logged out successfully']);
    }

    public static function me() {
        $user = $GLOBALS['user'];
        Response::json(['user' => $user]);
    }
    
    private static function generateAndSetToken($userId) {
        $expires = time() + (86400 * 7); // 7 days
        $token = JWT::encode([
            'user_id' => $userId,
            'exp' => $expires
        ]);
        
        self::setAuthCookie($token, $expires);
        
        return $token;
    }

    private static function setAuthCookie($token, $expires) {
        $name = 'auth_token';
        $path = '/';
        $secure = true;
        $httponly = true;
        $samesite = 'None';

        if (PHP_VERSION_ID >= 70300) {
            setcookie($name, $token, [
                'expires' => $expires,
                'path' => $path,
                'secure' => $secure,
                'httponly' => $httponly,
                'samesite' => $samesite
            ]);
        } else {
            // PHP < 7.3 fallback (setcookie does not accept options array or samesite)
            $cookieStr = "$name=" . urlencode($token);
            $cookieStr .= "; expires=" . gmdate('D, d M Y H:i:s T', $expires);
            $cookieStr .= "; Max-Age=" . max(0, $expires - time());
            $cookieStr .= "; Path=$path";
            if ($secure) {
                $cookieStr .= "; Secure";
            }
            if ($httponly) {
                $cookieStr .= "; HttpOnly";
            }
            $cookieStr .= "; SameSite=$samesite";
            header("Set-Cookie: $cookieStr", false);
        }
    }
}
