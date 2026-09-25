# Authentication & Security Architecture

## 1. Authentication Architecture
- **Provider**: Supabase Auth.
- **Methods**: Magic Links (Passwordless) / OAuth (Google/Apple) for friction-free mobile entry.
- **Session Management**: Secure HTTP-only cookies managed via Next.js Server Actions or Route Handlers (Supabase SSR package).

## 2. Security Architecture
- **Row Level Security (RLS)**: 
  - Every core table (`tasks`, `expenses`, `focus_sessions`, etc.) must have `user_id` mapped to `auth.uid()`.
  - Strict RLS policies: Users can only `SELECT`, `INSERT`, `UPDATE`, `DELETE` where `user_id = auth.uid()`.
- **Credential Protection**:
  - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are safe for the client.
  - **Service Role Key** is NEVER exposed to the frontend. Used only in secure Edge Functions/Server Actions for administrative overrides (rarely needed).
- **Validation**:
  - All incoming data must be validated through Zod schemas both on the frontend (React Hook Form) and backend (Next.js API/Server Actions).
