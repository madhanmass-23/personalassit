# Development Phase Roadmap & Risks

## 1. Development Phase Roadmap

**Phase 0: Architecture & Foundation (Current)**
- Define architecture, UI/UX tokens, and database schemas.
- Initialize Next.js project with Tailwind and shadcn/ui.

**Phase 1: Core Scaffolding & Auth**
- Setup Supabase Auth.
- Implement layout, navigation (bottom tab bar for mobile), and theme switching.
- Create base UI components (buttons, inputs, cards).

**Phase 2: Tasks & Money Modules**
- Build CRUD operations for Tasks.
- Build fast-entry UI for Expenses.
- Integrate React Query & Zod validation.

**Phase 3: AI Assistant MVP**
- Implement Edge Function for Intent Parsing.
- Build the chat interface.
- Map intents to Task/Expense creation.

**Phase 4: Focus Module & PWA Setup**
- Build Pomodoro timer and focus session tracking.
- Add PWA manifest and basic offline caching.

**Phase 5: Native Android Bridge (Future)**
- Develop native companion app for system-level blocking.

## 2. Risks and Technical Constraints
- **AI Latency**: Natural language parsing might feel slow compared to manual entry if Edge Functions have cold starts.
- **Native OS Limitations**: System-level app blocking is impossible purely via web. Managing user expectations around the web vs. native capabilities is critical.
- **Offline Sync Complexity**: Full offline read/write sync is notoriously complex. We must stick to simple queuing to avoid endless sync conflict edge cases.
