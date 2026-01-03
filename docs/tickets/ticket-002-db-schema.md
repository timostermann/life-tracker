# Ticket 002: Database Schema & Migrations

**ID:** ticket-002  
**Scope:** `db` or `ticket-002`  
**Phase:** 1 (MVP)  
**Dependencies:** ticket-001

## Description

Implement SQLite database schema for tasks, chores, and habits with migration system and seed data for templates.

## Tasks

- [x] Install `better-sqlite3` dependency
- [x] Create database wrapper in `src/lib/server/db.ts`
- [x] Create Zod schemas in `src/lib/schemas/db.ts`
- [x] Create TypeScript types matching schema
- [x] Create migration system with `schema_version` table
- [x] Create `001_initial_schema.sql` with all 8 tables
- [x] Create `002_seed_templates.sql` (Tasks, Chores, Habits)
- [x] Add Lucia-compatible sessions table (`sessions`) migration (`003_lucia_auth.sql`)
- [x] Add migration runner (runs automatically on server startup)
- [x] Create database helper functions (CRUD queries)
- [x] Add unit tests for database operations (co-located)
- [x] Enable WAL mode for SQLite

## Database Tables

1. `users` - Authentication
2. `categories` - Named instances (with template_type)
3. `fields` - Dynamic field definitions
4. `items` - Tasks/chores/habit trackers
5. `field_values` - Item data (EAV pattern)
6. `habit_entries` - Daily habit logs
7. `shared_access` - Category sharing
8. `templates` - Pre-built templates

## Key Fields in `items`

- `assigned_to_user_id` (FK to users, nullable)
- `priority` (urgent/high/medium/low, for tasks)
- `deadline` (datetime, nullable)
- `time_estimate` (integer minutes, nullable)
- `is_archived` (boolean, default false)
- `completed_at` (datetime, nullable)
- `recurring_config` (JSON text)
- `next_show_date` (datetime, nullable)

## Acceptance Criteria

- ✅ All 8 tables created successfully
- ✅ Migrations run automatically on startup
- ✅ System templates seeded (Tasks, Chores, Habits)
- ✅ Foreign keys enforced
- ✅ Indices created on all FKs and common query fields
- ✅ TypeScript types match Zod schemas
- ✅ Database file created at configured path
- ✅ WAL mode enabled
- ✅ Unit tests pass for all CRUD operations

## Technical Notes

**Database path:** Configurable via env:

- `DATABASE_PATH` is read from `.env` (SvelteKit private env).
- Defaults:
  - Development: `./.data/db.sqlite`
  - Production: `/data/db.sqlite`

**Local DB browser:** Optional `sqlite-web` via `docker compose up -d` (binds to `127.0.0.1:8080`).

**Migrations location:** `src/lib/server/db/migrations/`

**Zod schemas example:**

```typescript
export const userSchema = z.object({
	id: z.number().int().positive(),
	username: z.string().min(1),
	created_at: z.string().datetime()
});

export type User = z.infer<typeof userSchema>;
```

**Migration runner:**

```typescript
// Check schema_version, run pending migrations
// Transaction-wrapped for safety
```

**Logging:**

- Enable DB/migration logs via `DB_LOG=true` (or `LOG=true`)
- Optional: `LOG_LEVEL=debug|info|warn|error`

**Helper functions:**

```typescript
export const db = {
	getUser: (id: number) => User,
	createCategory: (data) => Category
	// etc.
};
```

## Testing

- ✅ Unit test: Create user
- ✅ Unit test: Create category with template_type
- ✅ Unit test: Create item with all fields
- ✅ Unit test: Create habit_entry
- ✅ Unit test: Foreign key constraints enforced
- ✅ Unit test: Recurring config JSON parses correctly
- ✅ Integration test: Full migration from scratch

## Accessibility

N/A (database layer)

## Performance

- ✅ Indices on all foreign keys
- ✅ Indices on priority, deadline, archived, next_show_date
- ✅ WAL mode for better concurrency
- ✅ Prepared statements for all queries
