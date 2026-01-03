import { z } from 'zod';

/**
 * SQLite stores booleans as INTEGER 0/1. We normalize to boolean for app code.
 */
const sqliteBool = z
	.union([z.boolean(), z.number().int().min(0).max(1)])
	.transform((v) => Boolean(v));

/**
 * SQLite CURRENT_TIMESTAMP is typically `YYYY-MM-DD HH:MM:SS`.
 * We keep this permissive to avoid coupling to a specific format.
 */
const sqliteDateTime = z.string().min(1);
const sqliteDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const templateTypeSchema = z.enum(['task', 'chore', 'habit']);
export const fieldTypeSchema = z.enum(['text', 'number', 'date', 'boolean', 'select']);
export const prioritySchema = z.enum(['urgent', 'high', 'medium', 'low']);
export const permissionSchema = z.enum(['view', 'edit']);
export const habitEntryStatusSchema = z.enum(['done', 'skipped', 'failed']);

export const userSchema = z.object({
	id: z.number().int().positive(),
	username: z.string().min(1),
	password_hash: z.string().min(1),
	created_at: sqliteDateTime,
	updated_at: sqliteDateTime
});
export type User = z.infer<typeof userSchema>;

export const categorySchema = z.object({
	id: z.number().int().positive(),
	user_id: z.number().int().positive(),
	name: z.string().min(1),
	template_type: templateTypeSchema,
	icon: z.string().nullable().optional(),
	color: z.string().nullable().optional(),
	is_private: sqliteBool,
	created_at: sqliteDateTime,
	updated_at: sqliteDateTime
});
export type Category = z.infer<typeof categorySchema>;

export const fieldSchema = z.object({
	id: z.number().int().positive(),
	category_id: z.number().int().positive(),
	name: z.string().min(1),
	field_type: fieldTypeSchema,
	options: z.string().nullable().optional(),
	field_order: z.number().int(),
	created_at: sqliteDateTime
});
export type Field = z.infer<typeof fieldSchema>;

export const itemSchema = z.object({
	id: z.number().int().positive(),
	category_id: z.number().int().positive(),
	user_id: z.number().int().positive(),
	assigned_to_user_id: z.number().int().positive().nullable(),
	priority: prioritySchema.nullable(),
	deadline: sqliteDateTime.nullable(),
	time_estimate: z.number().int().nullable(),
	is_archived: sqliteBool,
	completed_at: sqliteDateTime.nullable(),
	recurring_config: z.string().nullable(),
	next_show_date: sqliteDateTime.nullable(),
	created_at: sqliteDateTime,
	updated_at: sqliteDateTime
});
export type Item = z.infer<typeof itemSchema>;

export const fieldValueSchema = z.object({
	id: z.number().int().positive(),
	item_id: z.number().int().positive(),
	field_id: z.number().int().positive(),
	value: z.string().nullable(),
	created_at: sqliteDateTime
});
export type FieldValue = z.infer<typeof fieldValueSchema>;

export const habitEntrySchema = z.object({
	id: z.number().int().positive(),
	item_id: z.number().int().positive(),
	logged_date: sqliteDate,
	status: habitEntryStatusSchema,
	notes: z.string().nullable().optional(),
	created_at: sqliteDateTime
});
export type HabitEntry = z.infer<typeof habitEntrySchema>;

export const sharedAccessSchema = z.object({
	id: z.number().int().positive(),
	category_id: z.number().int().positive(),
	shared_with_user_id: z.number().int().positive(),
	permission: permissionSchema,
	created_at: sqliteDateTime
});
export type SharedAccess = z.infer<typeof sharedAccessSchema>;

export const templateSchema = z.object({
	id: z.number().int().positive(),
	name: z.string().min(1),
	template_type: templateTypeSchema,
	description: z.string().nullable().optional(),
	icon: z.string().nullable().optional(),
	category_config: z.string().min(1),
	is_system: sqliteBool,
	created_at: sqliteDateTime
});
export type Template = z.infer<typeof templateSchema>;

/**
 * Lucia v3 session row as stored by @lucia-auth/adapter-sqlite.
 * (Adapter uses `user_id` and `expires_at` unix seconds.)
 */
export const sessionSchema = z.object({
	id: z.string().min(1),
	user_id: z.number().int().positive(),
	expires_at: z.number().int().positive()
});
export type DbSession = z.infer<typeof sessionSchema>;
