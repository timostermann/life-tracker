# Ticket 012: Dashboard ✅

**ID:** ticket-012  
**Scope:** `ui` or `ticket-012`  
**Phase:** 1 (MVP)  
**Status:** ✅ **COMPLETED** (2026-01-17)  
**Dependencies:** ticket-008, ticket-009, ticket-010, ticket-011 ✅

## Description

Create home dashboard showing categories overview, items assigned to user, items due soon, and habits to log today.

**Implementation Note:** Dashboard displays the **6 most recent categories** (ordered by `updated_at DESC`) instead of all categories. A "View All →" link navigates to `/categories`. The "favorites" feature is tracked in [ticket-019](./ticket-019-category-favorites.md) for future implementation.

## Tasks

- [x] Create dashboard page (`/` route)
- [x] Create dashboard API endpoint (`GET /api/dashboard`)
- [x] Display category cards (6 most recent, owned + shared)
- [x] Display "Assigned to Me" section (by priority)
- [x] Display "Due Soon" section (next 7 days)
- [x] Display "Habits Today" section (not yet logged)
- [x] Add quick actions (create category button)
- [x] Add empty states when no data
- [x] Add "View All" link to categories page
- [x] Implement responsive grid layout
- [x] Add unit tests (co-located)
- [x] Add E2E test for dashboard

## Dashboard Sections

**1. Recent Categories** (top)

- Grid of 6 most recent category cards (ordered by `updated_at`)
- Shows icon, name, item count
- Click to open category
- "View All →" link to `/categories`

**2. Assigned to Me** (priority-grouped)

- Urgent tasks (red)
- High priority tasks (orange)
- Medium priority tasks (blue)
- Low priority tasks (gray)

**3. Due Soon** (7 days)

- Tasks with deadline ≤ 7 days
- Sorted by deadline
- Shows days until due

**4. Habits Today**

- Habits not yet logged today
- "Log Now" quick action
- Shows current streak

## API Endpoint

`GET /api/dashboard`

**Authentication:** Required (401 if not authenticated)

**Response:**

```typescript
{
  categories: CategoryWithCount[]; // 6 most recent
  assigned_to_me: {
    urgent: ItemWithValues[];
    high: ItemWithValues[];
    medium: ItemWithValues[];
    low: ItemWithValues[];
  };
  due_soon: ItemWithValues[]; // deadline ≤ 7 days
  habits_today: ItemWithValues[]; // not logged today
}
```

**Implementation Details:**

- Categories include `item_count` for each
- Items are enriched with field values (`values` object keyed by field ID)
- All queries run in parallel using `Promise.all()`
- Uses in-memory database for testing (passed via `locals.db`)

## Acceptance Criteria

- ✅ Dashboard shows all user's categories
- ✅ Category cards show correct counts
- ✅ "Assigned to Me" grouped by priority
- ✅ "Due Soon" shows items with deadline ≤ 7 days
- ✅ "Habits Today" shows unlogged habits
- ✅ Quick actions work (create category, log habit)
- ✅ Empty states show helpful messages
- ✅ Loading skeleton during data fetch
- ✅ Responsive layout (mobile/tablet/desktop)
- ✅ All counts accurate
- ✅ Clicking items opens detail view

## Technical Notes

**Dashboard query optimization:**

```typescript
// Parallel queries for efficiency
const [categories, assignedItems, dueSoonItems, habitsToday] = await Promise.all([
	Promise.resolve(getRecentCategoriesWithCounts(userId, 6, db)),
	Promise.resolve(getItemsAssignedToUser(userId, db)),
	Promise.resolve(getItemsDueSoon(userId, 7, db)),
	Promise.resolve(getHabitsNotLoggedToday(userId, db))
]);

// Enrich items with field values
const enrichedAssignedItems = assignedItems.map((item) => enrichItemWithValues(item, db));
const enrichedDueSoonItems = dueSoonItems.map((item) => enrichItemWithValues(item, db));
const enrichedHabitsToday = habitsToday.map((item) => enrichItemWithValues(item, db));

// Group assigned items by priority
const assignedByPriority = groupByPriority(enrichedAssignedItems);
```

**New Database Queries:**

- `getRecentCategoriesWithCounts(userId, limit, db)` - Returns categories with item counts, ordered by `updated_at DESC`
- `getItemsAssignedToUser(userId, db)` - Returns items assigned to user (owned or shared categories)
- `getItemsDueSoon(userId, daysAhead, db)` - Returns items with deadline ≤ `daysAhead` days
- `getHabitsNotLoggedToday(userId, db)` - Returns habits without entry for today

**Empty states:**

- No categories: "Create your first category from a template"
- No assigned items: "No tasks assigned to you"
- Nothing due: "You're all caught up!"
- No habits: "Start tracking a habit"

## Testing

- ✅ Unit test: Dashboard data structure correct
- ✅ Unit test: Priority grouping works
- ✅ Unit test: Due soon filters correctly
- ✅ Unit test: Empty states render
- ✅ E2E test: Dashboard loads with data
- ✅ E2E test: Quick actions work
- ✅ E2E test: Click category opens detail

## Accessibility

- ✅ Dashboard sections have headings
- ✅ Category cards have descriptive labels
- ✅ Priority badges accessible
- ✅ Keyboard navigation works
- ✅ Focus order logical
- ✅ Empty states announced

## Performance

- ✅ Dashboard queries optimized (parallel with `Promise.all()`)
- ✅ Counts calculated efficiently (single JOIN queries)
- ✅ Limited to 6 most recent categories for faster rendering
- ✅ Field values fetched and enriched in-memory
- ✅ No unnecessary re-fetches

## Implementation Files

**Components:**

- `src/routes/+page.svelte` - Main dashboard UI
- `src/routes/+page.server.ts` - Server-side data loading
- `src/lib/components/DashboardSection/DashboardSection.svelte` - Reusable section wrapper
- `src/lib/components/CategoryCard/CategoryCard.svelte` - Category display (reused)
- `src/lib/components/ItemCard/ItemCard.svelte` - Item display (reused)

**API:**

- `src/routes/api/dashboard/+server.ts` - Dashboard endpoint

**Database Queries:**

- `src/lib/server/db/queries/categories.ts` - `getRecentCategoriesWithCounts()`
- `src/lib/server/db/queries/items.ts` - `getItemsAssignedToUser()`, `getItemsDueSoon()`, `getHabitsNotLoggedToday()`

**Tests:**

- `src/routes/page.svelte.spec.ts` - Component unit test
- `src/routes/api/dashboard/server.spec.ts` - API unit tests
- `src/lib/server/db/queries/categories.spec.ts` - Query tests (added)
- `src/lib/server/db/queries/items.spec.ts` - Query tests (added)
- `e2e/dashboard.spec.ts` - E2E tests

## Related Tickets

- [ticket-019: Category Favorites](./ticket-019-category-favorites.md) - Future enhancement to show favorite categories instead of most recent
