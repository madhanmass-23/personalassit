<?php

namespace Models;

use Config\Database;
use PDO;

class User {
    public static function findByEmail($email) {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT * FROM users WHERE email = :email LIMIT 1");
        $stmt->execute(['email' => $email]);
        return $stmt->fetch();
    }
    
    public static function findByGoogleSub($googleSub) {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT * FROM users WHERE google_sub = :google_sub LIMIT 1");
        $stmt->execute(['google_sub' => $googleSub]);
        return $stmt->fetch();
    }

    public static function findById($id) {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT id, name, email, auth_provider, avatar_url, timezone, created_at, last_login_at FROM users WHERE id = :id LIMIT 1");
        $stmt->execute(['id' => $id]);
        return $stmt->fetch();
    }

    public static function create($name, $email, $passwordHash, $timezone = 'UTC', $authProvider = 'email', $googleSub = null, $avatarUrl = null) {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("INSERT INTO users (name, email, password_hash, auth_provider, google_sub, avatar_url, timezone) VALUES (:name, :email, :password_hash, :auth_provider, :google_sub, :avatar_url, :timezone)");
        $stmt->execute([
            'name' => $name,
            'email' => $email,
            'password_hash' => $passwordHash,
            'auth_provider' => $authProvider,
            'google_sub' => $googleSub,
            'avatar_url' => $avatarUrl,
            'timezone' => $timezone
        ]);
        $userId = $db->lastInsertId();
        
        self::createDefaultData($userId);
        return $userId;
    }
    
    public static function updateGoogleAuth($id, $googleSub, $avatarUrl = null) {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("UPDATE users SET google_sub = :google_sub, auth_provider = 'google', avatar_url = COALESCE(:avatar_url, avatar_url) WHERE id = :id");
        $stmt->execute([
            'id' => $id,
            'google_sub' => $googleSub,
            'avatar_url' => $avatarUrl
        ]);
    }

    public static function updateLastLogin($id) {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = :id");
        $stmt->execute(['id' => $id]);
    }
    
    private static function createDefaultData($userId) {
        $db = Database::getInstance()->getConnection();
        
        // Default Task Categories
        $taskCategories = ['Work', 'Study', 'Personal', 'Health', 'Other'];
        $stmt = $db->prepare("INSERT INTO task_categories (user_id, name, color) VALUES (:user_id, :name, :color)");
        foreach ($taskCategories as $idx => $cat) {
            $colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f43f5e', '#64748b'];
            $stmt->execute(['user_id' => $userId, 'name' => $cat, 'color' => $colors[$idx]]);
        }
        
        // Default Expense Categories
        $expenseCategories = ['Food', 'Travel', 'Shopping', 'Bills', 'Education', 'Health', 'Entertainment', 'Other'];
        $stmt = $db->prepare("INSERT INTO expense_categories (user_id, name, color) VALUES (:user_id, :name, :color)");
        foreach ($expenseCategories as $idx => $cat) {
            $colors = ['#f97316', '#eab308', '#ec4899', '#ef4444', '#8b5cf6', '#10b981', '#3b82f6', '#64748b'];
            $stmt->execute(['user_id' => $userId, 'name' => $cat, 'color' => $colors[$idx]]);
        }
        
        // Default Income Categories
        $incomeCategories = ['Salary', 'Freelance', 'Business', 'Bonus', 'Other'];
        $stmt = $db->prepare("INSERT INTO income_categories (user_id, name, color) VALUES (:user_id, :name, :color)");
        foreach ($incomeCategories as $idx => $cat) {
            $colors = ['#22c55e', '#14b8a6', '#0ea5e9', '#8b5cf6', '#64748b'];
            $stmt->execute(['user_id' => $userId, 'name' => $cat, 'color' => $colors[$idx]]);
        }
        
        // Default Preferences
        $stmt = $db->prepare("INSERT INTO user_preferences (user_id, currency, daily_reminder_enabled, daily_reminder_time) VALUES (:user_id, 'INR', 1, '17:30')");
        $stmt->execute(['user_id' => $userId]);
    }
}
