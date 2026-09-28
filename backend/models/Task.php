<?php
namespace Models;

use Config\Database;
use PDO;

class Task {
    public static function getAll($userId) {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("
            SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon 
            FROM tasks t 
            LEFT JOIN task_categories c ON t.category_id = c.id 
            WHERE t.user_id = :user_id 
            ORDER BY t.id DESC
        ");
        $stmt->execute(['user_id' => $userId]);
        return $stmt->fetchAll();
    }

    public static function getById($userId, $id) {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("
            SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon 
            FROM tasks t 
            LEFT JOIN task_categories c ON t.category_id = c.id 
            WHERE t.id = :id AND t.user_id = :user_id 
            LIMIT 1
        ");
        $stmt->execute(['id' => $id, 'user_id' => $userId]);
        return $stmt->fetch();
    }

    public static function create($userId, $data) {
        $db = Database::getInstance()->getConnection();
        $fields = array_keys($data);
        $fields[] = 'user_id';
        $placeholders = array_map(function($f) { return ':' . $f; }, $fields);
        
        $sql = "INSERT INTO tasks (" . implode(', ', $fields) . ") VALUES (" . implode(', ', $placeholders) . ")";
        $stmt = $db->prepare($sql);
        
        $params = $data;
        $params['user_id'] = $userId;
        $stmt->execute($params);
        return $db->lastInsertId();
    }

    public static function update($userId, $id, $data) {
        $db = Database::getInstance()->getConnection();
        $sets = [];
        foreach (array_keys($data) as $field) {
            $sets[] = "$field = :$field";
        }
        
        $sql = "UPDATE tasks SET " . implode(', ', $sets) . " WHERE id = :id AND user_id = :user_id";
        $stmt = $db->prepare($sql);
        
        $params = $data;
        $params['id'] = $id;
        $params['user_id'] = $userId;
        
        return $stmt->execute($params);
    }

    public static function delete($userId, $id) {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("DELETE FROM tasks WHERE id = :id AND user_id = :user_id");
        return $stmt->execute(['id' => $id, 'user_id' => $userId]);
    }
}
