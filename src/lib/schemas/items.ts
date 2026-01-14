import { z } from 'zod';
import { prioritySchema } from './db';

export const recurringConfigSchema = z.object({
	frequency: z.enum(['daily', 'weekly', 'monthly']),
	interval: z.number().int().min(1)
});

export type RecurringConfig = z.infer<typeof recurringConfigSchema>;

export const createItemSchema = z.object({
	priority: prioritySchema.nullable().optional(),
	deadline: z.string().datetime().nullable().optional(),
	time_estimate: z.number().int().min(1).nullable().optional(),
	assigned_to_user_id: z.number().int().positive().nullable().optional(),
	recurring_config: recurringConfigSchema.nullable().optional(),
	values: z.record(z.string(), z.string()).default({})
});

export type CreateItemInput = z.infer<typeof createItemSchema>;

export const updateItemSchema = z.object({
	priority: prioritySchema.optional(),
	deadline: z.string().datetime().optional().nullable(),
	time_estimate: z.number().int().min(1).optional().nullable(),
	assigned_to_user_id: z.number().int().positive().optional().nullable(),
	recurring_config: recurringConfigSchema.optional().nullable(),
	is_archived: z.boolean().optional(),
	completed_at: z.string().datetime().optional().nullable(),
	next_show_date: z.string().datetime().optional().nullable(),
	values: z.record(z.string(), z.string()).optional()
});

export type UpdateItemInput = z.infer<typeof updateItemSchema>;

export const listItemsQuerySchema = z.object({
	limit: z.coerce.number().int().min(1).max(100).default(50),
	offset: z.coerce.number().int().min(0).default(0),
	include_archived: z.coerce.boolean().default(false),
	priority: prioritySchema.optional(),
	assigned_to_user_id: z.coerce.number().int().positive().optional()
});

export type ListItemsQuery = z.infer<typeof listItemsQuerySchema>;
