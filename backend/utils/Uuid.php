<?php

namespace Utils;

class Uuid {
    /**
     * Generate a cryptographically secure UUID v4 string.
     * 
     * @return string 36-character UUID string (e.g., 'f47ac10b-58cc-4372-a567-0e02b2c3d479')
     */
    public static function v4(): string {
        $bytes = random_bytes(16);
        $bytes[6] = chr(ord($bytes[6]) & 0x0f | 0x40); // set version to 0100 (v4)
        $bytes[8] = chr(ord($bytes[8]) & 0x3f | 0x80); // set bits 6-7 to 10 (RFC 4122 variant)
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($bytes), 4));
    }

    /**
     * Validate whether a string is a valid UUID format.
     * 
     * @param mixed $uuid
     * @return bool
     */
    public static function isValid($uuid): bool {
        if (!is_string($uuid)) {
            return false;
        }
        return (bool) preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $uuid);
    }
}
