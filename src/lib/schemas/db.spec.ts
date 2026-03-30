import { describe, it, expect } from 'vitest';
import { apiTokenListItemSchema, apiTokenSchema, itemWithAssigneeSchema } from './db';

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

describe('apiTokenSchema', () => {
	it('parses a full api_tokens row', () => {
		const parsed = apiTokenSchema.parse({
			id: 1,
			user_id: 2,
			name: 'assistant',
			token_hash: 'abc',
			created_at: 1700000000,
			last_used_at: null
		});
		expect(parsed.last_used_at).toBeNull();
	});

	it('parses list item rows without token_hash', () => {
		const parsed = apiTokenListItemSchema.parse({
			id: 1,
			name: 'assistant',
			created_at: 1700000000,
			last_used_at: 1700000100
		});
		expect(parsed.name).toBe('assistant');
	});
});
