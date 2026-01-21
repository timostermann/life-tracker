import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';

export const GET: RequestHandler = async () => {
	try {
		// Check database connectivity
		const db = getDb();
		db.prepare('SELECT 1').get();

		return json(
			{
				status: 'ok',
				timestamp: new Date().toISOString(),
				database: 'connected'
			},
			{ status: 200 }
		);
	} catch (error) {
		return json(
			{
				status: 'error',
				timestamp: new Date().toISOString(),
				database: 'disconnected',
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 503 }
		);
	}
};
