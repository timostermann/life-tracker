import { expect, test, type Page } from '@playwright/test';

async function login(page: Page, username: 'tim' | 'jule') {
	await page.goto('/categories');
	await expect(page).toHaveURL(/\/login$/);

	await page.getByLabel('Username').fill(username);
	await page.getByLabel('Password').fill(username);
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).not.toHaveURL(/\/login$/);
}

test.describe('Chores Integration', () => {
	test('should be able to create a chore category', async ({ page }) => {
		await login(page, 'tim');

		await page.goto('/categories');

		// Create chore category
		await page.getByRole('button', { name: 'New Category' }).click();
		await page.locator('#name').fill('Household Chores E2E');
		await page.locator('#template-type').click();
		await page.getByRole('option', { name: 'Chore' }).click();

		await page.getByRole('button', { name: 'Create Category' }).click();

		await expect(page.getByText('Household Chores E2E')).toBeVisible({ timeout: 10000 });
	});

	test('should create a chore with required recurring config', async ({ page }) => {
		await login(page, 'tim');

		await page.goto('/categories');

		// Create chore category first
		await page.getByRole('button', { name: 'New Category' }).click();
		await page.locator('#name').fill('Test Chores');
		await page.locator('#template-type').click();
		await page.getByRole('option', { name: 'Chore' }).click();
		await page.getByRole('button', { name: 'Create Category' }).click();

		// Wait for category to appear and click it
		await expect(page.getByText('Test Chores')).toBeVisible({ timeout: 10000 });
		await page.getByText('Test Chores').click();

		// Verify we're on the chore category page
		await expect(page.getByRole('heading', { name: 'Test Chores' })).toBeVisible();

		// Click "New Chore" button
		await page.getByRole('button', { name: 'New Chore' }).click();

		// Fill in chore name (first field)
		const choreNameInput = page.locator('input[id^="field-"]').first();
		await choreNameInput.fill('Vacuum living room');

		// Set recurring schedule (required)
		await page.getByRole('button', { name: /Set recurring schedule|Recurring Schedule/ }).click();

		// Set interval to 1
		const intervalInput = page.locator('input[type="number"]').first();
		await intervalInput.fill('1');

		// Select weekly frequency
		await page.getByRole('combobox').click();
		await page.getByRole('option', { name: /week/ }).click();

		// Save recurring config
		await page.getByRole('button', { name: 'Save' }).click();

		// Create the chore
		await page.getByRole('button', { name: 'Create Chore' }).click();

		// Verify chore appears in the list
		await expect(page.getByText('Vacuum living room')).toBeVisible({ timeout: 10000 });
	});

	test('should not create chore without recurring config', async ({ page }) => {
		await login(page, 'tim');

		await page.goto('/categories');

		// Find or create a chore category
		const categoryLink = page.getByText(/Home Maintenance|Meal Planning|Health Checkups/).first();
		if (await categoryLink.isVisible().catch(() => false)) {
			await categoryLink.click();
		} else {
			// Create one if it doesn't exist
			await page.getByRole('button', { name: 'New Category' }).click();
			await page.locator('#name').fill('Test Chores');
			await page.locator('#template-type').click();
			await page.getByRole('option', { name: 'Chore' }).click();
			await page.getByRole('button', { name: 'Create Category' }).click();
			await expect(page.getByText('Test Chores')).toBeVisible({ timeout: 10000 });
			await page.getByText('Test Chores').click();
		}

		// Wait for page to load
		await expect(page.getByRole('button', { name: /New Chore/ })).toBeVisible();

		// Click "New Chore"
		await page.getByRole('button', { name: /New Chore/ }).click();

		// Fill in chore name but don't set recurring config
		const choreNameInput = page.locator('input[id^="field-"]').first();
		await choreNameInput.fill('Test Chore Without Recurring');

		// Try to create without recurring config
		await page.getByRole('button', { name: 'Create Chore' }).click();

		// Should show validation error
		await expect(page.getByText(/Recurring schedule is required|recurring/i)).toBeVisible({
			timeout: 5000
		});
	});

	test('should complete chore and create next occurrence', async ({ page }) => {
		await login(page, 'tim');

		await page.goto('/categories');

		// Find a chore category or create one
		let categoryLink = page.getByText(/Home Maintenance|Meal Planning|Health Checkups/).first();
		if (!(await categoryLink.isVisible().catch(() => false))) {
			await page.getByRole('button', { name: 'New Category' }).click();
			await page.locator('#name').fill('Complete Test Chores');
			await page.locator('#template-type').click();
			await page.getByRole('option', { name: 'Chore' }).click();
			await page.getByRole('button', { name: 'Create Category' }).click();
			await expect(page.getByText('Complete Test Chores')).toBeVisible({ timeout: 10000 });
			categoryLink = page.getByText('Complete Test Chores');
		}

		await categoryLink.click();

		// Create a chore first
		await page.getByRole('button', { name: /New Chore/ }).click();
		const choreNameInput = page.locator('input[id^="field-"]').first();
		await choreNameInput.fill('Weekly Grocery Shopping');

		// Set recurring schedule
		await page.getByRole('button', { name: /Set recurring schedule|Recurring Schedule/ }).click();
		const intervalInput = page.locator('input[type="number"]').first();
		await intervalInput.fill('1');
		await page.getByRole('combobox').click();
		await page.getByRole('option', { name: /week/ }).click();
		await page.getByRole('button', { name: 'Save' }).click();
		await page.getByRole('button', { name: 'Create Chore' }).click();

		// Wait for chore to appear
		await expect(page.getByText('Weekly Grocery Shopping')).toBeVisible({ timeout: 10000 });

		// Complete the chore
		const completeButton = page
			.locator('[aria-label="Complete chore"]')
			.or(page.locator('button:has-text("Complete")'))
			.first();
		await completeButton.click();

		// Verify success toast appears
		await expect(page.getByText(/completed|next occurrence/i)).toBeVisible({ timeout: 5000 });
	});

	test('should display schedule view with upcoming chores', async ({ page }) => {
		await login(page, 'tim');

		await page.goto('/categories');

		// Find a chore category
		const categoryLink = page.getByText(/Home Maintenance|Meal Planning|Health Checkups/).first();
		if (await categoryLink.isVisible().catch(() => false)) {
			await categoryLink.click();
		} else {
			// Create one if needed
			await page.getByRole('button', { name: 'New Category' }).click();
			await page.locator('#name').fill('Schedule Test');
			await page.locator('#template-type').click();
			await page.getByRole('option', { name: 'Chore' }).click();
			await page.getByRole('button', { name: 'Create Category' }).click();
			await expect(page.getByText('Schedule Test')).toBeVisible({ timeout: 10000 });
			await page.getByText('Schedule Test').click();
		}

		// Verify schedule tab exists
		await expect(page.getByRole('tab', { name: 'Schedule' })).toBeVisible({ timeout: 10000 });

		// Click schedule tab
		await page.getByRole('tab', { name: 'Schedule' }).click();

		// Verify schedule view is displayed
		await expect(page.getByText(/upcoming|schedule|no upcoming chores/i)).toBeVisible({
			timeout: 5000
		});
	});

	test('should show next occurrence date in chore list', async ({ page }) => {
		await login(page, 'tim');

		await page.goto('/categories');

		// Find or create a chore category
		let categoryLink = page.getByText(/Home Maintenance|Meal Planning|Health Checkups/).first();
		if (!(await categoryLink.isVisible().catch(() => false))) {
			await page.getByRole('button', { name: 'New Category' }).click();
			await page.locator('#name').fill('Next Date Test');
			await page.locator('#template-type').click();
			await page.getByRole('option', { name: 'Chore' }).click();
			await page.getByRole('button', { name: 'Create Category' }).click();
			await expect(page.getByText('Next Date Test')).toBeVisible({ timeout: 10000 });
			categoryLink = page.getByText('Next Date Test');
		}

		await categoryLink.click();

		// Create a chore
		await page.getByRole('button', { name: /New Chore/ }).click();
		const choreNameInput = page.locator('input[id^="field-"]').first();
		await choreNameInput.fill('Monthly Car Maintenance');

		// Set monthly recurring
		await page.getByRole('button', { name: /Set recurring schedule|Recurring Schedule/ }).click();
		const intervalInput = page.locator('input[type="number"]').first();
		await intervalInput.fill('1');
		await page.getByRole('combobox').click();
		await page.getByRole('option', { name: /month/ }).click();
		await page.getByRole('button', { name: 'Save' }).click();
		await page.getByRole('button', { name: 'Create Chore' }).click();

		// Wait for chore to appear
		await expect(page.getByText('Monthly Car Maintenance')).toBeVisible({ timeout: 10000 });

		// Verify next occurrence date is displayed
		await expect(page.getByText(/Next:|next occurrence/i)).toBeVisible({ timeout: 5000 });
	});
});
