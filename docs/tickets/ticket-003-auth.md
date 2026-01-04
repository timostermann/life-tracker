# Ticket 003: Authentication with Lucia

**ID:** ticket-003  
**Scope:** `auth` or `ticket-003`  
**Phase:** 1 (MVP)  
**Dependencies:** ticket-002

## Description

Implement session-based authentication using Lucia Auth v3 for 2 users.

## Tasks

- [x] Install `lucia` and `@lucia-auth/adapter-sqlite`
- [x] Create Lucia instance in `src/lib/server/auth.ts`
- [x] Session table already added in ticket-002 (`sessions`, migration `003_lucia_auth.sql`)
- [x] Create auth utilities (validate session, create session, etc.)
- [x] Set up hooks for session validation (`hooks.server.ts`)
- [x] Create Zod schemas for login
- [x] Implement `POST /api/auth/login` endpoint
- [x] Implement `POST /api/auth/logout` endpoint
- [x] Implement `GET /api/auth/me` endpoint
- [x] Create login page UI (`/login`)
- [x] Add auth middleware for protecting routes
- [x] Seed 2 user accounts on first run (`tim`, `jule`)
- [x] Add unit tests for auth logic (co-located)
- [x] Handle auth errors with toast messages

## Acceptance Criteria

- ✅ Users can log in with username/password
- ✅ Sessions persist across requests
- ✅ HTTP-only cookies used
- ✅ Unauthorized API requests return 401 with toast message
- ✅ Protected pages redirect to `/login`
- ✅ Logout clears session and redirects
- ✅ Passwords hashed (Node `crypto.scrypt`, stored in `users.password_hash`)
- ✅ Session expires after 7 days
- ✅ Login form validates with Zod
- ✅ Error toasts shown on login failure
- ✅ Success toast on successful login

## Technical Notes

**Lucia configuration:**

```typescript
import { Lucia } from 'lucia';
import { BetterSqlite3Adapter } from '@lucia-auth/adapter-sqlite';

export const lucia = new Lucia(adapter, {
	sessionExpiresIn: new TimeSpan(7, 'd'),
	sessionCookie: {
		attributes: {
			secure: import.meta.env.PROD // overrideable via AUTH_COOKIE_SECURE
		}
	}
});
```

**Zod schema:**

```typescript
export const loginSchema = z.object({
	username: z.string().min(1, 'Username is required'),
	password: z.string().min(1, 'Password is required')
});
```

**Seed users:**

Seed users on startup (idempotent): `src/lib/server/auth/seed.ts`

- Users: `tim`, `jule`
- Env vars:
  - `AUTH_SEED_TIM_PASSWORD`
  - `AUTH_SEED_JULE_PASSWORD`
  - `AUTH_SEED_FORCE=true` (optional, repairs existing `tim`/`jule` password_hash)
  - `AUTH_COOKIE_SECURE=false` (optional; helpful for http preview/e2e)

````

**Hook for session:**

```typescript
// hooks.server.ts
export const handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get(lucia.sessionCookieName);
	// validate and set event.locals.user + event.locals.session
	// protect routes (redirect to /login, but return 401 JSON for /api/*)
};
````

## Testing

- ✅ Unit test: Password hashing (scrypt)
- ✅ Unit test: Create/validate/invalidate session (Lucia)
- ✅ Unit test: Seed users (idempotent)
- ✅ E2E (UI): Protected route redirects → login → session persists → logout
- ✅ E2E (API-only): login → me → logout → me=401

## Accessibility

- ✅ Login form has proper labels
- ✅ Error messages announced to screen readers
- ✅ Focus management on form submission
- ✅ Keyboard navigation works
- ✅ ARIA live region for error messages

## Performance

- ✅ Session lookup optimized with index
- ✅ scrypt params: N=16384, r=8, p=1

## Implementation Notes (repo-specific)

- Migrations are bundled into the server build via `import.meta.glob(..., { query: '?raw', eager: true })` in `src/lib/server/db/migrate.ts` so production builds (`npm run preview`) don't depend on `.sql` files existing on disk.
