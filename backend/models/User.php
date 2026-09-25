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

    public static function findById($id) {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT id, name, email, timezone, created_at, last_login_at FROM users WHERE id = :id LIMIT 1");
        $stmt->execute(['id' => $id]);
        return $stmt->fetch();
    }

    public static function create($name, $email, $passwordHash, $timezone = 'UTC') {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("INSERT INTO users (name, email, password_hash, timezone) VALUES (:name, :email, :password_hash, :timezone)");
        $stmt->execute([
            'name' => $name,
            'email' => $email,
            'password_hash' => $passwordHash,
            'timezone' => $timezone
        ]);
        return $db->lastInsertId();
    }

    public static function updateLastLogin($id) {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = :id");
        $stmt->execute(['id' => $id]);
    }
}
