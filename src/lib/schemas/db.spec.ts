import { describe, it, expect } from 'vitest';
import { itemWithAssigneeSchema } from './db';

/** Minimal SQLite-shaped row for list queries with join */
const baseItemRow = {
	id: 1,
	category_id: 1,
	user_id: 1,
	assigned_to_user_id: null,
	priority: null,
	deadline: null,
	time_estimate: null,
	is_archived: 0,
	completed_at: null,
	recurring_config: null,
	next_show_date: null,
	created_at: '2026-01-01 00:00:00',
	updated_at: '2026-01-01 00:00:00'
};

describe('itemWithAssigneeSchema', () => {
	it('keeps assigned_to_username from joined user', () => {
		const parsed = itemWithAssigneeSchema.parse({
			...baseItemRow,
			assigned_to_username: 'pat'
		});
		expect(parsed.assigned_to_username).toBe('pat');
	});

	it('accepts null assigned_to_username from LEFT JOIN', () => {
		const parsed = itemWithAssigneeSchema.parse({
			...baseItemRow,
			assigned_to_username: null
		});
		expect(parsed.assigned_to_username).toBeNull();
	});

	it('accepts omitted assigned_to_username', () => {
		const parsed = itemWithAssigneeSchema.parse({ ...baseItemRow });
		expect(parsed.assigned_to_username).toBeUndefined();
	});
});
