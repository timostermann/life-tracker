import { z } from 'zod';
import { habitEntryStatusSchema } from './db';

export const habitEntrySchema = z.object({
	logged_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	status: habitEntryStatusSchema,
	notes: z.string().max(500).optional()
});

export type HabitEntryInput = z.infer<typeof habitEntrySchema>;

export const createHabitSchema = z.object({
	values: z.record(z.string(), z.string()).default({})
});

export type CreateHabitInput = z.infer<typeof createHabitSchema>;

export const updateHabitSchema = z.object({
	values: z.record(z.string(), z.string()).optional()
});

export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;

export const habitStatsSchema = z.object({
	current_streak: z.number().int().min(0),
	longest_streak: z.number().int().min(0),
	total_entries: z.number().int().min(0),
	last_7_days: z.object({
		done: z.number().int().min(0),
		total: z.number().int().min(0)
	}),
	last_30_days: z.object({
		done: z.number().int().min(0),
		total: z.number().int().min(0)
	})
});

export type HabitStats = z.infer<typeof habitStatsSchema>;

export const listHabitEntriesQuerySchema = z.object({
	from_date: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),
	to_date: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional()
});

export type ListHabitEntriesQuery = z.infer<typeof listHabitEntriesQuerySchema>;
