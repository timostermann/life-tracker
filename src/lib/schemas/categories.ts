import { z } from 'zod';
import { templateTypeSchema, fieldTypeSchema, permissionSchema } from './db';

export const tailwindColorNames = [
	'red',
	'orange',
	'amber',
	'yellow',
	'lime',
	'green',
	'emerald',
	'teal',
	'cyan',
	'sky',
	'blue',
	'indigo',
	'violet',
	'purple',
	'fuchsia',
	'pink',
	'rose',
	'slate',
	'gray',
	'zinc',
	'neutral',
	'stone'
] as const;

export type TailwindColorName = (typeof tailwindColorNames)[number];

/** Shown when API clients send hex or other invalid category colors */
export const categoryColorValidationMessage =
	'Must be a Tailwind palette name (e.g. blue, sky, emerald). Hex color codes are not supported.';

const optionalTailwindColor = z
	.string()
	.optional()
	.refine((v) => v === undefined || (tailwindColorNames as readonly string[]).includes(v), {
		message: categoryColorValidationMessage
	});

export const categoryFieldSchema = z.object({
	id: z.number().int().positive().optional(),
	name: z.string().min(1).max(100),
	field_type: fieldTypeSchema,
	options: z.string().optional(),
	field_order: z.number().int().default(0)
});

export type CategoryFieldInput = z.infer<typeof categoryFieldSchema>;

export const createCategorySchema = z.object({
	name: z.string().min(1).max(100),
	template_type: templateTypeSchema,
	icon: z.string().optional(),
	color: optionalTailwindColor,
	is_private: z.boolean().default(true),
	fields: z.array(categoryFieldSchema).default([])
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = z.object({
	name: z.string().min(1).max(100).optional(),
	icon: z.string().optional(),
	color: optionalTailwindColor,
	is_private: z.boolean().optional(),
	fields: z.array(categoryFieldSchema).optional()
});

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export const shareCategorySchema = z.object({
	user_id: z.number().int().positive(),
	permission: permissionSchema
});

export type ShareCategoryInput = z.infer<typeof shareCategorySchema>;
