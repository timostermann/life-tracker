import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { listUsers } from '$lib/server/db/queries';
import type { Db } from '$lib/server/db/queries/utils';

export const GET: RequestHandler = async ({ locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const db = (locals as { db?: Db }).db ?? getDb();
	const users = listUsers(db);

	return json({ users });
};
