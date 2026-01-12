# Ticket 017: Copy Share Link

**ID:** ticket-017  
**Scope:** `sharing` or `ticket-017`  
**Phase:** 2 (Post-MVP Enhancement)  
**Dependencies:** ticket-007

## Description

Add ability to share categories via a direct link that can be copied and shared externally. Recipients clicking the link will be granted access to the category with a specified permission level.

## Motivation

- **Faster sharing**: Copy/paste link instead of selecting from user dropdown
- **External sharing**: Share with users who don't have accounts yet
- **Mobile-friendly**: Leverage native share dialog on mobile devices
- **Social sharing**: Easy to share via messaging apps, email, etc.

## Current State

From ticket-007, we have:

- Manual user selection from dropdown ✅
- Permission selection (view/edit) ✅
- Share/revoke functionality ✅

## What Needs to be Added

1. **Share link generation**
   - Generate unique, secure share tokens
   - Associate tokens with category + permission
   - Store tokens in database with expiration

2. **Copy link UI**
   - Add "Copy Link" button to share dialog
   - Show generated link in a text field
   - Toast confirmation on copy
   - Support native share dialog on mobile

3. **Link redemption flow**
   - New route: `/accept-share/:token`
   - Validate token and check expiration
   - Show preview of category being shared
   - Require login/signup if not authenticated
   - Add user to shared_access table
   - Redirect to category page

4. **Token management**
   - Owner can see active share links
   - Owner can revoke/regenerate links
   - Automatic expiration (configurable, default 7 days)

## Tasks

- [ ] Create database schema for share tokens
  - Table: `share_tokens`
  - Fields: `id`, `category_id`, `token`, `permission`, `created_by_user_id`, `expires_at`, `created_at`
  - Unique index on `token`
- [ ] Create API endpoints
  - `POST /api/categories/:id/share-link` - Generate share link
  - `GET /api/share/:token` - Get share details (public)
  - `POST /api/share/:token/accept` - Accept share (requires auth)
  - `DELETE /api/categories/:id/share-link/:token` - Revoke link
- [ ] Add UI to ShareCategoryDialog
  - "Copy Link" button
  - Show generated link
  - List active links with revoke option
  - Mobile: native share sheet integration
- [ ] Create share acceptance page
  - `/accept-share/:token` route
  - Preview UI showing category name, owner, permission
  - Login/signup prompt if needed
  - Accept/decline buttons
- [ ] Add token cleanup job
  - Cron job or startup script to delete expired tokens
- [ ] Add tests
  - Token generation and validation
  - Link acceptance flow
  - Expiration handling
  - Security tests (invalid tokens, expired tokens)
- [ ] Add E2E test for complete link sharing workflow

## API Endpoints

### POST /api/categories/:id/share-link

Generate a shareable link for a category.

**Request:**

```typescript
{
  permission: z.enum(['view', 'edit']),
  expires_in_days: z.number().int().positive().max(30).optional() // default 7
}
```

**Response:**

```json
{
	"token": "abc123xyz789",
	"link": "https://tracker.timostermann.io/accept-share/abc123xyz789",
	"expires_at": "2026-01-19T10:00:00Z",
	"toast": "success",
	"message": "Share link created"
}
```

### GET /api/share/:token (Public)

Get details about a share invitation.

**Response:**

```json
{
	"category": {
		"id": 1,
		"name": "Household Chores",
		"icon": "🧹",
		"owner_username": "tim"
	},
	"permission": "edit",
	"expires_at": "2026-01-19T10:00:00Z"
}
```

### POST /api/share/:token/accept (Requires Auth)

Accept a share invitation.

**Response:**

```json
{
	"category_id": 1,
	"toast": "success",
	"message": "You now have access to Household Chores"
}
```

### DELETE /api/categories/:id/share-link/:token

Revoke a share link (owner only).

**Response:**

```json
{
	"toast": "success",
	"message": "Share link revoked"
}
```

## Database Schema

```sql
CREATE TABLE share_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  permission TEXT NOT NULL CHECK(permission IN ('view', 'edit')),
  created_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_share_tokens_token ON share_tokens(token);
CREATE INDEX idx_share_tokens_category ON share_tokens(category_id);
CREATE INDEX idx_share_tokens_expires ON share_tokens(expires_at);
```

## UI/UX Design

### ShareCategoryDialog Updates

Add new section after user/permission selectors:

```
┌─────────────────────────────────────┐
│ Share "Household Chores"            │
├─────────────────────────────────────┤
│ User: [Select user ▼]              │
│ Permission: [View (read-only) ▼]    │
│ [Share]                              │
│                                      │
│ Or share via link:                  │
│ ┌─────────────────────────────────┐ │
│ │ https://tracker.../abc123       │ │
│ └─────────────────────────────────┘ │
│ [Copy Link] [📱 Share]              │
│                                      │
│ Shared with:                         │
│ • jule (edit)     [Revoke]          │
│                                      │
│ Active links:                        │
│ • Edit link (expires in 5 days)     │
│   [Revoke]                           │
└─────────────────────────────────────┘
```

### Accept Share Page (`/accept-share/:token`)

```
┌─────────────────────────────────────┐
│         Share Invitation             │
├─────────────────────────────────────┤
│                                      │
│            🧹                        │
│                                      │
│   Household Chores                   │
│   by tim                             │
│                                      │
│   Permission: Edit (can manage)      │
│   Expires: Jan 19, 2026              │
│                                      │
│   [Accept] [Decline]                 │
│                                      │
└─────────────────────────────────────┘
```

If not logged in, show login/signup prompt first.

## Security Considerations

1. **Token generation**: Use cryptographically secure random tokens (32+ characters)
2. **Rate limiting**: Limit link generation to prevent abuse (e.g., 10 per hour per user)
3. **Expiration**: Always set expiration, max 30 days
4. **Validation**: Check category ownership, token validity, expiration
5. **HTTPS only**: Share links should only work over HTTPS in production
6. **One-time use**: Consider making tokens single-use for higher security

## Acceptance Criteria

- [ ] Owner can generate shareable links with view/edit permission
- [ ] Generated link can be copied to clipboard
- [ ] Link works when pasted in browser
- [ ] Non-authenticated users are prompted to login/signup
- [ ] Authenticated users can accept/decline invitation
- [ ] Accepting adds user to shared_access table
- [ ] Owner can see all active links
- [ ] Owner can revoke links
- [ ] Expired links show appropriate error message
- [ ] Invalid tokens show 404 error
- [ ] Mobile devices can use native share sheet
- [ ] Success/error toasts for all operations
- [ ] E2E test covers complete flow

## Testing Strategy

1. **Unit tests**
   - Token generation (uniqueness, length, randomness)
   - Token validation
   - Expiration handling
   - Database operations
2. **Integration tests**
   - API endpoints (success and error cases)
   - Permission checks
   - Token redemption flow
3. **E2E tests**
   - Generate link → copy → open in new browser → accept
   - Expiration flow
   - Revoke link and verify it no longer works
4. **Security tests**
   - Brute force token guessing (should be infeasible)
   - Expired token rejection
   - Invalid token handling
   - Permission boundary testing

## Future Enhancements

- [ ] QR code generation for easy mobile sharing
- [ ] Link analytics (views, accepts, declines)
- [ ] Customizable expiration times
- [ ] Link templates with default permissions
- [ ] Bulk link generation
- [ ] Password-protected links
- [ ] Usage limits (max number of redemptions)

## Notes

- Consider using UUID v4 or similar for token generation
- Store token hash in database for security (like passwords)
- Clean up expired tokens regularly (daily cron job)
- Consider integration with Web Share API for mobile
- May need to update CORS settings for cross-origin sharing
