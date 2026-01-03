import type { Handle } from '@sveltejs/kit';

import { getDb } from '$lib/server/db';

// Initialize DB + run migrations when the server module loads.
getDb();

export const handle: Handle = async ({ event, resolve }) => {
	return resolve(event);
};
