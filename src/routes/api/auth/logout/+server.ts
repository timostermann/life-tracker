import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { lucia, clearLuciaSessionCookie } from '$lib/server/auth';
import { createLogger } from '$lib/server/logging';

const logger = createLogger('auth');

export const POST: RequestHandler = async ({ cookies }) => {
	const sessionId = cookies.get(lucia.sessionCookieName);
	if (sessionId) {
		await lucia.invalidateSession(sessionId);
		logger.info('logout', { sessionId });
	}
	clearLuciaSessionCookie(cookies);
	return json({ ok: true });
};
