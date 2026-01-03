# Ticket 007: Category Sharing

**ID:** ticket-007  
**Scope:** `categories` or `ticket-007`  
**Phase:** 1 (MVP)  
**Dependencies:** ticket-006

## Description

Implement explicit category sharing between users with view/edit permissions using the shared_access table.

## Tasks

- [ ] Create Zod schemas for sharing operations
- [ ] Create API endpoints for sharing
- [ ] Add share button to category detail page
- [ ] Create share dialog component
- [ ] Implement user selector (dropdown of other users)
- [ ] Implement permission selector (view/edit)
- [ ] Add "Shared with" section showing current shares
- [ ] Add revoke access functionality
- [ ] Show shared categories in dashboard
- [ ] Add visual indicators for shared categories
- [ ] Validate permissions on all item operations
- [ ] Add unit tests (co-located)
- [ ] Add E2E test for sharing workflow

## API Endpoints

- `POST /api/categories/:id/share` - Share with user
- `DELETE /api/categories/:id/share/:userId` - Revoke access
- `GET /api/categories` - Include shared categories

## Acceptance Criteria

- ✅ Category owner can share with other users
- ✅ Can select view or edit permission
- ✅ View permission: read-only access to category/items
- ✅ Edit permission: full CRUD access to items
- ✅ Shared categories visible in recipient's dashboard
- ✅ Visual indicator shows shared categories (icon/badge)
- ✅ Owner can revoke access anytime
- ✅ Permissions enforced in all API calls
- ✅ Success toasts on share/revoke
- ✅ Can't share already-shared category with same user

## Technical Notes

**Zod schema:**

```typescript
export const shareCategorySchema = z.object({
	user_id: z.number().int().positive(),
	permission: z.enum(['view', 'edit'])
});
```

**Permission check middleware:**

```typescript
async function checkCategoryAccess(
	userId: number,
	categoryId: number,
	requiredPermission: 'view' | 'edit'
) {
	// Check if owner or has required permission via shared_access
}
```

**UI indicators:**

```svelte
{#if category.is_shared}
	<Badge>Shared</Badge>
{/if}
{#if category.shared_with_me}
	<Badge>Shared with me ({permission})</Badge>
{/if}
```

## Testing

- ✅ Unit test: Share creates shared_access record
- ✅ Unit test: View permission blocks editing
- ✅ Unit test: Edit permission allows CRUD
- ✅ Unit test: Revoke removes access
- ✅ Unit test: Can't share with self
- ✅ E2E test: Complete sharing workflow
- ✅ E2E test: Permission enforcement

## Accessibility

- ✅ Share dialog keyboard accessible
- ✅ User selector properly labeled
- ✅ Permission explained in plain language
- ✅ Success/error announcements

## Performance

- ✅ Permission checks cached per request
- ✅ Shared categories query optimized with JOIN
- ✅ No N+1 queries
