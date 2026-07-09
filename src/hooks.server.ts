import * as Sentry from '@sentry/sveltekit';
import { handleErrorWithSentry, sentryHandle } from '@sentry/sveltekit';
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { redirect } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { lucia, clearLuciaSessionCookie, setLuciaSessionCookie } from '$lib/server/auth';
import { ensureSeedUsers } from '$lib/server/auth/seed';
import { getUserById, resolveUserFromBearerToken } from '$lib/server/db/queries';

Sentry.init({
	dsn: process.env.PUBLIC_SENTRY_DSN,
	tracesSampleRate: 0.05,
	environment: process.env.NODE_ENV
});

// Initialize DB + run migrations when the server module loads.
getDb();
// Seed initial users (idempotent) on server startup.
if (!process.env.VITEST) {
	await ensureSeedUsers();
}

const appHandle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get(lucia.sessionCookieName);

	if (!sessionId) {
		event.locals.user = null;
		event.locals.session = null;
	} else {
		const { session, user } = await lucia.validateSession(sessionId);

		// Refresh cookie when Lucia marks the session as "fresh"
		if (session?.fresh) {
			setLuciaSessionCookie(event.cookies, session.id);
		}

		// Clear cookie if session is invalid/expired
		if (!session) {
			clearLuciaSessionCookie(event.cookies);
		}

		event.locals.session = session ?? null;
		if (session && user) {
			const userId = Number(session.userId);
			const dbUser = getUserById(userId);
			if (dbUser) {
				event.locals.user = { id: dbUser.id, username: dbUser.username };
			} else {
				// User deleted but session exists => treat as invalid.
				event.locals.user = null;
				event.locals.session = null;
				clearLuciaSessionCookie(event.cookies);
			}
		} else {
			event.locals.user = null;
		}
	}

	if (!event.locals.user) {
		const authHeader = event.request.headers.get('authorization');
		if (authHeader?.startsWith('Bearer ')) {
			const raw = authHeader.slice(7).trim();
			if (raw) {
				const tokenUser = resolveUserFromBearerToken(raw);
				if (tokenUser) {
					event.locals.user = tokenUser;
				}
			}
		}
	}

	const pathname = event.url.pathname;
	const isPublic =
		pathname === '/login' ||
		pathname.startsWith('/api/auth/') ||
		pathname === '/api/health' ||
		pathname.startsWith('/_app/') ||
		pathname.startsWith('/favicon') ||
		pathname === '/robots.txt' ||
		pathname === '/sitemap.xml';

	if (pathname === '/login' && event.locals.user) {
		throw redirect(303, '/');
	}
	if (!isPublic && !event.locals.user) {
		// For API calls, return 401 so the client can show a toast.
		if (pathname.startsWith('/api/')) {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), {
				status: 401,
				headers: { 'content-type': 'application/json' }
			});
		}
		throw redirect(303, '/login');
	}

	return resolve(event);
};

export const handle = sequence(sentryHandle(), appHandle);
export const handleError = handleErrorWithSentry();
