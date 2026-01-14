# Ticket 008: Tasks Implementation

**ID:** ticket-008  
**Scope:** `items` or `ticket-008`  
**Phase:** 1 (MVP)  
**Dependencies:** ticket-006, ticket-007  
**Status:** ✅ **COMPLETED**

## Description

Implement full task management with priority, assignment, deadlines, time estimates, recurring tasks, and archiving.

## Tasks

- [x] Create Zod schemas for task operations
- [x] Create API endpoints for tasks (CRUD + complete)
- [x] Create task list view with priority sorting
- [x] Create task form component (all fields)
- [x] Implement priority selector (Urgent/High/Medium/Low)
- [x] Implement assignee selector
- [x] Implement deadline picker (Calendar component)
- [x] Implement time estimate input (minutes)
- [x] Implement recurring configuration dialog
- [x] Implement complete task action
- [x] Implement recurring logic (archive + create next)
- [x] Calculate and set next_show_date for recurring
- [x] Add archive view
- [x] Add filters (priority, assignee, due date)
- [x] Add unit tests (co-located)
- [x] Add E2E tests for task flows

## API Endpoints

- `GET /api/categories/:id/items` - List tasks with filters
- `GET /api/items/:id` - Get single task
- `POST /api/categories/:id/items` - Create task
- `PUT /api/items/:id` - Update task
- `POST /api/items/:id/complete` - Complete (handle recurring)
- `DELETE /api/items/:id` - Delete task

## Acceptance Criteria

- ✅ Users can create tasks with all fields
- ✅ Priority selector shows 4 levels with colors
- ✅ Assignee selector shows all users in shared category
- ✅ Deadline picker uses Calendar component
- ✅ Time estimate in minutes (e.g., 30, 60, 120)
- ✅ Recurring config dialog (frequency + interval)
- ✅ Completing task archives it (is_archived=true)
- ✅ Recurring tasks create next occurrence immediately
- ✅ Next occurrence hidden until next_show_date
- ✅ Task list sorted by: priority → deadline → created
- ✅ Archive view shows completed tasks
- ✅ Filters work correctly
- ✅ All operations validated with Zod
- ✅ Success toasts on all actions
- ✅ Seeding with real-life examples

## Technical Notes

**Permission Enforcement (from ticket-007):**

All task operations must check category access using `checkCategoryAccess()`:

```typescript
// Example in POST /api/categories/:id/items
import { checkCategoryAccess } from '$lib/server/db/queries/categories';

const hasAccess = checkCategoryAccess(categoryId, user.id, 'edit', db);
if (!hasAccess) {
	return json({ error: 'Forbidden' }, { status: 403 });
}
```

**Access rules:**

- **GET** (view tasks): Requires 'view' or 'edit' permission
- **POST/PUT/DELETE** (modify tasks): Requires 'edit' permission
- **POST complete**: Requires 'edit' permission

**Priority colors (use Tailwind color names from ticket-006 system):**

Categories already use Tailwind color names. For consistency, priority could also use color names, but for MVP we'll use the existing PriorityBadge component which uses explicit colors:

- Urgent: Red (`bg-red-500`)
- High: Orange (`bg-orange-500`)
- Medium: Blue (`bg-blue-500`)
- Low: Gray (`bg-gray-500`)

**Note:** PriorityBadge component already exists and handles colors correctly.

**Recurring config:**

```typescript
export const recurringConfigSchema = z.object({
	frequency: z.enum(['daily', 'weekly', 'monthly']),
	interval: z.number().int().min(1) // e.g., every 2 weeks
});
```

**Complete logic:**

```typescript
async function completeTask(taskId: number) {
	const task = await db.getItem(taskId);

	// Archive current
	await db.updateItem(taskId, {
		is_archived: true,
		completed_at: new Date()
	});

	// If recurring, create next
	if (task.recurring_config) {
		const nextDate = calculateNextDate(task.recurring_config);
		await db.createItem({
			...task,
			id: undefined,
			is_archived: false,
			completed_at: null,
			next_show_date: nextDate,
			created_at: new Date()
		});
	}
}
```

## Testing

- ✅ Unit test: Task creation with all fields
- ✅ Unit test: Priority validation
- ✅ Unit test: Recurring logic calculates correct date
- ✅ Unit test: Complete archives task
- ✅ Unit test: Next occurrence hidden by next_show_date
- ✅ E2E test: Create task with all fields
- ✅ E2E test: Complete recurring task
- ✅ E2E test: Archive view

## Accessibility

- ✅ Priority badges have accessible text
- ✅ Deadline picker keyboard accessible
- ✅ Form fields properly labeled
- ✅ Complete button has confirmation for recurring
- ✅ Status announced on completion

## Performance

- ✅ Task list paginated (50 per page)
- ✅ Filters query optimized with indices
- ✅ next_show_date indexed for fast queries
- ✅ Archive queries separate from active

## Implementation Notes

**Completed Features:**

- All CRUD operations for tasks with full permission enforcement
- Priority selector with 4 levels (Urgent/High/Medium/Low)
- Assignee selector loading users from API
- Deadline picker using shadcn Calendar component
- Time estimate input with preset buttons (15m, 30m, 60m, 120m, 240m)
- Recurring configuration dialog (daily/weekly/monthly with interval)
- Complete task action with archive and next occurrence creation
- Task list with priority sorting and filters
- Archive toggle to view completed tasks
- Permission checks using `checkCategoryAccess()` from ticket-007

**Shared Infrastructure for Chores & Habits:**

The following components and utilities are now available for tickets 009 and 010:

- `TaskForm` component (can be adapted for chores/habits)
- `TaskList` component (generic item list with filters)
- `PrioritySelector`, `AssigneeSelector`, `DeadlinePicker`, `TimeEstimateInput`, `RecurringConfigDialog`
- Items API routes pattern (`/api/categories/:id/items`, `/api/items/:id`, `/api/items/:id/complete`)
- Item queries: `createItem`, `getItemById`, `updateItem`, `deleteItem`, `completeItem`, `listItemsForCategory`
- Field values queries: `getFieldValuesForItem`, `upsertFieldValues`
- Recurring utilities: `parseRecurringConfig`, `calculateNextDate`, `formatRecurringConfig`
- Permission enforcement pattern established

**Files Created:**

- Schemas: `src/lib/schemas/items.ts` (with tests)
- Database queries: Extended `src/lib/server/db/queries/items.ts`, created `fieldValues.ts`
- API routes: `src/routes/api/categories/[id]/items/+server.ts`, `src/routes/api/items/[id]/+server.ts`, `src/routes/api/items/[id]/complete/+server.ts`
- Components: `PrioritySelector`, `AssigneeSelector`, `DeadlinePicker`, `TimeEstimateInput`, `RecurringConfigDialog`, `TaskForm`, `TaskList`
- Pages: `src/routes/categories/[id]/+page.svelte`, `+page.server.ts`, `useTaskActions.svelte.ts`
- Utilities: `src/lib/utils/recurring.ts` (with tests)
- Migration: `004_seed_tasks.sql`
- Tests: Unit tests for all queries, schemas, and utilities; E2E tests for full task flows
