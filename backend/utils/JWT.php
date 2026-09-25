<?php

namespace Utils;

use Config\Environment;

class JWT {
    private static function base64url_encode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64url_decode($data) {
        return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', 3 - (3 + strlen($data)) % 4));
    }

    public static function encode($payload) {
        $secret = Environment::get('JWT_SECRET');
        if (!$secret) {
            throw new \Exception("JWT secret not configured");
        }

        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode($payload);

        $base64UrlHeader = self::base64url_encode($header);
        $base64UrlPayload = self::base64url_encode($payload);

        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);
        $base64UrlSignature = self::base64url_encode($signature);

        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    public static function decode($jwt) {
        $secret = Environment::get('JWT_SECRET');
        if (!$secret) {
            return null;
        }

        $tokenParts = explode('.', $jwt);
        if (count($tokenParts) != 3) {
            return null;
        }
        
        $header = base64_decode($tokenParts[0]);
        $payload = json_decode(self::base64url_decode($tokenParts[1]), true);
        $signature_provided = $tokenParts[2];

        $base64UrlHeader = self::base64url_encode($header);
        $base64UrlPayload = self::base64url_encode(json_encode($payload));
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);
        $base64UrlSignature = self::base64url_encode($signature);

        if (hash_equals($base64UrlSignature, $signature_provided)) {
            // Check expiration
            if (isset($payload['exp']) && $payload['exp'] < time()) {
                return null;
            }
            return $payload;
        }

        return null;
    }
}
