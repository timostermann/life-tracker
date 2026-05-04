import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { loginSchema } from '$lib/schemas';
import { getUserByUsername } from '$lib/server/db/queries';
import { lucia, setLuciaSessionCookie } from '$lib/server/auth';
import { verifyPassword } from '$lib/server/auth/password';
import { createLogger } from '$lib/server/logging';

const logger = createLogger('auth');

export const POST: RequestHandler = async ({ request, cookies }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	const parsed = loginSchema.safeParse(body);
	if (!parsed.success) {
		return json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 });
	}

	const { username, password } = parsed.data;
	const user = await getUserByUsername(username);
	if (!user) {
		logger.info('login failed (unknown user)', { username });
		return json({ error: 'Invalid username or password' }, { status: 401 });
	}

	const ok = await verifyPassword(user.password_hash, password);
	if (!ok) {
		logger.info('login failed (bad password)', { username });
		return json({ error: 'Invalid username or password' }, { status: 401 });
	}

	const session = await lucia.createSession(String(user.id), {});
	setLuciaSessionCookie(cookies, session.id);
	logger.info('login success', { userId: user.id, username: user.username });

	return json({ ok: true });
};
