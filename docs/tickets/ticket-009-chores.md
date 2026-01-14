# Ticket 009: Chores Implementation

**ID:** ticket-009  
**Scope:** `items` or `ticket-009`  
**Phase:** 1 (MVP)  
**Dependencies:** ticket-008

## Description

Implement recurring chores with assignment and archiving. Chores are always recurring (weekly, monthly, etc.).

**Note:** Ticket-008 (Tasks) has implemented shared infrastructure that can be reused for chores:

- Item CRUD operations and queries
- Field values management
- Recurring logic utilities
- AssigneeSelector, RecurringConfigDialog components
- Permission enforcement patterns
- Complete item action with next occurrence creation

## Tasks

- [x] Create Zod schemas for chore operations
- [x] Create chore-specific API endpoints (enforce recurring)
- [x] Create chore list view
- [x] Create chore form component (recurring required)
- [x] Implement recurring frequency selector (daily/weekly/monthly + interval)
- [x] Implement assignee selector
- [x] Implement complete chore action
- [x] Show next occurrence date in UI
- [x] Add chore schedule view (calendar/timeline)
- [x] Add unit tests (co-located)
- [x] Add E2E tests for chore flows

## Acceptance Criteria

- ✅ Users can create chores (recurring config required)
- ✅ Frequency selector: daily, weekly, monthly
- ✅ Interval selector: 1, 2, 3, etc.
- ✅ Assignee selector works
- ✅ Completing chore archives it
- ✅ Next occurrence created immediately
- ✅ Next occurrence shown after recurring period
- ✅ Chore schedule view shows upcoming occurrences
- ✅ Can't create chore without recurring config
- ✅ All operations validated with Zod
- ✅ Success toasts on all actions
- ✅ Seeding with real-life examples

## Technical Notes

**Permission Enforcement (from ticket-007):**

All chore operations must check category access using `checkCategoryAccess()`:

```typescript
import { checkCategoryAccess } from '$lib/server/db/queries/categories';

const hasAccess = checkCategoryAccess(categoryId, user.id, 'edit', db);
if (!hasAccess) {
	return json({ error: 'Forbidden' }, { status: 403 });
}
```

**Access rules:**

- **GET** (view chores): Requires 'view' or 'edit' permission
- **POST/PUT/DELETE** (modify chores): Requires 'edit' permission
- **POST complete**: Requires 'edit' permission

**Zod schema (recurring required):**

```typescript
export const createChoreSchema = z.object({
	values: z.record(z.string(), z.string()),
	assigned_to_user_id: z.number().int().positive().optional(),
	recurring_config: recurringConfigSchema // REQUIRED
});
```

**Frequency examples:**

- Daily: `{ frequency: 'daily', interval: 1 }` = every day
- Weekly: `{ frequency: 'weekly', interval: 2 }` = every 2 weeks
- Monthly: `{ frequency: 'monthly', interval: 1 }` = every month

**Next date calculation:**

```typescript
function calculateNextDate(config: RecurringConfig, from: Date = new Date()): Date {
	const { frequency, interval } = config;

	switch (frequency) {
		case 'daily':
			return addDays(from, interval);
		case 'weekly':
			return addWeeks(from, interval);
		case 'monthly':
			return addMonths(from, interval);
	}
}
```

**Schedule view query:**

```sql
-- Get upcoming chores (next 30 days)
SELECT * FROM items
WHERE category_id IN (SELECT id FROM categories WHERE template_type = 'chore')
  AND next_show_date BETWEEN CURRENT_DATE AND DATE(CURRENT_DATE, '+30 days')
ORDER BY next_show_date;
```

## Testing

- ✅ Unit test: Chore requires recurring config
- ✅ Unit test: Next date calculated correctly
- ✅ Unit test: Daily/weekly/monthly intervals work
- ✅ Unit test: Complete creates next occurrence
- ✅ E2E test: Create chore with recurring
- ✅ E2E test: Complete chore, verify next
- ✅ E2E test: Schedule view shows correct dates

## Accessibility

- ✅ Recurring config form accessible
- ✅ Frequency explained in plain language
- ✅ Next occurrence date announced
- ✅ Schedule view keyboard navigable

## Performance

- ✅ Schedule queries optimized with next_show_date index
- ✅ Calendar view loads only visible month
- ✅ No N+1 queries for chore list
