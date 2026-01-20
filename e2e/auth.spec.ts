import { expect, test } from '@playwright/test';

test('redirects to login, logs in, persists session, logs out', async ({ page }) => {
	await page.goto('/');
	await expect(page).toHaveURL(/\/login$/);

	await page.getByLabel('Username').fill('tim');
	await page.getByLabel('Password').fill('tim');
	await page.getByRole('button', { name: 'Sign in' }).click();

	// We should now be authenticated and able to access protected pages.
	await expect(page).not.toHaveURL(/\/login$/);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Dashboard');

	// Verify session on API
	const me = await page.request.get('/api/auth/me');
	expect(me.status()).toBe(200);

	// Logout and ensure subsequent access is blocked
	const logout = await page.request.post('/api/auth/logout');
	expect(logout.status()).toBe(200);

	await page.goto('/');
	await expect(page).toHaveURL(/\/login$/);
});
