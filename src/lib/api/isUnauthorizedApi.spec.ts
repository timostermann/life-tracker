import { describe, expect, it } from 'vitest';

import { isUnauthorizedApi } from './isUnauthorizedApi';

describe('isUnauthorizedApi', () => {
	it('returns true for 401 on /api/*', () => {
		const url = new URL('http://localhost/api/projects');
		expect(isUnauthorizedApi(url, 401)).toBe(true);
	});

	it('returns false for /api/auth/*', () => {
		const url = new URL('http://localhost/api/auth/login');
		expect(isUnauthorizedApi(url, 401)).toBe(false);
	});

	it('returns false for non-401', () => {
		const url = new URL('http://localhost/api/projects');
		expect(isUnauthorizedApi(url, 500)).toBe(false);
	});
});
