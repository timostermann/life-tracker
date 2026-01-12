import { expect, test } from '@playwright/test';

async function login(page, username: 'tim' | 'jule') {
	await page.goto('/categories');
	await expect(page).toHaveURL(/\/login$/);

	await page.getByLabel('Username').fill(username);
	await page.getByLabel('Password').fill(username);
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).not.toHaveURL(/\/login$/);

	await page.goto('/categories');
	await expect(page).toHaveURL(/\/categories$/);
}

test('category owner can share and recipient sees it', async ({ page, context }) => {
	await login(page, 'tim');

	// Create a category
	await page.getByRole('button', { name: 'New Category' }).click();
	await page.locator('#name').fill('Shared Category');

	await page.locator('#template-type').click();
	await page.getByRole('option', { name: 'Task' }).click();

	await page.getByRole('button', { name: 'Create Category' }).click();
	await expect(page.getByText('Shared Category')).toBeVisible();

	// Share it
	await page.getByRole('button', { name: 'Share' }).first().click();
	const dialog = page.getByRole('dialog');
	await expect(dialog.getByText(/Share “Shared Category”/)).toBeVisible();

	await dialog.getByText('Select user').click();
	await dialog.getByText('jule').click();

	await dialog.getByRole('button', { name: 'Share' }).click();
	await expect(page.getByText(/Category shared with jule/i)).toBeVisible();

	// Switch user
	await context.clearCookies();
	await login(page, 'jule');

	// Recipient sees it in shared tab
	await page.getByText(/Shared with me/i).click();
	await expect(page.getByText('Shared Category')).toBeVisible();
	await expect(page.getByText(/Shared \(view\)/i)).toBeVisible();
});
