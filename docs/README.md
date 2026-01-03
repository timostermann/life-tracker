# Life Tracker - Documentation Index

Complete documentation for the Life Tracker project.

## 📚 Main Documentation

### [PROJECT_PLAN.md](./PROJECT_PLAN.md)

**Start here!** Overview of the entire project, decisions made, timeline, and next steps.

### [ARCHITECTURE.md](./ARCHITECTURE.md)

System architecture, component diagrams, data flow, and technical decisions.

### [DATABASE.md](./DATABASE.md)

Complete database schema with entity relationships, queries, and migration strategy.

### [API.md](./API.md)

RESTful API documentation with endpoints, request/response formats, and examples.

### [DEPLOYMENT.md](./DEPLOYMENT.md)

Deployment guide, CI/CD pipeline, infrastructure setup, and monitoring.

## 🎫 Development Tickets

### [tickets/README.md](./tickets/README.md)

**Index of all 24 tickets** organized by phase with dependency graph.

### Ticket Files

All tickets are in `tickets/ticket-XXX-name.md` format (13 MVP tickets):

**Phase 1 (MVP):** tickets 001-013

- Setup, DB, Auth, Toast, UI Foundation
- Categories, Sharing, Tasks, Chores, Habits
- Templates, Dashboard, PWA + Deployment + E2E

## 🚀 Quick Start

### For Project Planning

1. Read [PROJECT_PLAN.md](./PROJECT_PLAN.md)
2. Review [tickets/README.md](./tickets/README.md)
3. Check individual tickets for implementation details

### For Development

1. Start with [ticket-001-setup.md](./tickets/ticket-001-setup.md)
2. Follow ticket order through Phase 1
3. Reference [ARCHITECTURE.md](./ARCHITECTURE.md) and [DATABASE.md](./DATABASE.md) as needed

### For Deployment

1. Complete Phase 1 tickets
2. Follow [DEPLOYMENT.md](./DEPLOYMENT.md)
3. Use [ticket-011-deployment.md](./tickets/ticket-011-deployment.md) for CI/CD setup

### For API Integration

1. Reference [API.md](./API.md)
2. Check [DATABASE.md](./DATABASE.md) for data structure
3. See tickets 005, 006, 007 for API implementation

## 📋 Documentation Summary

### Architecture Highlights

- **MVP:** Traditional server-first with SvelteKit + SQLite
- **Future:** Local-first with offline sync (database ready)
- **Database:** SQLite on VPS filesystem
- **Deployment:** Docker → GitHub Actions → VPS → Caddy
- **Testing:** Vitest (co-located) + Histoire + Playwright

### Key Features

**MVP (13 tickets):**

- Tasks with priority (4 levels), assignment, deadline, recurring, archive
- Chores with recurring and assignment
- Habits with daily entries, streaks, frequency tracking
- Category templates (Tasks, Chores, Habits)
- Category sharing (explicit between users)
- Dashboard with overview
- PWA (installable)
- Full test coverage

**Future Improvements:**

- Search and filtering
- Statistics and analytics
- Reminders with notifications
- Offline sync with optimistic UI
- Data export

### Tech Stack

- **Framework:** SvelteKit (Node 24)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 + shadcn-svelte
- **Database:** SQLite (better-sqlite3)
- **Auth:** Lucia Auth v3
- **Validation:** Zod
- **Notifications:** svelte-sonner
- **Testing:** Vitest, Histoire, Playwright
- **Tooling:** Husky, lint-staged, commitlint

## 🎯 Implementation Phases

| Phase            | Tickets | Goal                 | Timeline  |
| ---------------- | ------- | -------------------- | --------- |
| **Phase 1: MVP** | 001-013 | Working deployed app | 3-4 weeks |

**MVP to Production:** 3-4 weeks! 🚀

## 🔗 External References

### Existing Projects

- **currency-calculator/**: Tooling patterns, testing setup
- **portfolio/**: SvelteKit deployment patterns
- **server-setup/**: Infrastructure and Caddy config

### Domain

- Production URL: `tracker.timostermann.io`
- DNS: A record to VPS IP
- HTTPS: Automatic via Caddy + Let's Encrypt

## ✅ Planning Complete

All documentation is ready for implementation:

- ✅ Architecture designed (MVP + future state)
- ✅ Database schema defined (tasks/chores/habits model)
- ✅ API documented (all endpoints with Zod)
- ✅ Deployment planned (CI/CD pipeline)
- ✅ 13 MVP tickets created
- ✅ Timeline estimated (3-4 weeks)
- ✅ Future improvements documented

## 🎉 Ready to Build!

Start with:

1. Initialize repository (`git init`)
2. Begin [ticket-001-setup](./tickets/ticket-001-setup.md)
3. Follow ticket order (dependencies in README)
4. Deploy and iterate!
