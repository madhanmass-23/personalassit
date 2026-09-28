<?php

namespace Controllers;

use Utils\Response;
use Config\Database;

class UserController {
    public static function getProfile() {
        $user = $GLOBALS['user'];
        Response::json(['user' => $user]);
    }
    
    public static function updateProfile() {
        $user = $GLOBALS['user'];
        $data = json_decode(file_get_contents('php://input'), true);
        
        $name = trim($data['name'] ?? $user['name']);
        $timezone = trim($data['timezone'] ?? $user['timezone']);
        
        if (empty($name)) {
            Response::error('Name cannot be empty', 'VALIDATION_ERROR', 422);
        }
        
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("UPDATE users SET name = :name, timezone = :timezone WHERE id = :id");
        $stmt->execute([
            'name' => $name,
            'timezone' => $timezone,
            'id' => $user['id']
        ]);
        
        $user['name'] = $name;
        $user['timezone'] = $timezone;
        
        Response::json(['user' => $user]);
    }

    public static function getPreferences() {
        $userId = $GLOBALS['user']['id'] ?? null;
        if (!$userId) Response::error('Unauthorized', 'UNAUTHORIZED', 401);
        
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT * FROM user_preferences WHERE user_id = :user_id LIMIT 1");
        $stmt->execute(['user_id' => $userId]);
        $prefs = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$prefs) {
            $prefs = [
                'currency' => 'INR',
                'date_format' => 'Y-m-d',
                'week_start_day' => 1,
                'daily_reminder_enabled' => 1,
                'daily_reminder_time' => '17:30:00',
                'theme' => 'system'
            ];
        }
        
        Response::json($prefs);
    }
    
    public static function updatePreferences() {
        $userId = $GLOBALS['user']['id'] ?? null;
        if (!$userId) Response::error('Unauthorized', 'UNAUTHORIZED', 401);
        
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        
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
            
            if (empty($sets)) self::getPreferences();
            
            $sql = "UPDATE user_preferences SET " . implode(', ', $sets) . " WHERE user_id = :user_id";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
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
        
        self::getPreferences();
    }
}
