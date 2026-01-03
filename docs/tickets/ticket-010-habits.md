# Ticket 010: Habits Implementation

**ID:** ticket-010  
**Scope:** `habits` or `ticket-010`  
**Phase:** 1 (MVP)  
**Dependencies:** ticket-008

## Description

Implement habit tracking with daily entries, streaks, frequency goals, and notes using the habit_entries table.

## Tasks

- [ ] Create Zod schemas for habit operations
- [ ] Create habit and habit_entries API endpoints
- [ ] Create habit list view with current streaks
- [ ] Create habit log form (date + status + notes)
- [ ] Implement entry calendar view
- [ ] Calculate and display current streak
- [ ] Calculate and display frequency stats (e.g., 5/7 days)
- [ ] Show entry history with notes
- [ ] Implement "Log Today" quick action
- [ ] Add good/bad habit indicator
- [ ] Add unit tests for streak calculation (co-located)
- [ ] Add E2E tests for habit flows

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

## Technical Notes

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
	const sorted = entries
		.filter((e) => e.status === 'done')
		.sort((a, b) => new Date(b.logged_date).getTime() - new Date(a.logged_date).getTime());

	let streak = 0;
	let currentDate = new Date();

	for (const entry of sorted) {
		const entryDate = new Date(entry.logged_date);
		const daysDiff = Math.floor(
			(currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)
		);

		if (daysDiff === streak) {
			streak++;
			currentDate = entryDate;
		} else {
			break;
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

	const recent = entries.filter((e) => new Date(e.logged_date) >= cutoff);
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
