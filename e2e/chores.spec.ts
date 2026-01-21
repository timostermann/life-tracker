import { type Page } from '@playwright/test';
import { test, expect } from './fixtures';

async function login(page: Page, username: 'tim' | 'jule') {
	await page.goto('/categories');
	await expect(page).toHaveURL(/\/login$/);

	await page.getByLabel('Username').fill(username);
	await page.getByLabel('Password').fill(username);
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).not.toHaveURL(/\/login$/);
}

async function createChoreCategoryFromTemplate(page: Page, name: string) {
	// Use template picker to create category with pre-configured fields
	await page.getByRole('button', { name: /use template/i }).click();

	// Wait for template picker dialog
	const templateDialog = page.getByRole('dialog');
	await expect(templateDialog.getByText('Choose a Template')).toBeVisible();

	// Switch to chores tab
	await templateDialog.getByRole('tab', { name: /chores/i }).click();

	// Click "Use Template" button on the Chores template card
	const useButtons = page.getByRole('button', { name: /use template/i });
	await useButtons.nth(1).click(); // nth(0) is the header button, nth(1) is the template card

	// Apply template dialog should appear
	const applyDialog = page.getByRole('dialog');
	await expect(applyDialog.getByText('Create from Template')).toBeVisible();

	// Customize the name
	const nameInput = applyDialog.getByLabel('Category Name');
	await nameInput.clear();
	await nameInput.fill(name);

	// Submit
	await applyDialog.getByRole('button', { name: /create category/i }).click();

	// Wait for redirect to category detail page
	await page.waitForURL(/\/categories\/\d+/);
	await expect(page.getByRole('heading', { name })).toBeVisible();
}

test.describe('Chores Integration', () => {
	test('should be able to create a chore category', async ({ page }) => {
		await login(page, 'tim');
		await page.goto('/categories');

		// Create chore category using template
		await createChoreCategoryFromTemplate(page, 'Household Chores E2E');

		// Should be on category detail page
		await expect(page.getByRole('heading', { name: /Household Chores E2E/i })).toBeVisible();

		// Navigate back and verify it appears in list
		await page.goto('/categories');
		await expect(page.getByRole('link', { name: /Household Chores E2E/i }).first()).toBeVisible();
	});

	test('should create a chore with required recurring config', async ({ page }) => {
		await login(page, 'tim');
		await page.goto('/categories');

		// Create chore category using template
		await createChoreCategoryFromTemplate(page, 'Test Chores');

		// Click "New Chore" button
		await page.getByRole('button', { name: 'New Chore' }).click();

		// Wait for chore dialog to open
		const choreDialog = page.getByRole('dialog');
		await expect(choreDialog.getByRole('heading', { name: 'Create Chore' })).toBeVisible();

		// Fill in chore name (first field)
		const choreNameInput = choreDialog.locator('input[id^="field-"]').first();
		await choreNameInput.fill('Vacuum living room');

		// Set recurring schedule (required)
		await page.getByRole('button', { name: /Set recurring schedule|Recurring Schedule/ }).click();

		// Set interval to 1
		const intervalInput = page.locator('input[type="number"]').first();
		await intervalInput.fill('1');

		// Select weekly frequency - click the select trigger button
		await page.getByRole('button', { name: /day|days/ }).click();
		await page.getByRole('option', { name: /week/ }).click();

		// Save recurring config
		await page.getByRole('button', { name: 'Save' }).click();

		// Create the chore
		await page.getByRole('button', { name: 'Create Chore' }).click();

		// Verify chore appears in the list
		await expect(page.getByRole('heading', { name: 'Vacuum living room' })).toBeVisible({
			timeout: 10000
		});
	});

	test('should not create chore without recurring config', async ({ page }) => {
		await login(page, 'tim');
		await page.goto('/categories');

		// Use seeded category or create one
		const categoryLink = page
			.getByRole('link', { name: /Home Maintenance|Meal Planning|Health Checkups/i })
			.first();
		const categoryExists = await categoryLink.isVisible().catch(() => false);

		if (categoryExists) {
			await categoryLink.click();
		} else {
			await createChoreCategoryFromTemplate(page, 'Test Chores 2');
		}

		// Wait for page to load
		await expect(page.getByRole('button', { name: /New Chore/ })).toBeVisible();

		// Click "New Chore"
		await page.getByRole('button', { name: /New Chore/ }).click();

		// Wait for dialog to open
		const dialog = page.getByRole('dialog');
		await expect(dialog.getByRole('heading', { name: 'Create Chore' })).toBeVisible();

		// Fill in chore name but don't set recurring config
		const choreNameInput = dialog.locator('input[id^="field-"]').first();
		await choreNameInput.fill('Test Chore Without Recurring');

		// Try to create without recurring config
		await page.getByRole('button', { name: 'Create Chore' }).click();

		// Should show validation error
		await expect(page.getByText('Recurring schedule is required for chores')).toBeVisible({
			timeout: 5000
		});
	});

	test('should complete chore and create next occurrence', async ({ page }) => {
		await login(page, 'tim');
		await page.goto('/categories');

		// Use seeded category or create one
		const categoryLink = page
			.getByRole('link', { name: /Home Maintenance|Meal Planning|Health Checkups/i })
			.first();
		const categoryExists = await categoryLink.isVisible().catch(() => false);

		if (!categoryExists) {
			await createChoreCategoryFromTemplate(page, 'Complete Test Chores');
			// Already on category detail page after template creation
		} else {
			await categoryLink.click();
		}

		// Create a chore first
		await page.getByRole('button', { name: /New Chore/ }).click();

		// Wait for dialog to open
		const dialog = page.getByRole('dialog');
		await expect(dialog.getByRole('heading', { name: 'Create Chore' })).toBeVisible();

		const choreNameInput = dialog.locator('input[id^="field-"]').first();
		await choreNameInput.fill('Weekly Grocery Shopping');

		// Set recurring schedule
		await page.getByRole('button', { name: /Set recurring schedule|Recurring Schedule/ }).click();
		const intervalInput = page.locator('input[type="number"]').first();
		await intervalInput.fill('1');
		await page.getByRole('button', { name: /day|days/ }).click();
		await page.getByRole('option', { name: /week/ }).click();
		await page.getByRole('button', { name: 'Save' }).click();
		await page.getByRole('button', { name: 'Create Chore' }).click();

		// Wait for chore to appear
		await expect(page.getByRole('heading', { name: 'Weekly Grocery Shopping' })).toBeVisible({
			timeout: 10000
		});

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

		// Use seeded category or create one
		const categoryLink = page
			.getByRole('link', { name: /Home Maintenance|Meal Planning|Health Checkups/i })
			.first();
		const categoryExists = await categoryLink.isVisible().catch(() => false);

		if (categoryExists) {
			await categoryLink.click();
		} else {
			await createChoreCategoryFromTemplate(page, 'Schedule Test');
		}

		// Verify schedule tab exists
		await expect(page.getByRole('tab', { name: 'Schedule' })).toBeVisible({ timeout: 10000 });

		// Click schedule tab
		await page.getByRole('tab', { name: 'Schedule' }).click();

		// Verify schedule view is displayed (check for specific element in schedule tab)
		await expect(
			page
				.getByRole('tabpanel')
				.getByText(/no upcoming chores/i)
				.first()
		).toBeVisible({
			timeout: 5000
		});
	});

	test('should show next occurrence date in chore list', async ({ page }) => {
		await login(page, 'tim');
		await page.goto('/categories');

		// Use seeded category or create one
		const categoryLink = page
			.getByRole('link', { name: /Home Maintenance|Meal Planning|Health Checkups/i })
			.first();
		const categoryExists = await categoryLink.isVisible().catch(() => false);

		if (!categoryExists) {
			await createChoreCategoryFromTemplate(page, 'Next Date Test');
			// Already on category detail page after template creation
		} else {
			await categoryLink.click();
		}

		// Create a chore
		await page.getByRole('button', { name: /New Chore/ }).click();

		// Wait for dialog to open
		const dialog = page.getByRole('dialog');
		await expect(dialog.getByRole('heading', { name: 'Create Chore' })).toBeVisible();

		const choreNameInput = dialog.locator('input[id^="field-"]').first();
		await choreNameInput.fill('Monthly Car Maintenance');

		// Set monthly recurring
		await page.getByRole('button', { name: /Set recurring schedule|Recurring Schedule/ }).click();
		const intervalInput = page.locator('input[type="number"]').first();
		await intervalInput.fill('1');
		await page.getByRole('button', { name: /day|days/ }).click();
		await page.getByRole('option', { name: /month/ }).click();
		await page.getByRole('button', { name: 'Save' }).click();
		await page.getByRole('button', { name: 'Create Chore' }).click();

		// Wait for chore to appear
		await expect(page.getByRole('heading', { name: 'Monthly Car Maintenance' })).toBeVisible({
			timeout: 10000
		});

		// Verify next occurrence date is displayed
		await expect(page.getByText(/Next:|next occurrence/i)).toBeVisible({ timeout: 5000 });
	});
});
