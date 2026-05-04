import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listTemplates } from '$lib/server/db/queries';
import { getDb } from '$lib/server/db';
import { templateTypeSchema } from '$lib/schemas/db';

export const GET: RequestHandler = async ({ url, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized', toast: 'error' }, { status: 401 });
	}

	// Get optional type filter from query params
	const typeParam = url.searchParams.get('type');
	let templateType: 'task' | 'chore' | 'habit' | undefined;

	if (typeParam) {
		const parsed = templateTypeSchema.safeParse(typeParam);
		if (!parsed.success) {
			return json(
				{
					error: 'Invalid template type',
					toast: 'error',
					message: 'Template type must be task, chore, or habit'
				},
				{ status: 400 }
			);
		}
		templateType = parsed.data;
	}

	const sql = locals.db ?? getDb();
	const templates = await listTemplates(templateType, sql);

	return json({ templates });
};
