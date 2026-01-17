import { z } from 'zod';

export const applyTemplateSchema = z.object({
	name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less')
});

export type ApplyTemplateInput = z.infer<typeof applyTemplateSchema>;

export const templateConfigSchema = z.object({
	name: z.string(),
	icon: z.string().optional(),
	color: z.string().optional(),
	fields: z
		.array(
			z.object({
				name: z.string(),
				field_type: z.enum(['text', 'number', 'date', 'boolean', 'select']),
				options: z.string().optional(),
				field_order: z.number().int().nonnegative()
			})
		)
		.optional()
		.default([])
});

export type TemplateConfig = z.infer<typeof templateConfigSchema>;
