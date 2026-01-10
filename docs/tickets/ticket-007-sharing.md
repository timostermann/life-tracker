# Ticket 007: Category Sharing

**ID:** ticket-007  
**Scope:** `categories` or `ticket-007`  
**Phase:** 1 (MVP)  
**Dependencies:** ticket-006

## Description

Implement explicit category sharing between users with view/edit permissions using the shared_access table.

## Implementation Notes from Ticket-006

The categories page already includes:

- **Shared categories tab**: UI prepared for displaying shared categories
- **listCategoriesForUser()**: Returns both `owned` and `shared` arrays
- **SharedCategory type**: Already exists with `permission` field
- **Layout**: Two-tab interface ready ("My Categories" / "Shared with me")

**What's already done:**

- Database schema (shared_access table) ✅
- Query function to list shared categories ✅
- UI placeholder for shared categories ✅

**What needs to be added:**

- Share/revoke API endpoints
- Share dialog UI component
- Permission enforcement in item operations (tickets 008-010)

## Tasks

- [ ] Create Zod schemas for sharing operations
- [ ] Create API endpoints for sharing
  - `POST /api/categories/:id/share` - Share with user
  - `DELETE /api/categories/:id/share/:userId` - Revoke access
- [ ] Add share button to category cards (owner only)
- [ ] Create share dialog component
- [ ] Implement user selector (dropdown of other users)
- [ ] Implement permission selector (view/edit radio buttons)
- [ ] Add "Shared with" section showing current shares
- [ ] Add revoke access functionality
- [ ] Update shared categories display to show permission badge
- [ ] Add visual indicators for shared categories (icon)
- [ ] Validate permissions on all item operations (defer to 008-010)
- [ ] Add unit tests (co-located)
- [ ] Add E2E test for sharing workflow

## API Endpoints

- `POST /api/categories/:id/share` - Share category with user
- `DELETE /api/categories/:id/share/:userId` - Revoke user's access
- `GET /api/categories/:id/shares` - List all shares for a category
- `GET /api/categories` - Already returns shared categories ✅

## Acceptance Criteria

- ✅ Category owner can share with other users
- ✅ Can select view or edit permission
- ✅ View permission: read-only access to category/items
- ✅ Edit permission: full CRUD access to items
- ✅ Shared categories visible in recipient's dashboard (tab exists)
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

**Permission check helper:**

```typescript
// Location: src/lib/server/db/queries/categories.ts
export async function checkCategoryAccess(
	userId: number,
	categoryId: number,
	requiredPermission: 'view' | 'edit'
): Promise<boolean> {
	const category = getCategoryById(categoryId);

	// Owner has full access
	if (category?.user_id === userId) return true;

	// Check shared_access
	const shared = db
		.prepare(
			'SELECT permission FROM shared_access WHERE category_id = ? AND shared_with_user_id = ?'
		)
		.get(categoryId, userId);

	if (!shared) return false;
	if (requiredPermission === 'view') return true; // view or edit both ok
	return shared.permission === 'edit'; // edit requires edit permission
}
```

**UI indicators (update CategoryList component):**

```svelte
{#if category.user_id !== $page.data.user.id}
	<Badge variant="secondary">
		<Users class="mr-1 h-3 w-3" />
		Shared ({category.permission})
	</Badge>
{/if}
```

**Share dialog location:**

Add to `src/lib/components/ShareCategoryDialog/` similar to `DeleteCategoryDialog`

## Testing

- ✅ Unit test: Share creates shared_access record
- ✅ Unit test: View permission blocks editing
- ✅ Unit test: Edit permission allows CRUD
- ✅ Unit test: Revoke removes access
- ✅ Unit test: Can't share with self
- ✅ Unit test: Owner always has access
- ✅ E2E test: Complete sharing workflow
- ✅ E2E test: Permission enforcement

## Accessibility

- ✅ Share dialog keyboard accessible
- ✅ User selector properly labeled
- ✅ Permission explained in plain language
- ✅ Success/error announcements
- ✅ Revoke button has confirmation

## Performance

- ✅ Permission checks cached per request
- ✅ Shared categories query optimized with JOIN (already done) ✅
- ✅ No N+1 queries

## Integration Points

**Items API (tickets 008-010):**  
All item CRUD operations must call `checkCategoryAccess()`:

```typescript
// Example in POST /api/categories/:id/items
const hasAccess = await checkCategoryAccess(user.id, categoryId, 'edit');
if (!hasAccess) {
	return json({ error: 'Forbidden' }, { status: 403 });
}
```
