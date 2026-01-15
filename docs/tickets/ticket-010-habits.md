# Ticket 010: Habits Implementation

**ID:** ticket-010  
**Scope:** `habits` or `ticket-010`  
**Phase:** 1 (MVP)  
**Dependencies:** ticket-008

## Description

Implement habit tracking with daily entries, streaks, frequency goals, and notes using the habit_entries table.

**Note:** Ticket-008 (Tasks) has implemented shared infrastructure that can be reused for habits:

- Item CRUD operations and queries (for habit trackers)
- Field values management
- TaskForm pattern (adapt for habit creation)
- Permission enforcement patterns
- The habits-specific functionality will be the habit_entries table and streak calculations

## Tasks

- [x] Create Zod schemas for habit operations
- [x] Create habit and habit_entries API endpoints
- [x] Create habit list view with current streaks
- [x] Create habit log form (date + status + notes)
- [x] Implement entry calendar view
- [x] Calculate and display current streak
- [x] Calculate and display frequency stats (e.g., 5/7 days)
- [x] Show entry history with notes
- [x] Implement "Log Today" quick action
- [x] Add good/bad habit indicator
- [x] Add unit tests for streak calculation (co-located)
- [x] Add E2E tests for habit flows

## API Endpoints

- `GET /api/habits/:id/entries` - Get entries + stats
- `POST /api/habits/:id/entries` - Log entry
- `PUT /api/habits/:id/entries/:date` - Update entry
- `DELETE /api/habits/:id/entries/:date` - Delete entry

## Acceptance Criteria

- ✅ Users can create habits (good or bad)
- ✅ Users can log daily entries with status (done/skipped/failed)
- ✅ Users can add optional notes to entries
- ✅ Calendar view shows all logged days
- ✅ Current streak calculated correctly
- ✅ Longest streak tracked
- ✅ Frequency stats shown (last 7 days, last 30 days)
- ✅ Can only log one entry per day
- ✅ "Log Today" button if not logged yet
- ✅ Entry history shows all notes
- ✅ All operations validated with Zod
- ✅ Success toasts on log/update/delete
- ✅ Seeding with real-life examples

## Technical Notes

**Permission Enforcement (from ticket-007):**

All habit operations must check category access using `checkCategoryAccess()`:

```typescript
import { checkCategoryAccess } from '$lib/server/db/queries/categories';

const hasAccess = checkCategoryAccess(categoryId, user.id, 'edit', db);
if (!hasAccess) {
	return json({ error: 'Forbidden' }, { status: 403 });
}
```

**Access rules:**

- **GET** (view habits + entries): Requires 'view' or 'edit' permission
- **POST/PUT/DELETE** (modify habits or entries): Requires 'edit' permission

**Zod schema:**

```typescript
export const habitEntrySchema = z.object({
	logged_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	status: z.enum(['done', 'skipped', 'failed']),
	notes: z.string().max(500).optional()
});
```

**Streak calculation:**

```typescript
function calculateStreak(entries: HabitEntry[]): number {
	const doneEntries = entries
		.filter((e) => e.status === 'done')
		.map((e) => {
			const date = new Date(e.logged_date);
			date.setHours(0, 0, 0, 0);
			return { ...e, date };
		})
		.sort((a, b) => b.date.getTime() - a.date.getTime());

	if (doneEntries.length === 0) return 0;

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	let streak = 0;
	let expectedDate = today;

	for (const entry of doneEntries) {
		const daysDiff = Math.floor(
			(expectedDate.getTime() - entry.date.getTime()) / (1000 * 60 * 60 * 24)
		);
		if (daysDiff > 1) {
			break;
		}
		if (daysDiff === 0 || (streak === 0 && daysDiff <= 1)) {
			streak++;
			expectedDate = new Date(entry.date);
			expectedDate.setDate(expectedDate.getDate() - 1);
		}
	}

	return streak;
}
```

**Frequency calculation:**

```typescript
function calculateFrequency(entries: HabitEntry[], days: number): { done: number; total: number } {
	const cutoff = new Date();
	cutoff.setDate(cutoff.getDate() - days);
	cutoff.setHours(0, 0, 0, 0);

	const recent = entries.filter((e) => {
		const entryDate = new Date(e.logged_date);
		entryDate.setHours(0, 0, 0, 0);
		return entryDate >= cutoff;
	});

	const done = recent.filter((e) => e.status === 'done').length;
	return { done, total: days };
}
```

## Testing

- ✅ Unit test: Streak calculation correct
- ✅ Unit test: Frequency calculation correct
- ✅ Unit test: Can't log duplicate entry for same day
- ✅ Unit test: Status enum validated
- ✅ E2E test: Log habit entry with notes
- ✅ E2E test: View streak and history
- ✅ E2E test: Update past entry

## Accessibility

- ✅ Calendar view keyboard accessible
- ✅ Entry status clearly labeled
- ✅ Streak numbers announced
- ✅ Notes textarea properly labeled
- ✅ Status icons have text alternatives

## Performance

- ✅ Entries query limited to last 365 days
- ✅ Streak calculation optimized
- ✅ Calendar view loads only visible month
- ✅ Index on (item_id, logged_date)
