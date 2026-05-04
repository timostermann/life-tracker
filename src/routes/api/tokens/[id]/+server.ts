import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { deleteApiToken } from '$lib/server/db/queries';

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const id = Number(params.id);
	if (!Number.isInteger(id) || id < 1) {
		return json({ error: 'Invalid token id' }, { status: 400 });
	}

	const sql = getDb();
	const deleted = await deleteApiToken(id, user.id, sql);
	if (!deleted) {
		return json({ error: 'Token not found' }, { status: 404 });
	}

	return json({
		toast: 'success',
		message: 'API token revoked'
	});
};
