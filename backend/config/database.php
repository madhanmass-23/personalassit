<?php

namespace Config;

use PDO;
use PDOException;

class Database {
    private static $instance = null;
    private $connection;

    private function __construct() {
        $host = Environment::get('DB_HOST', '127.0.0.1');
        $port = Environment::get('DB_PORT', '3306');
        $db   = Environment::get('DB_NAME', 'personal_assistant');
        $user = Environment::get('DB_USER', 'root');
        $pass = Environment::get('DB_PASSWORD', '');
        $charset = 'utf8mb4';

        $dsn = "mysql:host=$host;port=$port;dbname=$db;charset=$charset";
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false, // Ensure strict types and real prepared statements
        ];

        try {
            $this->connection = new PDO($dsn, $user, $pass, $options);
        } catch (PDOException $e) {
            // Never expose connection details in the exception message
            error_log($e->getMessage());
            throw new \Exception("Database connection failed.");
        }
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->connection;
    }
}
