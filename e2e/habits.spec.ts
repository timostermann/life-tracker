import { type Page } from '@playwright/test';
import { test, expect } from './fixtures';

async function createHabitCategoryFromTemplate(page: Page, name: string) {
	await page.getByRole('button', { name: /use template/i }).click();

	const templateDialog = page.getByRole('dialog');
	await expect(templateDialog.getByText('Choose a Template')).toBeVisible();

	await templateDialog.getByRole('tab', { name: /habits/i }).click();

	const useButtons = page.getByRole('button', { name: /use template/i });
	await useButtons.nth(1).click(); // nth(0) is the header button, nth(1) is the template card

	const applyDialog = page.getByRole('dialog');
	await expect(applyDialog.getByText('Create from Template')).toBeVisible();

	const nameInput = applyDialog.getByLabel('Category Name');
	await nameInput.clear();
	await nameInput.fill(name);

	await applyDialog.getByRole('button', { name: /create category/i }).click();

	await page.waitForURL(/\/categories\/\d+/);
	await expect(page.getByRole('heading', { name })).toBeVisible();
}

test.describe('Habits', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/categories');
		await expect(page).toHaveURL(/\/login$/);

		await page.getByLabel('Username').fill('tim');
		await page.getByLabel('Password').fill('tim');
		await page.getByRole('button', { name: 'Sign in' }).click();
		await expect(page).not.toHaveURL(/\/login$/);

		await page.goto('/categories');
	});

	test('should create a habit', async ({ page }) => {
		await page.goto('/categories');

		await createHabitCategoryFromTemplate(page, 'Fitness Habits');

		await page.getByRole('button', { name: 'New Habit' }).click();

		const habitDialog = page.getByRole('dialog');
		await expect(habitDialog.getByRole('heading', { name: 'Create Habit' })).toBeVisible();

		const nameField = habitDialog.locator('input[id^="field-"]').first();
		await nameField.fill('Test Habit');

		await habitDialog.getByRole('button', { name: 'Create Habit' }).click();

		// Verify habit appears
		await expect(page.getByRole('heading', { name: 'Test Habit' })).toBeVisible();
	});
});
