# Personal Assistant PHP Backend

## Prerequisites
- PHP 8.1+
- MySQL 8.0+ or MariaDB 10.5+
- PDO MySQL extension

## Local Development Setup

1. **Configure Environment**
   ```bash
   cd backend
   cp .env.example .env
   ```
   Edit `.env` and fill in your local MySQL credentials.

2. **Initialize Database**
   Connect to your local MySQL server and create the database:
   ```sql
   CREATE DATABASE personal_assistant CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
   Run the migration to create tables:
   ```bash
   mysql -u youruser -p personal_assistant < database/migrations/001_create_users.sql
   ```

3. **Start the PHP Development Server**
   ```bash
   cd backend/public
   php -S localhost:8000 index.php
   ```

4. **Verify Health Endpoint**
   ```bash
   curl http://localhost:8000/api/health
   # Expected: {"success":true,"data":{"status":"ok"}}
   ```

5. **Start Next.js Frontend**
   In another terminal, at the repository root:
   ```bash
   npm run dev
   ```

## ServerByte Deployment Preparation
When preparing for production deployment on ServerByte:
1. Upload the `backend` directory to the server API folder (e.g., `/var/www/assistant.scaro.online/api`).
2. Point the Web Server (Nginx/Apache) Document Root for the API specifically to `backend/public/`.
3. Use the dedicated MySQL database on ServerByte:
   - **Host:** `sdb-88.hosting.stackcp.net`
   - **Database:** `personal_assistant-35313135113f`
   - **User:** `personal_assistant_user`
   - **Note:** Retrieve the password securely from the production environment manager. **Do not reuse the SCARO ERP database**.
4. Configure production `.env` with these credentials, generate a strong `JWT_SECRET`, and set `ALLOWED_ORIGINS` to `https://assistant.scaro.online`.

## Security Notes
- Passwords are hashed using `password_hash()` (Argon2i/Bcrypt depending on PHP default).
- Authentication uses a Stateless Bearer JWT transmitted via HttpOnly, Secure `auth_token` cookie.
- Prevents cross-domain API leaks via strict CORS setup.
