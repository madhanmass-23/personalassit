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
}
