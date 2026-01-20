# Ticket 019: Category Favorites

**ID:** ticket-019  
**Scope:** `categories` or `ticket-019`  
**Phase:** 2 (Post-MVP Enhancement)  
**Dependencies:** ticket-012 (Dashboard)  
**Status:** 📋 Planned

## Description

Add ability to mark categories as favorites and display only favorite categories on the dashboard instead of the 6 most recent. This provides users better control over their dashboard view.

## Background

Currently (ticket-012), the dashboard shows the 6 most recently updated categories. While this works for MVP, users may want to pin specific categories to their dashboard for quick access regardless of recent activity.

## Tasks

- [ ] Add `is_favorite` boolean column to categories table (default: false)
- [ ] Create migration script (`005_add_category_favorites.sql`)
- [ ] Update Zod schema for category to include `is_favorite`
- [ ] Add API endpoint to toggle favorite: `POST /api/categories/:id/favorite`
- [ ] Update `getRecentCategoriesWithCounts` to prioritize favorites
- [ ] Add favorite toggle UI on category detail page (star icon)
- [ ] Add favorite toggle on category cards (star icon)
- [ ] Update dashboard to show favorites first, then recent (max 6 total)
- [ ] Add empty state: "No favorite categories - star categories to pin them"
- [ ] Add unit tests for favorite toggle and queries
- [ ] Add E2E test for marking/unmarking favorites
- [ ] Update documentation

## Database Changes

**Migration `005_add_category_favorites.sql`:**

```sql
-- Add is_favorite column to categories
ALTER TABLE categories ADD COLUMN is_favorite BOOLEAN NOT NULL DEFAULT 0;

-- Create index for fast favorite queries
CREATE INDEX idx_categories_is_favorite ON categories(user_id, is_favorite);
```

**Updated Schema:**

```typescript
export const categorySchema = z.object({
	id: z.number(),
	user_id: z.number(),
	name: z.string(),
	template_type: z.enum(['task', 'chore', 'habit']),
	icon: z.string().nullable(),
	color: z.string().nullable(),
	is_private: z.boolean(),
	is_favorite: z.boolean(), // NEW
	created_at: z.string(),
	updated_at: z.string()
});
```

## API Endpoint

### POST /api/categories/:id/favorite

Toggle favorite status for a category (owner only).

**Request:** No body needed (toggle)

**Response (200):**

```json
{
  "category": {
    "id": 1,
    "is_favorite": true,
    ...
  },
  "toast": "success",
  "message": "Category added to favorites"
}
```

**Response (403):**

```json
{
	"error": "Only category owners can favorite categories",
	"toast": "error"
}
```

**Note:** Only the owner can favorite a category (not shared users). Shared categories appear based on owner's favorite status.

## Dashboard Behavior

**Updated Query Logic:**

```typescript
function getRecentCategoriesWithCounts(userId: number, limit = 6) {
	// Get owned categories
	const owned = db
		.prepare(
			`
      SELECT c.*, COUNT(i.id) as item_count
      FROM categories c
      LEFT JOIN items i ON i.category_id = c.id AND i.is_archived = 0
      WHERE c.user_id = ?
      GROUP BY c.id
      ORDER BY c.is_favorite DESC, c.updated_at DESC
      LIMIT ?
    `
		)
		.all(userId, limit);

	// Get shared categories where owner favorited them
	const shared = db
		.prepare(
			`
      SELECT c.*, COUNT(i.id) as item_count, sa.permission
      FROM shared_access sa
      JOIN categories c ON c.id = sa.category_id
      LEFT JOIN items i ON i.category_id = c.id AND i.is_archived = 0
      WHERE sa.shared_with_user_id = ?
      GROUP BY c.id
      ORDER BY c.is_favorite DESC, c.updated_at DESC
    `
		)
		.all(userId);

	// Merge and limit to 6 total
	return [...owned, ...shared].slice(0, limit);
}
```

**Display Priority:**

1. Favorite categories (owned + shared) - sorted by updated_at DESC
2. Recent non-favorite categories - fill remaining slots up to 6 total
3. If > 6 favorites, show 6 most recently updated favorites

## UI Components

**Favorite Toggle Button:**

- Star icon (filled when favorite, outline when not)
- Appears on category cards (dashboard + /categories page)
- Appears on category detail page header
- Tooltip: "Add to favorites" / "Remove from favorites"
- Only visible to category owner
- Click triggers API call with optimistic UI update

**Component Location:**

```typescript
// src/lib/components/FavoriteToggle/FavoriteToggle.svelte
<script lang="ts">
  import { Star } from 'lucide-svelte';

  type Props = {
    categoryId: number;
    isFavorite: boolean;
    onToggle: (newState: boolean) => Promise<void>;
  };

  let { categoryId, isFavorite, onToggle }: Props = $props();
</script>

<button
  onclick={() => onToggle(!isFavorite)}
  aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
>
  <Star class={isFavorite ? 'fill-yellow-400' : ''} />
</button>
```

## Acceptance Criteria

- ✅ Users can toggle favorite on categories they own
- ✅ Dashboard shows favorites first, then recent (max 6)
- ✅ Favorite toggle appears on category cards and detail page
- ✅ Favorite status persists across sessions
- ✅ Shared users see favorite status set by owner
- ✅ Star icon fills when favorited, outline when not
- ✅ Optimistic UI update on toggle
- ✅ Success toast on favorite/unfavorite
- ✅ Empty state if no favorites
- ✅ Migration runs successfully
- ✅ All tests pass (unit + E2E)
- ✅ Linting passes

## Testing

- ✅ Unit test: Toggle favorite updates database
- ✅ Unit test: Dashboard query prioritizes favorites
- ✅ Unit test: Only owner can favorite
- ✅ E2E test: Mark category as favorite
- ✅ E2E test: Favorite appears on dashboard
- ✅ E2E test: Unfavorite removes from priority
- ✅ E2E test: Shared user sees owner's favorite status

## Accessibility

- ✅ Star button has proper aria-label
- ✅ Keyboard accessible (Space/Enter to toggle)
- ✅ Focus visible on star button
- ✅ Status announced to screen readers

## Performance

- ✅ Index on (user_id, is_favorite) for fast queries
- ✅ Optimistic UI update (no loading state)
- ✅ Single API call to toggle

## Notes

**Future Enhancement:**

Consider adding "Manage Favorites" dialog for users with > 6 favorites to reorder or select which ones appear on dashboard.

**Design Consideration:**

Star icon chosen for universal "favorite" recognition. Yellow fill aligns with common UX patterns (GitHub, Twitter, etc.).
