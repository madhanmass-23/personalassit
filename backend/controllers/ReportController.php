<?php
namespace Controllers;

use Config\Database;
use Utils\Response;
use PDO;

class ReportController {
    
    public static function today() {
        $userId = $GLOBALS['user']['id'] ?? null;
        if (!$userId) Response::error('Unauthorized', 'UNAUTHORIZED', 401);

        $db = Database::getInstance()->getConnection();
        
        $today = date('Y-m-d');
        
        // Income
        $stmt = $db->prepare("SELECT SUM(amount) as total FROM income_entries WHERE user_id = :user_id AND DATE(income_date) = :today");
        $stmt->execute(['user_id' => $userId, 'today' => $today]);
        $income = (float)($stmt->fetch()['total'] ?? 0);
        
        // Expenses
        $stmt = $db->prepare("SELECT SUM(amount) as total FROM expenses WHERE user_id = :user_id AND DATE(expense_date) = :today");
        $stmt->execute(['user_id' => $userId, 'today' => $today]);
        $expense = (float)($stmt->fetch()['total'] ?? 0);
        
        // Focus Time
        $stmt = $db->prepare("SELECT SUM(duration_seconds) as total FROM focus_sessions WHERE user_id = :user_id AND DATE(started_at) = :today");
        $stmt->execute(['user_id' => $userId, 'today' => $today]);
        $focus_seconds = (int)($stmt->fetch()['total'] ?? 0);
        
        // Tasks
        $stmt = $db->prepare("SELECT COUNT(*) as total FROM tasks WHERE user_id = :user_id AND DATE(due_date) = :today AND status = 'pending'");
        $stmt->execute(['user_id' => $userId, 'today' => $today]);
        $pending_tasks = (int)($stmt->fetch()['total'] ?? 0);
        
        $stmt = $db->prepare("SELECT COUNT(*) as total FROM tasks WHERE user_id = :user_id AND DATE(completed_at) = :today AND status = 'completed'");
        $stmt->execute(['user_id' => $userId, 'today' => $today]);
        $completed_tasks = (int)($stmt->fetch()['total'] ?? 0);

        Response::json([
            'income' => $income,
            'expense' => $expense,
            'kept' => $income - $expense,
            'focus_seconds' => $focus_seconds,
            'pending_tasks' => $pending_tasks,
            'completed_tasks' => $completed_tasks
        ]);
    }
    
    public static function week() {
        $userId = $GLOBALS['user']['id'] ?? null;
        if (!$userId) Response::error('Unauthorized', 'UNAUTHORIZED', 401);
        
        // Return dummy or implement full week logic. (Implementing simple one)
        $db = Database::getInstance()->getConnection();
        
        $startOfWeek = date('Y-m-d', strtotime('monday this week'));
        
        // Income
        $stmt = $db->prepare("SELECT SUM(amount) as total FROM income_entries WHERE user_id = :user_id AND DATE(income_date) >= :start");
        $stmt->execute(['user_id' => $userId, 'start' => $startOfWeek]);
        $income = (float)($stmt->fetch()['total'] ?? 0);
        
        // Expenses
        $stmt = $db->prepare("SELECT SUM(amount) as total FROM expenses WHERE user_id = :user_id AND DATE(expense_date) >= :start");
        $stmt->execute(['user_id' => $userId, 'start' => $startOfWeek]);
        $expense = (float)($stmt->fetch()['total'] ?? 0);
        
        Response::json([
            'income' => $income,
            'expense' => $expense,
            'kept' => $income - $expense
        ]);
    }
    
    public static function month() {
        $userId = $GLOBALS['user']['id'] ?? null;
        if (!$userId) Response::error('Unauthorized', 'UNAUTHORIZED', 401);
        
        $db = Database::getInstance()->getConnection();
        
        $startOfMonth = date('Y-m-01');
        
        // Income
        $stmt = $db->prepare("SELECT SUM(amount) as total FROM income_entries WHERE user_id = :user_id AND DATE(income_date) >= :start");
        $stmt->execute(['user_id' => $userId, 'start' => $startOfMonth]);
        $income = (float)($stmt->fetch()['total'] ?? 0);
        
        // Expenses
        $stmt = $db->prepare("SELECT SUM(amount) as total FROM expenses WHERE user_id = :user_id AND DATE(expense_date) >= :start");
        $stmt->execute(['user_id' => $userId, 'start' => $startOfMonth]);
        $expense = (float)($stmt->fetch()['total'] ?? 0);
        
        Response::json([
            'income' => $income,
            'expense' => $expense,
            'kept' => $income - $expense
        ]);
    }

    public static function exportExpenses() {
        $userId = $GLOBALS['user']['id'] ?? null;
        if (!$userId) {
            header('HTTP/1.1 401 Unauthorized');
            exit;
        }

        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("
            SELECT e.expense_date, e.amount, e.description, c.name as category, e.notes 
            FROM expenses e 
            LEFT JOIN expense_categories c ON e.category_id = c.id 
            WHERE e.user_id = :user_id 
            ORDER BY e.expense_date DESC
        ");
        $stmt->execute(['user_id' => $userId]);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename=expenses.csv');
        $output = fopen('php://output', 'w');
        fputcsv($output, ['Date', 'Amount (INR)', 'Description', 'Category', 'Notes']);
        foreach ($data as $row) {
            fputcsv($output, $row);
        }
        fclose($output);
        exit;
    }

    public static function exportIncome() {
        $userId = $GLOBALS['user']['id'] ?? null;
        if (!$userId) {
            header('HTTP/1.1 401 Unauthorized');
            exit;
        }

        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("
            SELECT i.income_date, i.amount, i.source, c.name as category, i.notes 
            FROM income_entries i 
            LEFT JOIN income_categories c ON i.category_id = c.id 
            WHERE i.user_id = :user_id 
            ORDER BY i.income_date DESC
        ");
        $stmt->execute(['user_id' => $userId]);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename=income.csv');
        $output = fopen('php://output', 'w');
        fputcsv($output, ['Date', 'Amount (INR)', 'Source', 'Category', 'Notes']);
        foreach ($data as $row) {
            fputcsv($output, $row);
        }
        fclose($output);
        exit;
    }

    public static function exportMonthly() {
        $userId = $GLOBALS['user']['id'] ?? null;
        if (!$userId) {
            header('HTTP/1.1 401 Unauthorized');
            exit;
        }

        $db = Database::getInstance()->getConnection();
        $startOfMonth = date('Y-m-01');
        
        $stmt = $db->prepare("
            SELECT 'Expense' as type, e.expense_date as date, e.amount, e.description as details, c.name as category, e.notes 
            FROM expenses e 
            LEFT JOIN expense_categories c ON e.category_id = c.id 
            WHERE e.user_id = :user_id AND e.expense_date >= :start_exp
            UNION ALL
            SELECT 'Income' as type, i.income_date as date, i.amount, i.source as details, c2.name as category, i.notes 
            FROM income_entries i 
            LEFT JOIN income_categories c2 ON i.category_id = c2.id 
            WHERE i.user_id = :user_id AND i.income_date >= :start_inc
            ORDER BY date DESC
        ");
        $stmt->execute(['user_id' => $userId, 'start_exp' => $startOfMonth, 'start_inc' => $startOfMonth]);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename=monthly_report.csv');
        $output = fopen('php://output', 'w');
        fputcsv($output, ['Type', 'Date', 'Amount (INR)', 'Details', 'Category', 'Notes']);
        foreach ($data as $row) {
            fputcsv($output, $row);
        }
        fclose($output);
        exit;
    }
}
