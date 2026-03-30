import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createApiTokenSchema } from '$lib/schemas';
import { getDb } from '$lib/server/db';
import { createApiToken, listUserApiTokens } from '$lib/server/db/queries';
import type { Db } from '$lib/server/db/queries/utils';

function dbFromLocals(locals: App.Locals): Db {
	return locals.db ?? getDb();
}

export const GET: RequestHandler = async ({ locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const tokens = listUserApiTokens(user.id, dbFromLocals(locals));
	return json({ tokens });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	const parsed = createApiTokenSchema.safeParse(body);
	if (!parsed.success) {
		return json(
			{
				error: 'Invalid input',
				issues: parsed.error.flatten()
			},
			{ status: 400 }
		);
	}

	const created = createApiToken(user.id, parsed.data.name, dbFromLocals(locals));
	return json({
		id: created.id,
		name: created.name,
		token: created.token,
		created_at: created.created_at
	});
};
