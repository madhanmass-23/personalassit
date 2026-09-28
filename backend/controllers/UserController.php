<?php

namespace Controllers;

use Utils\Response;
use Config\Database;
use Models\User;

class UserController {
    public static function getProfile() {
        $user = $GLOBALS['user'] ?? null;
        if (!$user) {
            $userId = $GLOBALS['user']['id'] ?? $_SESSION['user_id'] ?? null;
            if ($userId) {
                $user = User::findById($userId);
                $GLOBALS['user'] = $user;
            }
        }
        if (!$user) {
            Response::error('Unauthorized', 'UNAUTHORIZED', 401);
        }
        Response::json(['user' => $user]);
    }
    
    public static function updateProfile() {
        $user = $GLOBALS['user'] ?? null;
        $userId = $user['id'] ?? $_SESSION['user_id'] ?? null;
        if (!$userId) {
            Response::error('Unauthorized', 'UNAUTHORIZED', 401);
        }

        $data = json_decode(file_get_contents('php://input'), true);
        
        $name = trim($data['name'] ?? ($user['name'] ?? ''));
        $timezone = trim($data['timezone'] ?? ($user['timezone'] ?? 'UTC'));
        $avatarUrl = array_key_exists('avatar_url', $data) ? trim($data['avatar_url']) : ($user['avatar_url'] ?? null);
        
        if (empty($name)) {
            Response::error('Name cannot be empty', 'VALIDATION_ERROR', 422);
        }
        
        try {
            $db = Database::getInstance()->getConnection();
            $stmt = $db->prepare("UPDATE users SET name = :name, timezone = :timezone, avatar_url = :avatar_url WHERE id = :id");
            $stmt->execute([
                'name' => $name,
                'timezone' => $timezone,
                'avatar_url' => $avatarUrl,
                'id' => $userId
            ]);
            
            $updatedUser = User::findById($userId);
            $GLOBALS['user'] = $updatedUser;
            Response::json(['user' => $updatedUser]);
        } catch (\Exception $e) {
            Response::error('Failed to update profile', 'SERVER_ERROR', 500);
        }
    }

    public static function uploadAvatar() {
        $userId = $GLOBALS['user']['id'] ?? $_SESSION['user_id'] ?? null;
        if (!$userId) {
            Response::error('Unauthorized', 'UNAUTHORIZED', 401);
        }

        if (empty($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
            Response::error('No file uploaded or upload error occurred', 'VALIDATION_ERROR', 422);
        }

        $file = $_FILES['avatar'];
        if ($file['size'] > 5 * 1024 * 1024) {
            Response::error('Avatar image must be under 5MB', 'VALIDATION_ERROR', 422);
        }

        // Verify MIME type using finfo
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        $allowedMimes = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
        ];

        if (!array_key_exists($mime, $allowedMimes)) {
            Response::error('Only JPEG, PNG, and WEBP images are allowed', 'VALIDATION_ERROR', 422);
        }

        $ext = $allowedMimes[$mime];
        $filename = 'avatar_' . $userId . '_' . bin2hex(random_bytes(8)) . '.' . $ext;
        
        // Target uploads dir in public_html
        $uploadDir = dirname(__DIR__, 2) . '/personal-assistant-api/uploads';
        if (!is_dir($uploadDir)) {
            @mkdir($uploadDir, 0755, true);
        }
        
        $targetPath = $uploadDir . '/' . $filename;
        if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
            Response::error('Failed to store uploaded avatar', 'SERVER_ERROR', 500);
        }

        $avatarUrl = 'https://scaro.online/personal-assistant-api/uploads/' . $filename;

        try {
            $db = Database::getInstance()->getConnection();
            $stmt = $db->prepare("UPDATE users SET avatar_url = :avatar_url WHERE id = :id");
            $stmt->execute([
                'avatar_url' => $avatarUrl,
                'id' => $userId
            ]);

            $updatedUser = User::findById($userId);
            $GLOBALS['user'] = $updatedUser;
            Response::json(['user' => $updatedUser, 'avatar_url' => $avatarUrl]);
        } catch (\Exception $e) {
            Response::error('Failed to update user avatar', 'SERVER_ERROR', 500);
        }
    }

    public static function getPreferences() {
        $userId = $GLOBALS['user']['id'] ?? $_SESSION['user_id'] ?? null;
        if (!$userId) {
            Response::error('Unauthorized', 'UNAUTHORIZED', 401);
        }
        
        $defaultPrefs = [
            'currency' => 'INR',
            'date_format' => 'Y-m-d',
            'week_start_day' => 1,
            'daily_reminder_enabled' => 1,
            'daily_reminder_time' => '17:30:00',
            'theme' => 'system'
        ];

        try {
            $db = Database::getInstance()->getConnection();
            $stmt = $db->prepare("SELECT * FROM user_preferences WHERE user_id = :user_id LIMIT 1");
            $stmt->execute(['user_id' => $userId]);
            $prefs = $stmt->fetch(\PDO::FETCH_ASSOC);
            
            if (!$prefs) {
                $prefs = $defaultPrefs;
            }
            Response::json($prefs);
        } catch (\Exception $e) {
            // Soft fallback to default preferences
            Response::json($defaultPrefs);
        }
    }
    
    public static function updatePreferences() {
        $userId = $GLOBALS['user']['id'] ?? $_SESSION['user_id'] ?? null;
        if (!$userId) {
            Response::error('Unauthorized', 'UNAUTHORIZED', 401);
        }
        
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        
        try {
            $db = Database::getInstance()->getConnection();
            
            $stmt = $db->prepare("SELECT id FROM user_preferences WHERE user_id = :user_id LIMIT 1");
            $stmt->execute(['user_id' => $userId]);
            $exists = $stmt->fetch();
            
            if ($exists) {
                $sets = [];
                $params = ['user_id' => $userId];
                $allowedFields = ['currency', 'date_format', 'week_start_day', 'daily_reminder_enabled', 'daily_reminder_time', 'theme'];
                
                foreach ($allowedFields as $field) {
                    if (isset($data[$field])) {
                        $sets[] = "$field = :$field";
                        $params[$field] = $data[$field];
                    }
                }
                
                if (!empty($sets)) {
                    $sql = "UPDATE user_preferences SET " . implode(', ', $sets) . " WHERE user_id = :user_id";
                    $stmt = $db->prepare($sql);
                    $stmt->execute($params);
                }
            } else {
                $currency = $data['currency'] ?? 'INR';
                $date_format = $data['date_format'] ?? 'Y-m-d';
                $week_start = $data['week_start_day'] ?? 1;
                $reminder_enabled = $data['daily_reminder_enabled'] ?? 1;
                $reminder_time = $data['daily_reminder_time'] ?? '17:30:00';
                $theme = $data['theme'] ?? 'system';
                
                $stmt = $db->prepare("INSERT INTO user_preferences (user_id, currency, date_format, week_start_day, daily_reminder_enabled, daily_reminder_time, theme) VALUES (:user_id, :currency, :date_format, :week_start, :reminder_enabled, :reminder_time, :theme)");
                $stmt->execute([
                    'user_id' => $userId,
                    'currency' => $currency,
                    'date_format' => $date_format,
                    'week_start' => $week_start,
                    'reminder_enabled' => $reminder_enabled,
                    'reminder_time' => $reminder_time,
                    'theme' => $theme
                ]);
            }
        } catch (\Exception $e) {
            // Ignore error so profile doesn't crash
        }
        
        self::getPreferences();
    }
}
