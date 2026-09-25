# Product Architecture & Information Architecture

## 1. Product Architecture
**Product Principle**: The application serves as a personal operating system for the user's daily life, answering four core questions:
- What do I need to do?
- What have I spent?
- What should I be doing now?
- How can I protect my focus?

### Core Modules
1. **Home**: A unified dashboard summarizing today's tasks, recent expenses, and current focus state.
2. **Tasks**: A comprehensive task management system with support for reminders, recurrence, and varying states.
3. **Money**: Extremely fast expense entry and tracking with natural language support and templates.
4. **Focus**: Distraction control, Pomodoro/focus sessions, and rules.
5. **AI Assistant**: Natural language interface for reading and writing data across modules without direct database mutation.
6. **Profile / Settings**: User preferences, account management, and module configurations.

## 2. Information Architecture
### Primary Navigation
- **Home**: `/`
- **Tasks**: `/tasks`
- **Money**: `/money`
- **Focus**: `/focus`
- **Me (Profile/Settings)**: `/me`
- **AI Assistant**: Global overlay or persistent FAB (Floating Action Button).

### Sitemap Breakdown
- `/`
  - Daily Summary
  - Quick Add (Task/Expense)
- `/tasks`
  - `/tasks/upcoming`
  - `/tasks/in-progress`
  - `/tasks/completed`
  - `/tasks/[id]` (Detail/Edit)
- `/money`
  - `/money/today`
  - `/money/analytics`
  - `/money/templates`
- `/focus`
  - `/focus/session` (Active session)
  - `/focus/stats`
  - `/focus/rules` (App blocking rules)
- `/me`
  - `/me/preferences`
  - `/me/account`
