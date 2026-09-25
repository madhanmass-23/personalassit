# Technical Architecture & Project Structure

## 1. Technical Architecture
**Frontend**:
- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Component Library**: shadcn/ui
- **Animation**: Framer Motion
- **Form Validation**: Zod + React Hook Form
- **State Management**: React Query (for async server state) + Zustand (for UI state)

**Backend**:
- **BaaS**: Supabase
- **Database**: PostgreSQL
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Compute**: Supabase Edge Functions (for AI integrations & complex background tasks)

## 2. Proposed Project Folder Structure
A scalable, feature-based architecture to separate UI from business logic.

```text
src/
├── app/                      # Next.js App Router (Pages & Layouts)
│   ├── (auth)/               # Authentication routes
│   ├── (dashboard)/          # Main authenticated application routes
│   │   ├── tasks/
│   │   ├── money/
│   │   ├── focus/
│   │   └── me/
│   ├── api/                  # Next.js Route Handlers
│   ├── layout.tsx
│   └── page.tsx
├── components/               # Generic, reusable UI components
│   ├── ui/                   # shadcn/ui generic components
│   ├── layout/               # Nav, Sidebar, Header
│   └── shared/               # Shared non-business components
├── features/                 # Domain-specific modules
│   ├── tasks/                # Task management domain
│   │   ├── components/       # Task-specific UI
│   │   ├── hooks/            # Task-specific data fetching
│   │   ├── schemas/          # Zod validation
│   │   └── utils/
│   ├── money/
│   ├── focus/
│   ├── assistant/
│   └── core/                 # Cross-domain business logic
├── lib/                      # Core configurations & clients
│   ├── supabase/             # Supabase client instances
│   ├── utils.ts              # Generic utilities (cn, etc.)
│   └── constants.ts
├── hooks/                    # Global hooks (useMediaQuery, etc.)
├── types/                    # Global TypeScript definitions
└── config/                   # Global configuration (env, navigation)
```
