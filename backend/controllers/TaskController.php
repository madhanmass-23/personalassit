<?php
namespace Controllers;

use Models\Task;
use Utils\Response;

class TaskController {
    public static function index() {
        $userId = $GLOBALS['user']['id'] ?? $_SESSION['user_id'] ?? null;
        if (!$userId) Response::error('Unauthorized', 'UNAUTHORIZED', 401);
        
        $items = Task::getAll($userId);
        Response::json($items);
    }

    public static function show($id) {
        $userId = $GLOBALS['user']['id'] ?? $_SESSION['user_id'] ?? null;
        if (!$userId) Response::error('Unauthorized', 'UNAUTHORIZED', 401);
        
        $item = Task::getById($userId, $id);
        if (!$item) Response::error('Not found', 'NOT_FOUND', 404);
        
        Response::json($item);
    }

    public static function create() {
        $userId = $GLOBALS['user']['id'] ?? $_SESSION['user_id'] ?? null;
        if (!$userId) Response::error('Unauthorized', 'UNAUTHORIZED', 401);
        
        $data = json_decode(file_get_contents("php://input"), true) ?? [];
        
        if (empty($data['title']) || trim($data['title']) === '') {
            Response::error('Title is required', 'VALIDATION_ERROR', 422);
        }

        $allowed = [
            'title', 'description', 'category_id', 'status', 
            'priority', 'due_date', 'due_time', 'recurrence_type', 'recurrence_rule'
        ];
        $filtered = [];
        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $val = $data[$field];
                if (is_string($val)) $val = trim($val);
                if ($val === '' && in_array($field, ['category_id', 'description', 'due_date', 'due_time', 'recurrence_type', 'recurrence_rule'])) {
                    $val = null;
                }
                if ($field === 'category_id' && $val !== null) {
                    $val = (int)$val;
                }
                $filtered[$field] = $val;
            }
        }
        if (!isset($filtered['status'])) {
            $filtered['status'] = 'pending';
        }
        if (!isset($filtered['priority'])) {
            $filtered['priority'] = 'medium';
        }
        
        try {
            $id = Task::create($userId, $filtered);
            $item = Task::getById($userId, $id);
            Response::json($item, 201);
        } catch (\Exception $e) {
            Response::error($e->getMessage(), 'SERVER_ERROR', 500);
        }
    }

    public static function update($id) {
        $userId = $GLOBALS['user']['id'] ?? $_SESSION['user_id'] ?? null;
        if (!$userId) Response::error('Unauthorized', 'UNAUTHORIZED', 401);
        
        $item = Task::getById($userId, $id);
        if (!$item) Response::error('Not found', 'NOT_FOUND', 404);

        $data = json_decode(file_get_contents("php://input"), true) ?? [];
        if (empty($data)) Response::json($item);

        $allowed = [
            'title', 'description', 'category_id', 'status', 
            'priority', 'due_date', 'due_time', 'completed_at',
            'recurrence_type', 'recurrence_rule'
        ];
        $filtered = [];
        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $val = $data[$field];
                if (is_string($val)) $val = trim($val);
                if ($val === '' && in_array($field, ['category_id', 'description', 'due_date', 'due_time', 'completed_at', 'recurrence_type', 'recurrence_rule'])) {
                    $val = null;
                }
                if ($field === 'category_id' && $val !== null) {
                    $val = (int)$val;
                }
                $filtered[$field] = $val;
            }
        }

        if (isset($filtered['status'])) {
            if ($filtered['status'] === 'completed' && !isset($filtered['completed_at'])) {
                $filtered['completed_at'] = date('Y-m-d H:i:s');
            } elseif ($filtered['status'] === 'pending') {
                $filtered['completed_at'] = null;
            }
        }
        
        try {
            if (!empty($filtered)) {
                Task::update($userId, $id, $filtered);
            }
            $updated = Task::getById($userId, $id);
            Response::json($updated);
        } catch (\Exception $e) {
            Response::error($e->getMessage(), 'SERVER_ERROR', 500);
        }
    }

    public static function complete($id) {
        $userId = $GLOBALS['user']['id'] ?? $_SESSION['user_id'] ?? null;
        if (!$userId) Response::error('Unauthorized', 'UNAUTHORIZED', 401);

        $item = Task::getById($userId, $id);
        if (!$item) Response::error('Not found', 'NOT_FOUND', 404);

        Task::update($userId, $id, [
            'status' => 'completed',
            'completed_at' => date('Y-m-d H:i:s')
        ]);
        $updated = Task::getById($userId, $id);
        Response::json($updated);
    }

    public static function incomplete($id) {
        $userId = $GLOBALS['user']['id'] ?? $_SESSION['user_id'] ?? null;
        if (!$userId) Response::error('Unauthorized', 'UNAUTHORIZED', 401);

        $item = Task::getById($userId, $id);
        if (!$item) Response::error('Not found', 'NOT_FOUND', 404);

        Task::update($userId, $id, [
            'status' => 'pending',
            'completed_at' => null
        ]);
        $updated = Task::getById($userId, $id);
        Response::json($updated);
    }

    public static function delete($id) {
        $userId = $GLOBALS['user']['id'] ?? $_SESSION['user_id'] ?? null;
        if (!$userId) Response::error('Unauthorized', 'UNAUTHORIZED', 401);
        
        $item = Task::getById($userId, $id);
        if (!$item) Response::error('Not found', 'NOT_FOUND', 404);
        
        Task::delete($userId, $id);
        Response::json(['success' => true]);
    }
}
