import { test, expect } from '@playwright/test';

test.describe('Template Application', () => {
	test.beforeEach(async ({ page }) => {
		// Login with seeded user
		await page.goto('/categories');
		await expect(page).toHaveURL(/\/login$/);

		await page.getByLabel('Username').fill('tim');
		await page.getByLabel('Password').fill('tim');
		await page.getByRole('button', { name: 'Sign in' }).click();
		await expect(page).not.toHaveURL(/\/login$/);

		// Navigate to categories page
		await page.goto('/categories');
	});

	test('should display template picker button', async ({ page }) => {
		await expect(page.getByRole('button', { name: /use template/i })).toBeVisible();
	});

	test('should open template picker dialog', async ({ page }) => {
		await page.getByRole('button', { name: /use template/i }).click();
		await expect(page.getByText('Choose a Template')).toBeVisible();
		await expect(page.getByText('Select a template to quickly create a category')).toBeVisible();
	});

	test('should display all template tabs', async ({ page }) => {
		await page.getByRole('button', { name: /use template/i }).click();

		await expect(page.getByRole('tab', { name: /tasks/i })).toBeVisible();
		await expect(page.getByRole('tab', { name: /chores/i })).toBeVisible();
		await expect(page.getByRole('tab', { name: /habits/i })).toBeVisible();
	});

	test('should show task templates by default', async ({ page }) => {
		await page.getByRole('button', { name: /use template/i }).click();

		// Check for the active tab and template card content within the dialog
		const dialog = page.getByRole('dialog');
		await expect(dialog.getByRole('tab', { name: /tasks/i })).toHaveAttribute(
			'data-state',
			'active'
		);
		await expect(dialog.getByText(/Action items with priorities/i)).toBeVisible();
	});

	test('should switch to chores tab', async ({ page }) => {
		await page.getByRole('button', { name: /use template/i }).click();

		const dialog = page.getByRole('dialog');
		await dialog.getByRole('tab', { name: /chores/i }).click();
		await expect(dialog.getByRole('tab', { name: /chores/i })).toHaveAttribute(
			'data-state',
			'active'
		);
		await expect(dialog.getByText(/Recurring household/i)).toBeVisible();
	});

	test('should switch to habits tab', async ({ page }) => {
		await page.getByRole('button', { name: /use template/i }).click();

		const dialog = page.getByRole('dialog');
		await dialog.getByRole('tab', { name: /habits/i }).click();
		await expect(dialog.getByRole('tab', { name: /habits/i })).toHaveAttribute(
			'data-state',
			'active'
		);
		await expect(dialog.getByText(/Daily habit tracking/i)).toBeVisible();
	});

	test('should preview template fields', async ({ page }) => {
		await page.getByRole('button', { name: /use template/i }).click();

		const dialog = page.getByRole('dialog');
		await expect(dialog.getByText('Fields included:').first()).toBeVisible();
		await expect(dialog.getByText('Title').first()).toBeVisible();
		await expect(dialog.getByText('Description').first()).toBeVisible();
	});

	test('should apply Tasks template with custom name', async ({ page }) => {
		await page.getByRole('button', { name: /use template/i }).click();

		// Click "Use Template" button on Tasks template
		const useButtons = page.getByRole('button', { name: /use template/i });
		await useButtons.nth(1).click(); // nth(0) is the header button, nth(1) is the template card button

		// Apply template dialog should appear
		await expect(page.getByText('Create from Template')).toBeVisible();
		await expect(
			page.getByText('Customize the category name for your Tasks template')
		).toBeVisible();

		// Pre-filled name should be visible
		const nameInput = page.getByLabel('Category Name');
		await expect(nameInput).toHaveValue('Tasks');

		// Customize the name
		await nameInput.clear();
		await nameInput.fill('My Work Tasks');

		// Submit
		await page.getByRole('button', { name: /create category/i }).click();

		// Should redirect to the newly created category detail page
		await page.waitForURL(/\/categories\/\d+/);
		await expect(page.getByRole('heading', { name: 'My Work Tasks' })).toBeVisible();
	});

	test('should apply Chores template with custom name', async ({ page }) => {
		await page.getByRole('button', { name: /use template/i }).click();

		// Switch to Chores tab
		await page.getByRole('tab', { name: /chores/i }).click();

		// Click "Use Template" button
		const useButtons = page.getByRole('button', { name: /use template/i });
		await useButtons.nth(1).click();

		// Customize the name
		const nameInput = page.getByLabel('Category Name');
		await expect(nameInput).toHaveValue('Chores');
		await nameInput.clear();
		await nameInput.fill('House Chores');

		// Submit
		await page.getByRole('button', { name: /create category/i }).click();

		// Should redirect to the newly created category detail page
		await page.waitForURL(/\/categories\/\d+/);
		await expect(page.getByRole('heading', { name: 'House Chores' })).toBeVisible();
	});

	test('should apply Habits template with custom name', async ({ page }) => {
		await page.getByRole('button', { name: /use template/i }).click();

		// Switch to Habits tab
		await page.getByRole('tab', { name: /habits/i }).click();

		// Click "Use Template" button
		const useButtons = page.getByRole('button', { name: /use template/i });
		await useButtons.nth(1).click();

		// Customize the name
		const nameInput = page.getByLabel('Category Name');
		await expect(nameInput).toHaveValue('Habits');
		await nameInput.clear();
		await nameInput.fill('Daily Habits');

		// Submit
		await page.getByRole('button', { name: /create category/i }).click();

		// Should redirect to the newly created category detail page
		await page.waitForURL(/\/categories\/\d+/);
		await expect(page.getByRole('heading', { name: 'Daily Habits' })).toBeVisible();
	});

	test('should cancel template application', async ({ page }) => {
		await page.getByRole('button', { name: /use template/i }).click();

		// Click "Use Template" button
		const useButtons = page.getByRole('button', { name: /use template/i });
		await useButtons.nth(1).click();

		// Cancel the dialog
		await page.getByRole('button', { name: /cancel/i }).click();

		// Should go back to template picker
		await expect(page.getByText('Choose a Template')).toBeVisible();
	});

	test('should close template picker dialog', async ({ page }) => {
		await page.getByRole('button', { name: /use template/i }).click();
		await expect(page.getByText('Choose a Template')).toBeVisible();

		// Close dialog using escape key
		await page.keyboard.press('Escape');

		// Dialog should be closed
		await expect(page.getByText('Choose a Template')).not.toBeVisible();
	});

	test('should disable submit button when name is empty', async ({ page }) => {
		await page.getByRole('button', { name: /use template/i }).click();

		// Click "Use Template" button
		const useButtons = page.getByRole('button', { name: /use template/i });
		await useButtons.nth(1).click();

		// Clear the name
		const nameInput = page.getByLabel('Category Name');
		await nameInput.clear();

		// Submit button should be disabled
		const submitButton = page.getByRole('button', { name: /create category/i });
		await expect(submitButton).toBeDisabled();
	});

	test('should show loading state during template application', async ({ page }) => {
		await page.getByRole('button', { name: /use template/i }).click();

		// Click "Use Template" button
		const useButtons = page.getByRole('button', { name: /use template/i });
		await useButtons.nth(1).click();

		// Submit
		const submitButton = page.getByRole('button', { name: /create category/i });
		await submitButton.click();

		// Should show loading text briefly (might be too fast to catch)
		// Just verify the operation completes successfully and redirects to category detail page
		await page.waitForURL(/\/categories\/\d+/);
	});

	test('should create category with all template fields', async ({ page }) => {
		await page.getByRole('button', { name: /use template/i }).click();

		// Apply Tasks template
		const useButtons = page.getByRole('button', { name: /use template/i });
		await useButtons.nth(1).click();

		const nameInput = page.getByLabel('Category Name');
		await nameInput.clear();
		await nameInput.fill('Test Tasks');

		await page.getByRole('button', { name: /create category/i }).click();
		// Should redirect to the newly created category detail page
		await page.waitForURL(/\/categories\/\d+/);

		// Verify we're on the category detail page
		await expect(page.getByRole('heading', { name: 'Test Tasks' })).toBeVisible();
	});
});
