<?php

namespace Middleware;

use Utils\Response;

class RateLimitMiddleware {
    public static function handle($maxRequests = 10, $timeWindowSeconds = 60) {
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        if ($ip === 'unknown') return;

        // Simple file-based rate limiter
        $tmpDir = sys_get_temp_dir() . '/pa_rate_limit';
        if (!is_dir($tmpDir)) {
            @mkdir($tmpDir, 0777, true);
        }

        $hash = md5($ip . $_SERVER['REQUEST_URI']);
        $file = $tmpDir . '/' . $hash;

        $now = time();
        $requests = [];

        if (file_exists($file)) {
            $data = file_get_contents($file);
            if ($data) {
                $requests = json_decode($data, true) ?: [];
            }
        }

        // Filter out old requests
        $requests = array_filter($requests, function($timestamp) use ($now, $timeWindowSeconds) {
            return ($now - $timestamp) < $timeWindowSeconds;
        });

        if (count($requests) >= $maxRequests) {
            Response::error('Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', 429);
        }

        $requests[] = $now;
        file_put_contents($file, json_encode(array_values($requests)));
    }
}
