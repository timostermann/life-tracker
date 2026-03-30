import type { z } from 'zod';

import type { Category, HabitEntry, Item, Template, User, Field, FieldValue } from '$lib/schemas';
import {
	categorySchema,
	fieldSchema,
	fieldValueSchema,
	habitEntrySchema,
	itemSchema,
	itemWithAssigneeSchema,
	permissionSchema,
	templateSchema,
	userSchema
} from '$lib/schemas';

export type TemplateType = 'task' | 'chore' | 'habit';
export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type Permission = 'view' | 'edit';
export type HabitEntryStatus = 'done' | 'skipped' | 'failed';
export type FieldType = 'text' | 'number' | 'date' | 'boolean' | 'select';

export type { Category, HabitEntry, Item, Template, User, Field, FieldValue };

export const sharedCategorySchema = categorySchema.extend({ permission: permissionSchema });
export type SharedCategory = z.infer<typeof sharedCategorySchema>;

export type CreateUserInput = Pick<User, 'username' | 'password_hash'>;
export type CreateCategoryInput = Pick<Category, 'user_id' | 'name' | 'template_type'> & {
	icon?: string | null;
	color?: string | null;
	is_private?: boolean;
};

export type UpdateCategoryInput = {
	name?: string;
	icon?: string | null;
	color?: string | null;
	is_private?: boolean;
};

export type CreateFieldInput = {
	category_id: number;
	name: string;
	field_type: FieldType;
	options?: string | null;
	field_order: number;
};

export type UpdateFieldInput = {
	name?: string;
	field_type?: FieldType;
	options?: string | null;
	field_order?: number;
};

export type CreateItemInput = Pick<Item, 'category_id' | 'user_id'> & {
	assigned_to_user_id?: number | null;
	priority?: Priority | null;
	deadline?: string | null;
	time_estimate?: number | null;
	recurring_config?: string | null;
	next_show_date?: string | null;
	field_values?: Array<{ field_id: number; value: string | null }>;
};

export type UpdateItemInput = {
	assigned_to_user_id?: number | null;
	priority?: Priority | null;
	deadline?: string | null;
	time_estimate?: number | null;
	recurring_config?: string | null;
	is_archived?: boolean;
	completed_at?: string | null;
	next_show_date?: string | null;
};

export type ListItemsOptions = { include_archived?: boolean; limit?: number; offset?: number };
export type ListEntriesOptions = {
	limit?: number;
	offset?: number;
	from_date?: string;
	to_date?: string;
};

export type { ItemWithAssignee } from '$lib/schemas';

export type UpsertHabitEntryInput = Pick<HabitEntry, 'item_id' | 'logged_date' | 'status'> & {
	notes?: string | null;
};

// Schemas re-exported for internal use (keeps module boundaries clean)
export const dbSchemas = {
	userSchema,
	templateSchema,
	categorySchema,
	fieldSchema,
	fieldValueSchema,
	itemSchema,
	itemWithAssigneeSchema,
	habitEntrySchema,
	permissionSchema
};
