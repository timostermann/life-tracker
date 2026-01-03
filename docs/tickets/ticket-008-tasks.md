# Ticket 008: Tasks Implementation

**ID:** ticket-008  
**Scope:** `items` or `ticket-008`  
**Phase:** 1 (MVP)  
**Dependencies:** ticket-006, ticket-007

## Description

Implement full task management with priority, assignment, deadlines, time estimates, recurring tasks, and archiving.

## Tasks

- [ ] Create Zod schemas for task operations
- [ ] Create API endpoints for tasks (CRUD + complete)
- [ ] Create task list view with priority sorting
- [ ] Create task form component (all fields)
- [ ] Implement priority selector (Urgent/High/Medium/Low)
- [ ] Implement assignee selector
- [ ] Implement deadline picker (Calendar component)
- [ ] Implement time estimate input (minutes)
- [ ] Implement recurring configuration dialog
- [ ] Implement complete task action
- [ ] Implement recurring logic (archive + create next)
- [ ] Calculate and set next_show_date for recurring
- [ ] Add archive view
- [ ] Add filters (priority, assignee, due date)
- [ ] Add unit tests (co-located)
- [ ] Add E2E tests for task flows

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

## Technical Notes

**Priority colors:**

- Urgent: Red (#ef4444)
- High: Orange (#f97316)
- Medium: Blue (#3b82f6)
- Low: Gray (#6b7280)

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
