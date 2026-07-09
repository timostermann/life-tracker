import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { applyTemplateSchema } from '$lib/schemas/templates';
import { getTemplateById, createCategory, createField } from '$lib/server/db/queries';
import { getDb } from '$lib/server/db';
import type { CreateFieldInput } from '$lib/server/db/queries/types';
import { parseTemplateConfig } from '$lib/utils/templates';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized', toast: 'error' }, { status: 401 });
	}

	const templateId = parseInt(params.id, 10);
	if (isNaN(templateId)) {
		return json(
			{
				error: 'Invalid template ID',
				toast: 'error',
				message: 'Template ID must be a valid number'
			},
			{ status: 400 }
		);
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON', toast: 'error' }, { status: 400 });
	}

	const parsed = applyTemplateSchema.safeParse(body);
	if (!parsed.success) {
		return json(
			{
				error: 'Invalid input',
				issues: parsed.error.flatten(),
				toast: 'error',
				message: 'Please check your input and try again'
			},
			{ status: 400 }
		);
	}

	const template = getTemplateById(templateId);
	if (!template) {
		return json(
			{
				error: 'Template not found',
				toast: 'error',
				message: 'The requested template does not exist'
			},
			{ status: 404 }
		);
	}

	const config = parseTemplateConfig(template.category_config);
	if (!config) {
		return json(
			{
				error: 'Invalid template configuration',
				toast: 'error',
				message: 'Template configuration is corrupted or invalid'
			},
			{ status: 500 }
		);
	}

	const db = getDb();
	const applyTemplateTransaction = db.transaction(() => {
		const category = createCategory(
			{
				user_id: user.id,
				name: parsed.data.name,
				template_type: template.template_type,
				icon: config.icon ?? null,
				color: config.color ?? null,
				is_private: true
			},
			db
		);

		if (config.fields && config.fields.length > 0) {
			for (const field of config.fields) {
				const fieldInput: CreateFieldInput = {
					category_id: category.id,
					name: field.name,
					field_type: field.field_type,
					options: field.options ?? null,
					field_order: field.field_order
				};
				createField(fieldInput, db);
			}
		}

		return category;
	});

	const category = applyTemplateTransaction();

	return json(
		{
			category,
			toast: 'success',
			message: `Category "${parsed.data.name}" created successfully`
		},
		{ status: 201 }
	);
};
