# Ticket 003: Authentication with Lucia

**ID:** ticket-003  
**Scope:** `auth` or `ticket-003`  
**Phase:** 1 (MVP)  
**Dependencies:** ticket-002

## Description

Implement session-based authentication using Lucia Auth v3 for 2 users.

## Tasks

- [ ] Install `lucia` and `@lucia-auth/adapter-sqlite`
- [ ] Create Lucia instance in `src/lib/server/auth.ts`
- [ ] Add session table to database schema (if not in ticket-002)
- [ ] Create auth utilities (validate session, create session, etc.)
- [ ] Set up hooks for session validation (`hooks.server.ts`)
- [ ] Create Zod schemas for login
- [ ] Implement `POST /api/auth/login` endpoint
- [ ] Implement `POST /api/auth/logout` endpoint
- [ ] Implement `GET /api/auth/me` endpoint
- [ ] Create login page UI (`/login`)
- [ ] Add auth middleware for protecting routes
- [ ] Seed 2 user accounts on first run
- [ ] Add unit tests for auth logic (co-located)
- [ ] Handle auth errors with toast messages

## Acceptance Criteria

- ✅ Users can log in with username/password
- ✅ Sessions persist across requests
- ✅ HTTP-only cookies used
- ✅ Unauthorized API requests return 401 with toast message
- ✅ Protected pages redirect to `/login`
- ✅ Logout clears session and redirects
- ✅ Passwords hashed (Lucia handles this)
- ✅ Session expires after 7 days
- ✅ Login form validates with Zod
- ✅ Error toasts shown on login failure
- ✅ Success toast on successful login

## Technical Notes

**Lucia configuration:**

```typescript
import { Lucia } from "lucia";
import { BetterSqlite3Adapter } from "@lucia-auth/adapter-sqlite";

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: import.meta.env.PROD,
    },
  },
});
```

**Zod schema:**

```typescript
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});
```

**Seed users:**

```sql
INSERT INTO users (username, password_hash) VALUES
  ('tim', '<bcrypt_hash>'),
  ('girlfriend', '<bcrypt_hash>');
```

**Hook for session:**

```typescript
// hooks.server.ts
export const handle = async ({ event, resolve }) => {
  const sessionId = event.cookies.get(lucia.sessionCookieName);
  // validate and set event.locals.user
};
```

## Testing

- ✅ Unit test: Validate session
- ✅ Unit test: Create session
- ✅ Unit test: Invalidate session
- ✅ Unit test: Zod validation on login
- ✅ Integration test: Full login flow
- ✅ Integration test: Protected route redirects
- ✅ Integration test: Session expiration

## Accessibility

- ✅ Login form has proper labels
- ✅ Error messages announced to screen readers
- ✅ Focus management on form submission
- ✅ Keyboard navigation works
- ✅ ARIA live region for error messages

## Performance

- ✅ Session lookup optimized with index
- ✅ bcrypt rounds: 10 (balance of security/speed)
