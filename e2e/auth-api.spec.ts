import { test, expect } from './fixtures';

test('auth API: login -> me -> logout -> me=401', async ({ request }) => {
	const login = await request.post('/api/auth/login', {
		data: { username: 'tim', password: 'tim' }
	});
	expect(login.status()).toBe(200);

	const me1 = await request.get('/api/auth/me');
	expect(me1.status()).toBe(200);
	await expect(me1.json()).resolves.toMatchObject({ user: { username: 'tim' } });

	const logout = await request.post('/api/auth/logout');
	expect(logout.status()).toBe(200);

	const me2 = await request.get('/api/auth/me');
	expect(me2.status()).toBe(401);
});

test('auth API: invalid login returns 401', async ({ request }) => {
	const res = await request.post('/api/auth/login', {
		data: { username: 'tim', password: 'wrong' }
	});
	expect(res.status()).toBe(401);
});
