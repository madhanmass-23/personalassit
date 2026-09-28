<?php
namespace Controllers;

use Models\TaskCategory;
use Utils\Response;

class TaskCategoryController {
    public static function index() {
        $userId = $GLOBALS['user']['id'] ?? $_SESSION['user_id'] ?? null;
        if (!$userId) Response::error('Unauthorized', 'UNAUTHORIZED', 401);
        
        $items = TaskCategory::getAll($userId);
        Response::json($items);
    }

    public static function show($id) {
        $userId = $GLOBALS['user']['id'] ?? $_SESSION['user_id'] ?? null;
        if (!$userId) Response::error('Unauthorized', 'UNAUTHORIZED', 401);
        
        $item = TaskCategory::getById($userId, $id);
        if (!$item) Response::error('Not found', 'NOT_FOUND', 404);
        
        Response::json($item);
    }

    public static function create() {
        $userId = $GLOBALS['user']['id'] ?? $_SESSION['user_id'] ?? null;
        if (!$userId) Response::error('Unauthorized', 'UNAUTHORIZED', 401);
        
        $data = json_decode(file_get_contents("php://input"), true) ?? [];
        
        if (empty($data['name']) || trim($data['name']) === '') {
            Response::error('Category name is required', 'VALIDATION_ERROR', 422);
        }

        $allowed = ['name', 'color', 'icon'];
        $filtered = [];
        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $val = $data[$field];
                if (is_string($val)) $val = trim($val);
                if ($val === '' && in_array($field, ['color', 'icon'])) {
                    $val = null;
                }
                $filtered[$field] = $val;
            }
        }
        
        try {
            $id = TaskCategory::create($userId, $filtered);
            $item = TaskCategory::getById($userId, $id);
            Response::json($item, 201);
        } catch (\Exception $e) {
            Response::error($e->getMessage(), 'SERVER_ERROR', 500);
        }
    }

    public static function update($id) {
        $userId = $GLOBALS['user']['id'] ?? $_SESSION['user_id'] ?? null;
        if (!$userId) Response::error('Unauthorized', 'UNAUTHORIZED', 401);
        
        $item = TaskCategory::getById($userId, $id);
        if (!$item) Response::error('Not found', 'NOT_FOUND', 404);

        $data = json_decode(file_get_contents("php://input"), true) ?? [];
        if (empty($data)) Response::json($item);
        
        $allowed = ['name', 'color', 'icon'];
        $filtered = [];
        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $val = $data[$field];
                if (is_string($val)) $val = trim($val);
                if ($val === '' && in_array($field, ['color', 'icon'])) {
                    $val = null;
                }
                $filtered[$field] = $val;
            }
        }

        try {
            if (!empty($filtered)) {
                TaskCategory::update($userId, $id, $filtered);
            }
            $updated = TaskCategory::getById($userId, $id);
            Response::json($updated);
        } catch (\Exception $e) {
            Response::error($e->getMessage(), 'SERVER_ERROR', 500);
        }
    }

    public static function delete($id) {
        $userId = $GLOBALS['user']['id'] ?? $_SESSION['user_id'] ?? null;
        if (!$userId) Response::error('Unauthorized', 'UNAUTHORIZED', 401);
        
        $item = TaskCategory::getById($userId, $id);
        if (!$item) Response::error('Not found', 'NOT_FOUND', 404);
        
        TaskCategory::delete($userId, $id);
        Response::json(['success' => true]);
    }
}
