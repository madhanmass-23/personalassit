# Database Entity Plan & AI Assistant Architecture

## 1. Database Entity Relationship Plan (Supabase / PostgreSQL)

```mermaid
erDiagram
    PROFILES ||--o{ TASKS : owns
    PROFILES ||--o{ EXPENSES : owns
    PROFILES ||--o{ FOCUS_SESSIONS : owns
    PROFILES ||--o{ ASSISTANT_CONVERSATIONS : owns
    
    PROFILES {
        uuid id PK
        string email
        string full_name
        jsonb user_preferences
        timestamp created_at
    }

    TASKS {
        uuid id PK
        uuid user_id FK
        string title
        text description
        date due_date
        time start_time
        time end_time
        string priority
        string category
        string state "upcoming, in_progress, completed, skipped, overdue"
        uuid recurrence_id FK
        timestamp created_at
    }

    EXPENSES {
        uuid id PK
        uuid user_id FK
        decimal amount
        string description
        string category
        date expense_date
        uuid template_id FK
        timestamp created_at
    }
    
    FOCUS_SESSIONS {
        uuid id PK
        uuid user_id FK
        timestamp start_time
        timestamp end_time
        string mode "normal, focus, strict"
        jsonb statistics
    }
    
    BLOCKED_APPS {
        uuid id PK
        uuid user_id FK
        string app_package_name
        uuid rule_id FK
    }

    ASSISTANT_CONVERSATIONS {
        uuid id PK
        uuid user_id FK
        timestamp created_at
    }
    
    ASSISTANT_MESSAGES {
        uuid id PK
        uuid conversation_id FK
        string role "user, assistant, tool"
        text content
        jsonb metadata
    }
```

## 2. AI Assistant Architecture

**Core Principle**: The AI must NOT directly mutate the database. It acts as an orchestrator that determines user intent.

**Architecture Flow**:
1. **User Input**: "I spent 80 on lunch."
2. **AI Intent Parser (Edge Function)**: LLM extracts intent -> `{"action": "create_expense", "payload": {"amount": 80, "description": "lunch", "category": "Food", "date": "today"}}`
3. **Structured Intent**: JSON payload is returned to the client/service layer.
4. **Validation (Zod)**: The application service validates the JSON payload against expected schemas.
5. **Application Service**: Application executes the action using the authenticated user's session.
6. **Database**: Securely mutated via standard API routes / Supabase client, enforcing Row Level Security.
