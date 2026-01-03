# Architecture Documentation

## System Overview

Life Tracker is a server-first web application built with SvelteKit for managing tasks, chores, and habits. The MVP uses a traditional request/response architecture with plans to evolve into a local-first application with offline sync capabilities.

## Core Concepts

### Mental Model

**Categories** are named instances (e.g., "Household Chores", "Work Tasks", "Fitness Habits"). Each category:

- Is created from a template (Tasks, Chores, or Habits)
- Can be private or explicitly shared with others
- Contains items of that template type

### Three Core Trackers

1. **Tasks** - Action items with priorities

   - Priority: Urgent/High/Medium/Low
   - Optional: Assignee, Deadline, Time estimate
   - Can be one-off or recurring
   - Archived when completed

2. **Chores** - Recurring maintenance

   - Always recurring (weekly, monthly, etc.)
   - Assignable to household members
   - Archived when completed

3. **Habits** - Daily tracking
   - Log entries per day with optional notes
   - Track streaks (consecutive days)
   - Track frequency goals (e.g., 3x per week)
   - Mark as good or bad habit

## Use Case Diagrams

### Overall System Use Cases

```mermaid
graph TB
    user1((User))
    user2((User))

    subgraph categories [Category Management]
        createCat[Create Category]
        shareCat[Share Category]
        viewCat[View Categories]
        editCat[Edit Category]
    end

    subgraph tasks [Task Management]
        createTask[Create Task]
        setPriority[Set Priority]
        assignTask[Assign Task]
        setDeadline[Set Deadline]
        addEstimate[Add Time Estimate]
        makeRecurring[Make Recurring]
        completeTask[Complete Task]
        viewArchived[View Archived Tasks]
    end

    subgraph chores [Chore Management]
        createChore[Create Recurring Chore]
        assignChore[Assign Chore]
        completeChore[Complete Chore]
        viewChoreSchedule[View Schedule]
    end

    subgraph habits [Habit Tracking]
        logEntry[Log Habit Entry]
        addNotes[Add Entry Notes]
        viewStreak[View Streak]
        trackFrequency[Track Frequency]
        viewHistory[View Entry History]
    end

    user1 --> categories
    user2 --> categories
    user1 --> tasks
    user2 --> tasks
    user1 --> chores
    user2 --> chores
    user1 --> habits
    user2 --> habits
```

### Task Management Flow

```mermaid
sequenceDiagram
    actor User
    participant UI
    participant API
    participant DB

    User->>UI: Create Task
    UI->>UI: Show task form
    User->>UI: Fill details (priority, deadline, etc.)
    User->>UI: Submit

    UI->>UI: Show loading state
    UI->>API: POST /api/categories/:id/items
    API->>API: Validate with Zod schema

    alt Validation Success
        API->>DB: INSERT task with fields
        DB-->>API: Task created
        API-->>UI: 200 + task data
        UI->>UI: Show success toast
        UI-->>User: Task appears in list
    else Validation Error
        API-->>UI: 400 + error details
        UI->>UI: Show error toast
        UI-->>User: Display field errors
    end
```

### Recurring Task Flow

```mermaid
sequenceDiagram
    actor User
    participant UI
    participant API
    participant DB

    User->>UI: Complete recurring task
    UI->>API: PUT /api/items/:id/complete

    API->>DB: Mark task archived
    API->>DB: Set completed_at
    API->>API: Calculate next occurrence
    API->>DB: Create new task instance
    API->>DB: Set next_show_date

    DB-->>API: Tasks updated
    API-->>UI: 200 + updated data
    UI->>UI: Hide completed task
    UI->>UI: Show success toast
    UI-->>User: Task marked complete

    Note over DB,UI: New instance won't appear<br/>until next_show_date
```

### Habit Tracking Flow

```mermaid
sequenceDiagram
    actor User
    participant UI
    participant API
    participant DB

    User->>UI: Log habit entry
    UI->>UI: Show entry form
    User->>UI: Add checkmark + notes
    User->>UI: Submit

    UI->>API: POST /api/habits/:id/entries
    API->>DB: INSERT habit_entry
    API->>DB: Calculate new streak
    API->>DB: Update frequency progress

    DB-->>API: Entry saved
    API-->>UI: 200 + updated stats
    UI->>UI: Update streak display
    UI->>UI: Show success toast
    UI-->>User: Entry logged
```

### Sharing Flow

```mermaid
sequenceDiagram
    actor UserA as User A
    actor UserB as User B
    participant UI
    participant API
    participant DB

    UserA->>UI: Click "Share Category"
    UI->>UI: Show share dialog
    UserA->>UI: Select User B
    UserA->>UI: Confirm share

    UI->>API: POST /api/categories/:id/share
    API->>DB: INSERT shared_access
    API->>DB: Update is_private = false
    DB-->>API: Share created
    API-->>UI: 200 + success
    UI->>UI: Show success toast

    Note over UserB,UI: Next time User B logs in
    UserB->>UI: View dashboard
    UI->>API: GET /api/categories
    API->>DB: Query categories + shared
    DB-->>API: Include shared category
    API-->>UI: Categories list
    UI-->>UserB: Shared category visible
```

## Architecture Diagrams

### MVP Architecture (Phase 1)

```mermaid
graph TB
    subgraph client [Client Browser]
        ui[Svelte Components]
        shadcn[shadcn-svelte UI]
        stores[Svelte Stores]
        toast[Toast System]
    end

    subgraph server [SvelteKit Server]
        ssr[SSR Pages]
        api[API Routes]
        zod[Zod Validation]
        lucia[Lucia Auth]
        db[SQLite Database]
    end

    ui --> shadcn
    ui -->|load page| ssr
    ui -->|API calls| api
    api -->|validate| zod
    api -->|check auth| lucia
    api -->|read/write| db
    stores -->|client state| ui
    toast -->|error feedback| ui
```

### Future Architecture (Post-MVP)

```mermaid
graph TB
    subgraph client [Client Browser]
        ui[Svelte Components]
        idb[IndexedDB Store]
        sw[Service Worker]
        sync[Sync Manager]
        toast[Toast System]
    end

    subgraph server [SvelteKit Server]
        api[API Routes]
        db[SQLite Database]
        lucia[Lucia Auth]
        reminder[Reminder Cron]
    end

    ui -->|optimistic write| idb
    ui -->|queue sync| sync
    sync -->|background sync| api
    api -->|read/write| db
    api -->|auth check| lucia
    sw -->|notifications| ui
    sw -->|cache assets| ui
    reminder -->|check due| db
    toast -->|user feedback| ui
    idb -->|offline data| ui
```

## Component Architecture

```mermaid
graph TB
    subgraph layout [App Shell]
        shell[AppShell]
        nav[Navigation]
        header[Header]
        toaster[Toaster]
    end

    subgraph pages [Route Pages]
        home[Dashboard]
        catDetail[Category Detail]
        itemDetail[Item Detail]
        habits[Habits View]
        archive[Archive View]
        settings[Settings]
    end

    subgraph features [Feature Components]
        catForm[CategoryForm]
        taskForm[TaskForm]
        choreForm[ChoreForm]
        habitLog[HabitLogForm]
        shareDialog[ShareDialog]
        recurringConfig[RecurringConfig]
    end

    subgraph ui [shadcn-svelte Components]
        button[Button]
        input[Input]
        select[Select]
        dialog[Dialog]
        toast[Toast]
        calendar[Calendar]
    end

    shell --> nav
    shell --> header
    shell --> toaster
    shell --> pages
    pages --> features
    features --> ui
```

## Technology Stack

### Frontend

- **SvelteKit**: Meta-framework for SSR, routing, and API
- **TypeScript**: Type safety throughout
- **Tailwind CSS**: Utility-first styling
- **shadcn-svelte**: Pre-built accessible components
- **Svelte Stores**: Client-side state management
- **svelte-sonner**: Toast notifications
- **Zod**: Runtime validation and type inference

### Backend

- **SvelteKit API Routes**: RESTful API
- **better-sqlite3**: Synchronous SQLite driver
- **Lucia Auth v3**: Session-based authentication
- **Zod**: Request/response validation

### Testing

- **Vitest**: Unit and integration tests (co-located)
- **Histoire**: Component development and stories
- **Playwright**: End-to-end tests
- **vitest-axe**: Accessibility testing

### DevOps

- **Docker**: Containerization
- **GitHub Actions**: CI/CD
- **Caddy**: Reverse proxy with auto-HTTPS
- **Node 24**: LTS runtime

## Data Flow

### MVP: Traditional Request/Response

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant Zod
    participant API
    participant DB

    User->>UI: Create Item
    UI->>UI: Show loading state
    UI->>API: POST /api/items
    API->>Zod: Validate request

    alt Validation Failed
        Zod-->>API: Validation errors
        API-->>UI: 400 + errors
        UI->>UI: Show error toast
        UI-->>User: Display field errors
    else Validation Passed
        Zod-->>API: Validated data
        API->>DB: INSERT item
        DB-->>API: Success
        API-->>UI: 200 + item data
        UI->>UI: Show success toast
        UI->>UI: Update UI
        UI-->>User: Item visible
    end
```

### Error Handling Flow

```mermaid
sequenceDiagram
    participant UI
    participant API
    participant Toast
    participant User

    UI->>API: Request

    alt Success
        API-->>UI: 200 + data
        UI->>Toast: Success message
        Toast-->>User: Green toast
    else Validation Error
        API-->>UI: 400 + field errors
        UI->>UI: Highlight fields
        UI->>Toast: Validation error
        Toast-->>User: Red toast + details
    else Auth Error
        API-->>UI: 401 Unauthorized
        UI->>UI: Redirect to login
        UI->>Toast: Session expired
    else Server Error
        API-->>UI: 500 + error
        UI->>Toast: Something went wrong
        Toast-->>User: Red toast + retry
    end
```

## Key Design Decisions

### Why Server-First for MVP?

- **Simpler**: Traditional patterns, less complexity
- **Faster to build**: Skip sync queue, conflict resolution
- **Proven**: Well-understood architecture
- **Progressive**: Can add optimistic UI later

### Why SQLite?

- **Simple deployment**: Single file database
- **Perfect for 2 users**: No need for client/server database
- **Local-first ready**: Can sync to IndexedDB later
- **Lightweight**: No database server needed

### Why Lucia Auth?

- **SvelteKit-first**: Built for SvelteKit patterns
- **Session-based**: Simple, secure, SSR-friendly
- **Type-safe**: Full TypeScript support
- **Flexible**: Easy to extend later

### Why Zod?

- **Type inference**: Types from schemas automatically
- **Runtime validation**: Catch errors at API boundary
- **Great DX**: Clear error messages
- **Composable**: Reuse schemas across client/server

### Why shadcn-svelte?

- **Accessible**: Built with a11y in mind
- **Customizable**: Tailwind-based, full control
- **Own the code**: Components in your repo
- **Modern**: Latest Svelte patterns

### Why Histoire?

- **Svelte-native**: Built for Svelte/SvelteKit
- **Fast**: Vite-powered
- **Simple**: Less config than Storybook
- **Integrated**: Works well with existing setup

### Why Co-located Tests?

- **Discoverability**: Tests next to implementation
- **Maintenance**: Easy to find and update
- **Context**: Tests close to code they test
- **Convention**: Common in modern codebases

## Deployment Architecture

```mermaid
graph LR
    subgraph internet [Internet]
        users[Users]
    end

    subgraph vps [VPS Server]
        caddy[Caddy Reverse Proxy]
        app[Life Tracker Container]
        db[(SQLite File)]
    end

    users -->|HTTPS| caddy
    caddy -->|proxy| app
    app -->|read/write| db
```

### Deployment Flow

1. Push to GitHub main branch
2. GitHub Actions builds Docker image
3. Security scan with Trivy
4. Push image to ghcr.io
5. SSH to VPS and pull new image
6. Restart container with new image
7. Caddy handles HTTPS and routing

## Security Considerations

### Authentication

- Passwords hashed with bcrypt (via Lucia)
- HTTP-only session cookies
- CSRF protection via SvelteKit
- Session expiration (7 days)

### Data Privacy

- Each user sees only their data
- Shared categories require explicit permission
- No cross-user data leakage
- SQL injection prevented (prepared statements)

### Network Security

- All traffic over HTTPS (Caddy)
- Rate limiting on API endpoints
- Security headers (CSP, HSTS, etc.)
- Input validation with Zod

### Error Handling

- Never expose stack traces to client
- Log errors server-side
- User-friendly error messages
- Toast notifications for all errors

## Performance Considerations

### MVP

- Server-side rendering for fast initial load
- Static asset caching
- Database indices on foreign keys
- Pagination for large lists
- Optimistic UI feedback (loading states)

### Testing Strategy

- Unit tests for all logic (co-located)
- Histoire stories for all components
- E2E tests for critical user flows
- Accessibility tests with vitest-axe
- Performance budgets in CI

### Accessibility

- Semantic HTML throughout
- ARIA labels where needed
- Keyboard navigation
- Focus management
- Screen reader tested
- Color contrast compliance

### Future Optimizations

- IndexedDB caching
- Optimistic UI updates
- Service Worker asset caching
- Background sync
- Virtual scrolling for large lists

## Scalability Notes

### Current (2 users)

- Single SQLite file sufficient
- No replication needed
- Simple backup strategy
- Single VPS container

### Future (if expanding)

- Consider PostgreSQL for > 10 users
- Add Redis for sessions
- Implement proper caching layer
- Database connection pooling
- Multiple app instances behind load balancer
