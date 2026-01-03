# Project Planning Summary

## Overview

Life Tracker is a life organization app for tracking tasks, chores, and habits, built for 2 users (you and your girlfriend) with explicit sharing capabilities.

## Documentation Structure

```
life-tracker/
├── README.md                    # Project overview
└── docs/
    ├── ARCHITECTURE.md         # System architecture with use cases
    ├── DATABASE.md             # Complete database schema
    ├── API.md                  # API documentation with Zod
    ├── DEPLOYMENT.md           # Deployment and infrastructure
    ├── FUTURE_IMPROVEMENTS.md  # Deferred features
    └── tickets/                # Development tickets (13 MVP tickets)
```

## Mental Model

**Categories** are named instances like "Household Chores", "Work Tasks", "Fitness Habits":

- Created from templates (Tasks, Chores, or Habits)
- Can be private or explicitly shared
- Contain items of that tracker type

**Three Core Trackers:**

### 1. Tasks - Action Items

- **Priority**: Urgent/High/Medium/Low (4 levels)
- **Optional**: Assignee, Deadline, Time estimate
- **Recurring**: Can be one-off or recurring
- **Completion**: Archived when done, next occurrence auto-created for recurring

### 2. Chores - Recurring Maintenance

- **Always recurring**: Weekly, monthly, etc.
- **Assignable**: To household members
- **Completion**: Archived, next occurrence created immediately but hidden until period passes

### 3. Habits - Daily Tracking

- **Entries**: Log daily with checkmark + optional notes
- **Tracking**: Streaks (consecutive days), frequency goals (e.g., 3x/week)
- **Type**: Mark as good or bad habit
- **History**: View all logged entries with stats

## Key Decisions

### Technical Stack

**Framework & Language:**

- SvelteKit (not Next.js) ✅
- TypeScript everywhere
- Node 24 (current LTS)

**UI & Styling:**

- shadcn-svelte (accessible, customizable components)
- Tailwind CSS v4
- svelte-sonner (toast notifications)

**Data & Validation:**

- SQLite (VPS filesystem)
- better-sqlite3 driver
- Zod schemas for all validation
- Type-safe throughout

**Auth:**

- Lucia Auth v3 (not custom)
- Session-based with HTTP-only cookies
- 2 users (expandable later)

**Testing:**

- Vitest (unit tests, co-located with source)
- Histoire (component stories, not Storybook)
- Playwright (E2E tests)
- vitest-axe (accessibility testing)

**Error Handling:**

- Global toast system (svelte-sonner)
- Consistent error messages
- User-friendly feedback
- Never expose stack traces

**Development:**

- Husky + lint-staged
- commitlint (allow ticket IDs as scopes)
- commit-and-tag-version
- Docker + GitHub Actions

### Quality Philosophy

**Embedded, not Phased:**

- Accessibility checks in every UI ticket
- Performance considerations in every feature
- Unit tests with every implementation
- E2E tests for every user flow
- No separate "Polish Phase"

### Scope Decisions

**MVP Includes:**

- ✅ Tasks (priority, assignment, deadline, estimate, recurring, archive)
- ✅ Chores (recurring, assignment, archive)
- ✅ Habits (daily entries, streaks, frequency tracking)
- ✅ Category sharing (explicit share between 2 users)
- ✅ Assignment to users
- ✅ Dashboard with overview
- ✅ PWA (installable)
- ✅ Toast notifications
- ✅ Full test coverage

**Deferred to FUTURE_IMPROVEMENTS.md:**

- Search and filtering
- Statistics dashboard
- Analytics with charts
- Data export
- Reminders/notifications
- Offline sync with IndexedDB
- Multi-user beyond 2

## Database Schema Highlights

### Core Tables (MVP Active)

- `users`: Authentication (2 users)
- `categories`: Named instances with template_type
- `fields`: Dynamic field definitions
- `items`: Tasks/chores/habit trackers
- `field_values`: Actual item data (EAV pattern)
- `habit_entries`: Daily habit logs
- `shared_access`: Category sharing
- `templates`: Pre-built templates

### Item Fields

- `assigned_to_user_id`: Who is responsible
- `priority`: urgent/high/medium/low (tasks only)
- `deadline`: Due date (optional)
- `time_estimate`: Estimated minutes (optional)
- `is_archived`: Completion status
- `completed_at`: When completed
- `recurring_config`: JSON with frequency/interval
- `next_show_date`: When to show next occurrence

### Field Types Supported

1. **text**: Free text input
2. **number**: Numeric values
3. **date**: Date picker
4. **boolean**: Checkbox
5. **select**: Dropdown with custom options

## Templates (MVP)

### 1. Tasks Template

```json
{
	"name": "Tasks",
	"template_type": "task",
	"icon": "✓",
	"color": "#3b82f6",
	"fields": [
		{ "name": "Title", "field_type": "text" },
		{ "name": "Description", "field_type": "text" }
	]
}
```

Plus metadata: priority, deadline, time_estimate, recurring, assignment

### 2. Chores Template

```json
{
	"name": "Chores",
	"template_type": "chore",
	"icon": "🧹",
	"color": "#10b981",
	"fields": [
		{ "name": "Chore Name", "field_type": "text" },
		{ "name": "Notes", "field_type": "text" }
	]
}
```

Plus metadata: recurring (required), assignment

### 3. Habits Template

```json
{
	"name": "Habits",
	"template_type": "habit",
	"icon": "📈",
	"color": "#8b5cf6",
	"fields": [
		{ "name": "Habit Name", "field_type": "text" },
		{ "name": "Goal", "field_type": "text" },
		{ "name": "Is Good Habit", "field_type": "boolean" }
	]
}
```

Uses separate `habit_entries` table for daily logging

## Implementation Phases

### 🎯 Phase 1: MVP (13 tickets)

**Goal:** Working deployed app with tasks, chores, habits

1. **ticket-001**: Setup (SvelteKit, shadcn, Zod, Histoire, Lucia, Node 24)
2. **ticket-002**: Database schema (all tables for tasks/chores/habits)
3. **ticket-003**: Auth (Lucia Auth v3)
4. **ticket-004**: Toast system (svelte-sonner)
5. **ticket-005**: UI foundation (shadcn + Histoire stories)
6. **ticket-006**: Categories CRUD (with template_type)
7. **ticket-007**: Sharing (explicit share with other user)
8. **ticket-008**: Tasks (priority, assignment, deadline, estimate, recurring, archive)
9. **ticket-009**: Chores (recurring, assignment, archive)
10. **ticket-010**: Habits (entries, streaks, frequency tracking)
11. **ticket-011**: Templates (Tasks, Chores, Habits)
12. **ticket-012**: Dashboard (overview, assigned to me, due soon)
13. **ticket-013**: PWA + Deployment + E2E tests

**MVP Result:** ✅ Fully working life tracker deployed at tracker.timostermann.io

**Estimated Timeline:** 3-4 weeks

---

### 🔜 Future Improvements

See [FUTURE_IMPROVEMENTS.md](./FUTURE_IMPROVEMENTS.md) for complete list:

- Search and filtering (full-text, multi-filter)
- Statistics (completion rates, trends)
- Analytics (charts, reports)
- Export (JSON, CSV, iCal)
- Reminders (web push, service worker)
- Offline sync (IndexedDB, optimistic UI)
- Enhanced collaboration (comments, activity feed)
- Mobile app (native features)

## Commitlint Configuration

**Allowed scopes:**

- `setup`, `db`, `auth`, `categories`, `items`, `habits`, `ui`, `docs`, `api`, `pwa`
- **Ticket IDs**: `ticket-001` through `ticket-013` (and future tickets)

**Example commits:**

```
feat(ticket-008): add task priority selection
fix(api): handle null assigned_to_user_id
test(habits): add streak calculation tests
docs(tickets): update ticket-010 acceptance criteria
```

## Development Workflow

### Testing Strategy

**Unit Tests (Vitest):**

- Co-located with source files (`component.test.ts`)
- All logic, utilities, API handlers
- Run automatically in pre-commit hook

**Component Stories (Histoire):**

- All shadcn components customized
- All custom components
- Interactive states and variants
- Accessibility checks

**E2E Tests (Playwright):**

- Critical user flows
- Task/chore/habit CRUD
- Sharing workflows
- Assignment and archiving
- Recurring task logic

**Accessibility:**

- vitest-axe in component tests
- Manual screen reader testing
- Keyboard navigation verification
- Color contrast checks

### Pre-commit Hooks

1. Prettier formats code
2. ESLint checks code quality
3. Related tests run (vitest)
4. Commit message validated (commitlint)

### Continuous Integration

- Run all tests on PR
- Security scan (Trivy)
- Build check
- Deploy on merge to main

## Deployment Strategy

### CI/CD Pipeline

```
Git Push → GitHub Actions → Build Docker → Security Scan →
Push to ghcr.io → SSH to VPS → Pull Image → Deploy Container → Health Check
```

### Infrastructure

- **VPS:** Existing server
- **Database:** `/mnt/app-data/life-tracker/db.sqlite`
- **Reverse Proxy:** Caddy (with rate limiting)
- **Domain:** `tracker.timostermann.io`
- **Backup:** Daily at 2 AM (existing system)
- **Monitoring:** Uptime Kuma + health checks

## Repository Setup

### Location

`/Users/tim.ostermann/Projekte/Test-Projekte/life-tracker/`

### Visibility

Public GitHub repository

### GitHub Account

timostermann

### Repository Name

`life-tracker`

## Zod Type Safety Strategy

**All API endpoints:**

- Request validation with Zod schemas
- Response validation (in dev)
- Type inference with `z.infer<>`
- Shared schemas between client/server

**Example:**

```typescript
// schemas/task.ts
export const createTaskSchema = z.object({
	priority: z.enum(['urgent', 'high', 'medium', 'low']),
	deadline: z.string().datetime().optional(),
	values: z.record(z.string(), z.string())
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

// API route uses schema
const result = createTaskSchema.safeParse(await request.json());

// Client gets types
import type { CreateTaskInput } from '$lib/schemas/task';
```

## Key Features Walkthrough

### Creating a Task

1. User selects "Household Chores" category (template_type: task)
2. Clicks "New Task"
3. Fills form: Title, Description, Priority (urgent), Deadline (Jan 15), Assign to girlfriend
4. Optionally makes it recurring (weekly)
5. Submits → Zod validates → API creates item + field_values
6. Success toast appears, task visible in list
7. If recurring: when completed, archives current and creates next (shows after 7 days)

### Logging a Habit

1. User opens "Fitness Habits" category (template_type: habit)
2. Sees "Morning Run" habit with current streak: 5 days
3. Clicks "Log Today"
4. Checkmark filled, optionally adds notes: "Felt great!"
5. Submits → Creates habit_entry for today
6. Streak updates to 6 days
7. View history shows all logged days with notes

### Sharing a Category

1. User opens "Household Chores" category
2. Clicks "Share" button
3. Selects girlfriend from dropdown
4. Chooses permission: "Edit"
5. Confirms → Creates shared_access record, sets is_private=false
6. Success toast: "Category shared"
7. Girlfriend now sees category in her dashboard

### Completing a Recurring Chore

1. User completes "Vacuum living room" (weekly chore)
2. Clicks "Mark Complete"
3. API marks current item archived with completed_at
4. Calculates next occurrence: +7 days
5. Creates new item with next_show_date = now + 7 days
6. New item hidden from lists until next week
7. Success toast: "Chore completed!"

## Questions & Clarifications

### Answered ✅

- Database location: VPS filesystem
- File attachments: No (not in MVP)
- Repository: Public repo under your account
- Component stories: Histoire (not Storybook)
- Templates: Tasks, Chores, Habits (not Expenses, Meals, etc.)
- UI library: shadcn-svelte (not custom)
- Auth: Lucia Auth (not custom)
- Node version: 24 (not 22)
- Test location: Co-located with source
- Commitlint: Allow ticket IDs
- Quality: Embedded in all tickets, not separate phase
- Priorities: 4 levels (Urgent/High/Medium/Low)
- Habit notes: Optional per entry
- Chore rotation: No auto-rotation
- Task completion: Archive with history
- Recurring: Next occurrence created immediately, shows after period

### Architecture Confirmed

- MVP: Server-first (traditional request/response)
- Future-proofing: Database ready for offline sync
- Categories: Named instances of templates
- Sharing: Explicit between users
- Assignment: Per item, not required
- Error handling: Toast notifications throughout

## Resources

- **Documentation:** See `docs/` folder
- **Tickets:** See `docs/tickets/` folder (13 tickets)
- **Reference Projects:**
  - `currency-calculator/`: Tooling patterns
  - `portfolio/`: SvelteKit deployment
  - `server-setup/`: Infrastructure patterns

## Timeline Estimate

- **Phase 1 (MVP):** 3-4 weeks → Deployed working app
- **Future improvements:** As needed based on usage

**MVP to Production:** 3-4 weeks! 🚀

## Next Steps

1. **Review updated documentation**
   - Architecture with use case diagrams
   - Database schema for tasks/chores/habits
   - API documentation with Zod examples
   - FUTURE_IMPROVEMENTS.md for deferred features

2. **Review revised tickets**
   - 13 MVP tickets (vs original 24)
   - Quality embedded in each ticket
   - New tech stack reflected

3. **When ready to implement:**
   - Initialize git repo
   - Begin with ticket-001 (setup)
   - Follow conventional commits with ticket scopes
   - Use tickets as development roadmap

## Summary of Changes from Original Plan

### Added

- shadcn-svelte UI library
- Histoire for component stories
- Lucia Auth for authentication
- Zod for validation
- svelte-sonner for toasts
- Node 24 (from 22)
- Co-located tests
- Ticket IDs in commitlint
- Assignment to users
- Task priorities (4 levels)
- Habit entries table
- Recurring logic with next_show_date
- Archive functionality

### Changed

- Templates: Tasks/Chores/Habits (not Expenses/Meals)
- Categories: Named instances (not just folders)
- Quality: Embedded in all tickets (not Phase 4)
- Test location: Co-located (not separate folder)
- 13 MVP tickets (from 12)

### Removed from MVP

- Custom auth (using Lucia)
- Custom UI components (using shadcn)
- Storybook (using Histoire)
- Search/filtering (future)
- Statistics (future)
- Export (future)
- Analytics (future)
- Reminders (future)
- Offline sync (future)
- Separate polish phase

**Everything is documented and ready to build!** 🎉
