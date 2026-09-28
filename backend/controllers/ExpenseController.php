<?php
namespace Controllers;

use Models\Expense;
use Utils\Response;

class ExpenseController {
    public static function index() {
        $userId = $GLOBALS['user']['id'] ?? null;
        if (!$userId) Response::error('Unauthorized', 'UNAUTHORIZED', 401);
        
        $items = Expense::getAll($userId);
        Response::json($items);
    }

    public static function show($id) {
        $userId = $GLOBALS['user']['id'] ?? null;
        if (!$userId) Response::error('Unauthorized', 'UNAUTHORIZED', 401);
        
        $item = Expense::getById($userId, $id);
        if (!$item) Response::error('Not found', 'NOT_FOUND', 404);
        
        Response::json($item);
    }

    public static function create() {
        $userId = $GLOBALS['user']['id'] ?? null;
        if (!$userId) Response::error('Unauthorized', 'UNAUTHORIZED', 401);
        
        $data = json_decode(file_get_contents("php://input"), true) ?? [];
        // Basic validation placeholder
        
        try {
            $id = Expense::create($userId, $data);
            $item = Expense::getById($userId, $id);
            Response::json($item, 201);
        } catch (\Exception $e) {
            Response::error($e->getMessage(), 'SERVER_ERROR', 500);
        }
    }

    public static function update($id) {
        $userId = $GLOBALS['user']['id'] ?? null;
        if (!$userId) Response::error('Unauthorized', 'UNAUTHORIZED', 401);
        
        $item = Expense::getById($userId, $id);
        if (!$item) Response::error('Not found', 'NOT_FOUND', 404);

        $data = json_decode(file_get_contents("php://input"), true) ?? [];
        if (empty($data)) Response::json($item);
        
        try {
            Expense::update($userId, $id, $data);
            $updated = Expense::getById($userId, $id);
            Response::json($updated);
        } catch (\Exception $e) {
            Response::error($e->getMessage(), 'SERVER_ERROR', 500);
        }
    }

    public static function delete($id) {
        $userId = $GLOBALS['user']['id'] ?? null;
        if (!$userId) Response::error('Unauthorized', 'UNAUTHORIZED', 401);
        
        $item = Expense::getById($userId, $id);
        if (!$item) Response::error('Not found', 'NOT_FOUND', 404);
        
        Expense::delete($userId, $id);
        Response::json(['success' => true]);
    }
}
