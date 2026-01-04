import { Lucia, TimeSpan } from 'lucia';
import { BetterSqlite3Adapter } from '@lucia-auth/adapter-sqlite';
import type { Cookies } from '@sveltejs/kit';

import { env } from '$env/dynamic/private';
import { getDb } from '$lib/server/db';

function parseBool(v: string | undefined): boolean | undefined {
	if (v == null) return undefined;
	const n = v.trim().toLowerCase();
	if (n === '1' || n === 'true' || n === 'yes' || n === 'on') return true;
	if (n === '0' || n === 'false' || n === 'no' || n === 'off') return false;
	return undefined;
}

function resolveSecureCookie(): boolean {
	const configured = parseBool(env.AUTH_COOKIE_SECURE);
	return configured ?? import.meta.env.PROD;
}

const adapter = new BetterSqlite3Adapter(getDb(), {
	user: 'users',
	session: 'sessions'
});

export const lucia = new Lucia(adapter, {
	sessionExpiresIn: new TimeSpan(7, 'd'),
	getUserAttributes: (attributes) => {
		// Do not expose password_hash to app code
		return {
			username: attributes.username
		};
	},
	sessionCookie: {
		attributes: {
			secure: resolveSecureCookie()
		}
	}
});

declare module 'lucia' {
	// Lucia relies on interface merging for module augmentation.
	// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: {
			username: string;
			password_hash: string;
			created_at: string;
			updated_at: string;
		};
		DatabaseSessionAttributes: Record<string, never>;
	}
}

export function setLuciaSessionCookie(cookies: Cookies, sessionId: string) {
	const cookie = lucia.createSessionCookie(sessionId);
	cookies.set(cookie.name, cookie.value, { path: '/', ...cookie.attributes });
}

export function clearLuciaSessionCookie(cookies: Cookies) {
	const cookie = lucia.createBlankSessionCookie();
	cookies.set(cookie.name, cookie.value, { path: '/', ...cookie.attributes });
}
