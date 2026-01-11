# Life Tracker

A life organization app for tracking tasks, chores, and habits. Built with SvelteKit, TypeScript, Tailwind CSS, and SQLite.

## Overview

Life Tracker helps you and your partner organize your lives through three core tracking types:

- **Tasks**: One-off or recurring action items with priorities and deadlines
- **Chores**: Recurring household maintenance
- **Habits**: Daily habit tracking with streaks and frequency goals

## Key Features

- 📋 **Task Management**: Priority levels (Urgent/High/Medium/Low), assignment, deadlines, time estimates, recurring
- 🧹 **Chore Tracking**: Recurring maintenance tasks with assignment
- 📈 **Habit Tracking**: Log daily habits (good/bad), track streaks, frequency goals
- 👥 **Sharing**: Explicitly share categories with your partner
- 📱 **PWA**: Installable on mobile and desktop
- 🔒 **Secure**: Lucia Auth with session management
- ✨ **Type-Safe**: Zod validation throughout
- 🎨 **Modern UI**: shadcn-svelte components

## Tech Stack

- **Framework:** SvelteKit
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn-svelte
- **Database:** SQLite (better-sqlite3)
- **Auth:** Lucia Auth v3
- **Validation:** Zod
- **Notifications:** svelte-sonner
- **Testing:** Vitest (unit), Histoire (components), Playwright (e2e)
- **Tooling:** Husky, lint-staged, commitlint, commit-and-tag-version

## Project Structure

```
life-tracker/
├── docs/                    # Documentation
│   ├── tickets/            # Development tickets
│   ├── ARCHITECTURE.md     # System architecture
│   ├── DATABASE.md         # Database schema
│   ├── API.md              # API documentation
│   ├── DEPLOYMENT.md       # Deployment guide
│   └── FUTURE_IMPROVEMENTS.md
├── src/
│   ├── lib/
│   │   ├── components/     # shadcn components + custom
│   │   │   └── *.test.ts  # Co-located tests
│   │   ├── server/        # Server-side utilities
│   │   │   └── db/        # SQLite (migrations, queries, connection)
│   │   ├── schemas/       # Zod schemas
│   │   └── utils/         # Utilities
│   └── routes/            # SvelteKit routes + API
├── tests/                 # E2E tests
└── .histoire/            # Component stories
```

## Core Concepts

### Categories

Named instances like "Household Chores", "Work Tasks", "Fitness Habits". Each category:

- Uses a template (Tasks, Chores, or Habits)
- Can be private or shared with partner
- Contains items of that type

### Tasks

One-off or recurring action items:

- Priority: Urgent, High, Medium, Low
- Optional: Assignee, Deadline, Time estimate
- Can be recurring (next occurrence auto-created)
- Archived when completed

### Chores

Recurring maintenance tasks:

- Always recurring (weekly, monthly, etc.)
- Assignable to household members
- Archived when completed

### Habits

Daily tracking for building good habits or breaking bad ones:

- Log entries with optional notes
- Track streaks (consecutive days)
- Track frequency goals (e.g., 3x per week)
- Mark as good or bad habit

## Development

### Local dev (host-run + SQLite file)

Create a local SQLite file (ignored by git) and run the dev server on your machine:

```bash
npm run dev
```

### Database Seeding

Populate the database with 12 example categories for the `tim` user. Follows the same standalone, idempotent pattern as migrations.

```bash
npm run db:seed                  # Seed categories (skips if tim already has categories)
npm run db:seed -- --clear       # Clear tim's categories before seeding
npm run db:clean                 # Clean up test data pollution (removes test users/categories)
```

**Requirements:** The `tim` user must exist (created automatically on dev server startup)

**Note:** If you see garbage test users (`tim-{uuid}`, `u-{timestamp}`) in your database, run `npm run db:clean` to remove them. This can happen when unit tests don't properly isolate their databases.

### Database Browser

Optional: start a DB browser UI (sqlite-web) via Docker (mounts the same `./.data/db.sqlite` file):

```bash
docker compose up -d
```

Then open `http://localhost:8080`.

### Docs

See [docs/](./docs/) for detailed documentation:

- [Architecture](./docs/ARCHITECTURE.md) - System design and use cases
- [Database Schema](./docs/DATABASE.md) - Complete data model
- [API Documentation](./docs/API.md) - Endpoints and validation
- [Deployment Guide](./docs/DEPLOYMENT.md) - CI/CD and infrastructure
- [Development Tickets](./docs/tickets/) - Implementation roadmap

## Roadmap

### ✅ Phase 1: MVP

- Tasks with priority, assignment, recurring
- Chores with recurring, assignment
- Habits with entries and streak tracking
- Category sharing
- Dashboard and PWA

### 🔜 Future Improvements

- Search and filtering
- Statistics and analytics
- Data export
- Reminders/notifications
- Offline sync

## License

Private project - not for public distribution
