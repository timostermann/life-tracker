import { describe, it, expect } from 'vitest';
import {
	recurringConfigSchema,
	createItemSchema,
	updateItemSchema,
	listItemsQuerySchema,
	createChoreSchema,
	updateChoreSchema
} from './items';

describe('recurringConfigSchema', () => {
	it('should validate valid daily recurring config', () => {
		const result = recurringConfigSchema.safeParse({
			frequency: 'daily',
			interval: 1
		});
		expect(result.success).toBe(true);
	});

	it('should validate valid weekly recurring config', () => {
		const result = recurringConfigSchema.safeParse({
			frequency: 'weekly',
			interval: 2
		});
		expect(result.success).toBe(true);
	});

	it('should validate valid monthly recurring config', () => {
		const result = recurringConfigSchema.safeParse({
			frequency: 'monthly',
			interval: 3
		});
		expect(result.success).toBe(true);
	});

	it('should reject invalid frequency', () => {
		const result = recurringConfigSchema.safeParse({
			frequency: 'yearly',
			interval: 1
		});
		expect(result.success).toBe(false);
	});

	it('should reject zero interval', () => {
		const result = recurringConfigSchema.safeParse({
			frequency: 'daily',
			interval: 0
		});
		expect(result.success).toBe(false);
	});

	it('should reject negative interval', () => {
		const result = recurringConfigSchema.safeParse({
			frequency: 'daily',
			interval: -1
		});
		expect(result.success).toBe(false);
	});

	it('should reject non-integer interval', () => {
		const result = recurringConfigSchema.safeParse({
			frequency: 'daily',
			interval: 1.5
		});
		expect(result.success).toBe(false);
	});
});

describe('createItemSchema', () => {
	it('should validate minimal item with only values', () => {
		const result = createItemSchema.safeParse({
			values: { '1': 'Task title' }
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.values).toEqual({ '1': 'Task title' });
		}
	});

	it('should default empty values object', () => {
		const result = createItemSchema.safeParse({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.values).toEqual({});
		}
	});

	it('should validate item with all optional fields', () => {
		const result = createItemSchema.safeParse({
			priority: 'high',
			deadline: '2026-01-15T10:00:00Z',
			time_estimate: 60,
			assigned_to_user_id: 2,
			recurring_config: {
				frequency: 'weekly',
				interval: 1
			},
			values: { '1': 'Complete project' }
		});
		expect(result.success).toBe(true);
	});

	it('should validate all priority levels', () => {
		const priorities = ['urgent', 'high', 'medium', 'low'];
		priorities.forEach((priority) => {
			const result = createItemSchema.safeParse({
				priority,
				values: {}
			});
			expect(result.success).toBe(true);
		});
	});

	it('should reject invalid priority', () => {
		const result = createItemSchema.safeParse({
			priority: 'critical',
			values: {}
		});
		expect(result.success).toBe(false);
	});

	it('should reject invalid datetime format', () => {
		const result = createItemSchema.safeParse({
			deadline: '2026-01-15',
			values: {}
		});
		expect(result.success).toBe(false);
	});

	it('should reject zero time estimate', () => {
		const result = createItemSchema.safeParse({
			time_estimate: 0,
			values: {}
		});
		expect(result.success).toBe(false);
	});

	it('should reject negative time estimate', () => {
		const result = createItemSchema.safeParse({
			time_estimate: -30,
			values: {}
		});
		expect(result.success).toBe(false);
	});

	it('should reject non-positive assigned_to_user_id', () => {
		const result = createItemSchema.safeParse({
			assigned_to_user_id: 0,
			values: {}
		});
		expect(result.success).toBe(false);
	});

	it('should accept null values for optional fields', () => {
		const result = createItemSchema.safeParse({
			priority: null,
			deadline: null,
			time_estimate: null,
			assigned_to_user_id: null,
			recurring_config: null,
			values: { '1': 'Task' }
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.priority).toBeNull();
			expect(result.data.deadline).toBeNull();
			expect(result.data.time_estimate).toBeNull();
			expect(result.data.assigned_to_user_id).toBeNull();
			expect(result.data.recurring_config).toBeNull();
		}
	});

	it('should accept undefined values for optional fields', () => {
		const result = createItemSchema.safeParse({
			values: { '1': 'Task' }
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.priority).toBeUndefined();
			expect(result.data.deadline).toBeUndefined();
			expect(result.data.time_estimate).toBeUndefined();
			expect(result.data.assigned_to_user_id).toBeUndefined();
			expect(result.data.recurring_config).toBeUndefined();
		}
	});
});

describe('updateItemSchema', () => {
	it('should validate empty update', () => {
		const result = updateItemSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it('should validate partial update with priority', () => {
		const result = updateItemSchema.safeParse({
			priority: 'urgent'
		});
		expect(result.success).toBe(true);
	});

	it('should validate null deadline to clear it', () => {
		const result = updateItemSchema.safeParse({
			deadline: null
		});
		expect(result.success).toBe(true);
	});

	it('should validate null time_estimate to clear it', () => {
		const result = updateItemSchema.safeParse({
			time_estimate: null
		});
		expect(result.success).toBe(true);
	});

	it('should validate null assigned_to_user_id to unassign', () => {
		const result = updateItemSchema.safeParse({
			assigned_to_user_id: null
		});
		expect(result.success).toBe(true);
	});

	it('should validate null recurring_config to disable recurring', () => {
		const result = updateItemSchema.safeParse({
			recurring_config: null
		});
		expect(result.success).toBe(true);
	});

	it('should validate is_archived boolean', () => {
		const result = updateItemSchema.safeParse({
			is_archived: true
		});
		expect(result.success).toBe(true);
	});

	it('should validate completed_at datetime', () => {
		const result = updateItemSchema.safeParse({
			completed_at: '2026-01-12T15:30:00Z'
		});
		expect(result.success).toBe(true);
	});

	it('should validate next_show_date datetime', () => {
		const result = updateItemSchema.safeParse({
			next_show_date: '2026-01-20T00:00:00Z'
		});
		expect(result.success).toBe(true);
	});

	it('should validate values update', () => {
		const result = updateItemSchema.safeParse({
			values: { '1': 'Updated title', '2': 'New description' }
		});
		expect(result.success).toBe(true);
	});
});

describe('listItemsQuerySchema', () => {
	it('should use default values', () => {
		const result = listItemsQuerySchema.safeParse({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.limit).toBe(50);
			expect(result.data.offset).toBe(0);
			expect(result.data.include_archived).toBe(false);
		}
	});

	it('should coerce string limit to number', () => {
		const result = listItemsQuerySchema.safeParse({ limit: '25' });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.limit).toBe(25);
		}
	});

	it('should coerce string offset to number', () => {
		const result = listItemsQuerySchema.safeParse({ offset: '10' });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.offset).toBe(10);
		}
	});

	it('should coerce string boolean to boolean', () => {
		const result = listItemsQuerySchema.safeParse({ include_archived: 'true' });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.include_archived).toBe(true);
		}
	});

	it('should reject limit over 100', () => {
		const result = listItemsQuerySchema.safeParse({ limit: 101 });
		expect(result.success).toBe(false);
	});

	it('should reject negative limit', () => {
		const result = listItemsQuerySchema.safeParse({ limit: -1 });
		expect(result.success).toBe(false);
	});

	it('should reject negative offset', () => {
		const result = listItemsQuerySchema.safeParse({ offset: -1 });
		expect(result.success).toBe(false);
	});

	it('should filter by priority', () => {
		const result = listItemsQuerySchema.safeParse({ priority: 'high' });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.priority).toBe('high');
		}
	});

	it('should filter by assigned_to_user_id', () => {
		const result = listItemsQuerySchema.safeParse({ assigned_to_user_id: '3' });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.assigned_to_user_id).toBe(3);
		}
	});

	describe('createChoreSchema', () => {
		it('should require recurring_config', () => {
			const result = createChoreSchema.safeParse({
				values: { '1': 'Chore name' }
			});
			expect(result.success).toBe(false);
		});

		it('should validate chore with required recurring_config', () => {
			const result = createChoreSchema.safeParse({
				recurring_config: {
					frequency: 'weekly',
					interval: 1
				},
				values: { '1': 'Vacuum living room' }
			});
			expect(result.success).toBe(true);
		});

		it('should validate chore with assignee and recurring_config', () => {
			const result = createChoreSchema.safeParse({
				assigned_to_user_id: 2,
				recurring_config: {
					frequency: 'monthly',
					interval: 1
				},
				values: { '1': 'Change air filter' }
			});
			expect(result.success).toBe(true);
		});

		it('should reject chore without recurring_config', () => {
			const result = createChoreSchema.safeParse({
				assigned_to_user_id: 2,
				values: { '1': 'Chore name' }
			});
			expect(result.success).toBe(false);
		});

		it('should reject invalid recurring_config', () => {
			const result = createChoreSchema.safeParse({
				recurring_config: {
					frequency: 'yearly',
					interval: 1
				},
				values: { '1': 'Chore name' }
			});
			expect(result.success).toBe(false);
		});

		it('should default empty values object', () => {
			const result = createChoreSchema.safeParse({
				recurring_config: {
					frequency: 'daily',
					interval: 1
				}
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.values).toEqual({});
			}
		});
	});

	describe('updateChoreSchema', () => {
		it('should require recurring_config', () => {
			const result = updateChoreSchema.safeParse({
				assigned_to_user_id: 2
			});
			expect(result.success).toBe(false);
		});

		it('should validate chore update with required recurring_config', () => {
			const result = updateChoreSchema.safeParse({
				recurring_config: {
					frequency: 'weekly',
					interval: 2
				}
			});
			expect(result.success).toBe(true);
		});

		it('should validate chore update with all fields', () => {
			const result = updateChoreSchema.safeParse({
				assigned_to_user_id: 2,
				recurring_config: {
					frequency: 'monthly',
					interval: 1
				},
				is_archived: false,
				values: { '1': 'Updated chore name' }
			});
			expect(result.success).toBe(true);
		});

		it('should reject update without recurring_config', () => {
			const result = updateChoreSchema.safeParse({
				assigned_to_user_id: 2,
				values: { '1': 'Updated name' }
			});
			expect(result.success).toBe(false);
		});
	});
});
