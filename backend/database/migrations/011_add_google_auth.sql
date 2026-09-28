ALTER TABLE users
ADD COLUMN google_sub VARCHAR(255) NULL UNIQUE AFTER email,
ADD COLUMN avatar_url VARCHAR(1024) NULL AFTER timezone,
ADD COLUMN auth_provider ENUM('email', 'google') DEFAULT 'email' AFTER email,
MODIFY COLUMN password_hash VARCHAR(255) NULL;
