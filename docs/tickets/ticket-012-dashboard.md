# Ticket 012: Dashboard

**ID:** ticket-012  
**Scope:** `ui` or `ticket-012`  
**Phase:** 1 (MVP)  
**Dependencies:** ticket-008, ticket-009, ticket-010, ticket-011

## Description

Create home dashboard showing categories overview, items assigned to user, items due soon, and habits to log today.

## Tasks

- [ ] Create dashboard page (`/` route)
- [ ] Create dashboard API endpoint
- [ ] Display category cards (owned + shared)
- [ ] Display "Assigned to Me" section (by priority)
- [ ] Display "Due Soon" section (next 7 days)
- [ ] Display "Habits Today" section (not yet logged)
- [ ] Add quick actions (create category, log habit)
- [ ] Add empty states when no data
- [ ] Add loading skeleton
- [ ] Implement responsive grid layout
- [ ] Add unit tests (co-located)
- [ ] Add E2E test for dashboard

## Dashboard Sections

**1. Categories** (top)

- Grid of category cards
- Shows icon, name, item count
- Click to open category

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

**Response:**

```typescript
{
  categories: Category[];
  assigned_to_me: {
    urgent: Item[];
    high: Item[];
    medium: Item[];
    low: Item[];
  };
  due_soon: Item[];
  habits_today: Item[];
}
```

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
// Single query for efficiency
const [categories, assignedItems, dueItems, habits] = await Promise.all([
	db.getCategoriesWithCounts(userId),
	db.getAssignedItems(userId),
	db.getDueSoonItems(userId, 7),
	db.getHabitsNotLoggedToday(userId)
]);
```

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

- ✅ Dashboard queries optimized (parallel)
- ✅ Counts calculated efficiently
- ✅ Loading skeleton prevents layout shift
- ✅ Images/icons lazy-loaded
- ✅ No unnecessary re-fetches
