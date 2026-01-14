import { expect, test, type Page } from '@playwright/test';

async function login(page: Page, username: 'tim' | 'jule') {
	await page.goto('/categories');
	await expect(page).toHaveURL(/\/login$/);

	await page.getByLabel('Username').fill(username);
	await page.getByLabel('Password').fill(username);
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).not.toHaveURL(/\/login$/);
}

test.describe('Tasks Integration', () => {
	test('should load categories page after login', async ({ page }) => {
		await login(page, 'tim');

		await page.goto('/categories');
		await expect(page).toHaveURL('/categories');
		await expect(page.getByRole('heading', { name: 'Categories' })).toBeVisible();
	});

	test('should be able to create a task category', async ({ page }) => {
		await login(page, 'tim');

		await page.goto('/categories');

		// Create category
		await page.getByRole('button', { name: 'New Category' }).click();
		await page.locator('#name').fill('Tasks E2E Test');
		await page.locator('#template-type').click();
		await page.getByRole('option', { name: 'Task' }).click();

		await page.getByRole('button', { name: 'Create Category' }).click();

		await expect(page.getByText('Tasks E2E Test')).toBeVisible({ timeout: 10000 });
	});

	test('should display task management UI', async ({ page }) => {
		await login(page, 'tim');

		// Navigate to categories
		await page.goto('/categories');

		// Verify the task management interface is available
		await expect(page.getByRole('heading', { name: 'Categories' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'New Category' })).toBeVisible();

		// Verify tabs exist for owned and shared categories
		await expect(page.getByRole('tab', { name: /My Categories/ })).toBeVisible();
		await expect(page.getByRole('tab', { name: /Shared with me/ })).toBeVisible();
	});
});
