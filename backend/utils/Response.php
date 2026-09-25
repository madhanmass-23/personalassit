<?php

namespace Utils;

class Response {
    public static function json($data, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => true,
            'data' => $data
        ]);
        exit;
    }

    public static function error($message, $code = 'ERROR', $statusCode = 400) {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => false,
            'error' => [
                'code' => $code,
                'message' => $message
            ]
        ]);
        exit;
    }
}
