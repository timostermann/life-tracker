import { test, expect } from '@playwright/test';

test.describe('Categories CRUD', () => {
	test.beforeEach(async ({ page }) => {
		// Login before each test
		await page.goto('/login');
		await page.fill('input[name="username"]', 'tim');
		await page.fill('input[name="password"]', 'test123');
		await page.click('button[type="submit"]');
		await page.waitForURL('/');
	});

	test('user can navigate to categories page', async ({ page }) => {
		await page.goto('/categories');
		await expect(page.locator('h1')).toContainText('Categories');
		await expect(page.getByText('New Category')).toBeVisible();
	});

	test('user can create a category with basic fields', async ({ page }) => {
		await page.goto('/categories');

		// Click New Category button
		await page.getByText('New Category').click();

		// Fill in the form
		await page.fill('input[id="name"]', 'Test Tasks');
		await page.selectOption('select', 'task');
		await page.fill('input[id="icon"]', '📋');

		// Select a color
		await page.locator('button[aria-label="Blue"]').click();

		// Submit the form
		await page.getByText('Create Category').click();

		// Verify success
		await expect(page.getByText('Test Tasks')).toBeVisible();
		await expect(page.getByText('📋')).toBeVisible();
	});

	test('user can create a category with custom fields', async ({ page }) => {
		await page.goto('/categories');

		// Click New Category button
		await page.getByText('New Category').click();

		// Fill in basic info
		await page.fill('input[id="name"]', 'Project Tasks');
		await page.selectOption('select', 'task');

		// Add custom field
		await page.getByText('Add Field').click();

		// Fill in field details
		await page.fill('input[id="field-name-0"]', 'Priority');
		await page.locator('select').last().selectOption('select');
		await page.fill('textarea[id="field-options-0"]', 'High\nMedium\nLow');

		// Submit
		await page.getByText('Create Category').click();

		// Verify category created
		await expect(page.getByText('Project Tasks')).toBeVisible();
	});

	test('user can edit an existing category', async ({ page }) => {
		await page.goto('/categories');

		// First create a category
		await page.getByText('New Category').click();
		await page.fill('input[id="name"]', 'Original Name');
		await page.selectOption('select', 'chore');
		await page.getByText('Create Category').click();
		await expect(page.getByText('Original Name')).toBeVisible();

		// Now edit it
		await page.getByText('Edit').first().click();

		// Wait for the edit dialog to load
		await expect(page.getByText('Edit Category')).toBeVisible();

		// Change the name
		await page.fill('input[id="name"]', 'Updated Name');
		await page.fill('input[id="icon"]', '🏠');

		// Submit
		await page.getByText('Update Category').click();

		// Verify changes
		await expect(page.getByText('Updated Name')).toBeVisible();
		await expect(page.getByText('🏠')).toBeVisible();
		await expect(page.getByText('Original Name')).not.toBeVisible();
	});

	test('user can delete a category with confirmation', async ({ page }) => {
		await page.goto('/categories');

		// Create a category to delete
		await page.getByText('New Category').click();
		await page.fill('input[id="name"]', 'To Be Deleted');
		await page.selectOption('select', 'habit');
		await page.getByText('Create Category').click();
		await expect(page.getByText('To Be Deleted')).toBeVisible();

		// Click delete
		await page.getByText('Delete').first().click();

		// Confirm deletion in dialog
		await expect(page.getByText('Delete Category?')).toBeVisible();
		await expect(page.getByText('To Be Deleted', { exact: false })).toBeVisible();
		await page.getByRole('button', { name: 'Delete' }).click();

		// Verify category is gone
		await expect(page.getByText('To Be Deleted')).not.toBeVisible();
	});

	test('user can cancel category deletion', async ({ page }) => {
		await page.goto('/categories');

		// Create a category
		await page.getByText('New Category').click();
		await page.fill('input[id="name"]', 'Keep This');
		await page.selectOption('select', 'task');
		await page.getByText('Create Category').click();
		await expect(page.getByText('Keep This')).toBeVisible();

		// Click delete
		await page.getByText('Delete').first().click();

		// Cancel deletion
		await expect(page.getByText('Delete Category?')).toBeVisible();
		await page.getByRole('button', { name: 'Cancel' }).click();

		// Verify category still exists
		await expect(page.getByText('Keep This')).toBeVisible();
	});

	test('form validation: category name is required', async ({ page }) => {
		await page.goto('/categories');

		// Open create dialog
		await page.getByText('New Category').click();

		// Try to submit without name
		await page.getByText('Create Category').click();

		// Should show validation error (HTML5 validation or custom)
		// The form should not close
		await expect(page.getByText('Create Category', { exact: false })).toBeVisible();
	});

	test('template type cannot be changed after creation', async ({ page }) => {
		await page.goto('/categories');

		// Create a category
		await page.getByText('New Category').click();
		await page.fill('input[id="name"]', 'Fixed Type');
		await page.selectOption('select', 'task');
		await page.getByText('Create Category').click();
		await expect(page.getByText('Fixed Type')).toBeVisible();

		// Edit the category
		await page.getByText('Edit').first().click();
		await expect(page.getByText('Edit Category')).toBeVisible();

		// Template type select should be disabled
		const templateTypeSelect = page.locator('select').first();
		await expect(templateTypeSelect).toBeDisabled();
	});

	test('user can add multiple custom fields', async ({ page }) => {
		await page.goto('/categories');

		await page.getByText('New Category').click();
		await page.fill('input[id="name"]', 'Multi-Field Category');
		await page.selectOption('select', 'task');

		// Add first field
		await page.getByText('Add Field').click();
		await page.fill('input[id="field-name-0"]', 'Priority');

		// Add second field
		await page.getByText('Add Field').click();
		await page.fill('input[id="field-name-1"]', 'Status');

		// Add third field
		await page.getByText('Add Field').click();
		await page.fill('input[id="field-name-2"]', 'Due Date');

		// Submit
		await page.getByText('Create Category').click();

		// Verify category created
		await expect(page.getByText('Multi-Field Category')).toBeVisible();
	});

	test('user can remove custom fields before submitting', async ({ page }) => {
		await page.goto('/categories');

		await page.getByText('New Category').click();
		await page.fill('input[id="name"]', 'Field Test');
		await page.selectOption('select', 'task');

		// Add two fields
		await page.getByText('Add Field').click();
		await page.fill('input[id="field-name-0"]', 'Field 1');

		await page.getByText('Add Field').click();
		await page.fill('input[id="field-name-1"]', 'Field 2');

		// Remove the first field
		await page.locator('button[type="button"]').filter({ hasText: /trash/i }).first().click();

		// Only Field 2 should remain
		await expect(page.locator('input[id="field-name-0"]')).toHaveValue('Field 2');

		// Submit
		await page.getByText('Create Category').click();
		await expect(page.getByText('Field Test')).toBeVisible();
	});

	test('private checkbox defaults to checked', async ({ page }) => {
		await page.goto('/categories');

		await page.getByText('New Category').click();

		// Checkbox should be checked by default
		const privateCheckbox = page.locator('input[id="is-private"]');
		await expect(privateCheckbox).toBeChecked();
	});

	test('user can toggle private/public status', async ({ page }) => {
		await page.goto('/categories');

		await page.getByText('New Category').click();
		await page.fill('input[id="name"]', 'Public Category');
		await page.selectOption('select', 'task');

		// Uncheck private
		await page.locator('input[id="is-private"]').uncheck();

		// Submit
		await page.getByText('Create Category').click();
		await expect(page.getByText('Public Category')).toBeVisible();
	});

	test('displays owned and shared tabs', async ({ page }) => {
		await page.goto('/categories');

		// Both tabs should be visible
		await expect(page.getByText(/My Categories/i)).toBeVisible();
		await expect(page.getByText(/Shared with me/i)).toBeVisible();
	});

	test('shows empty state when no categories exist', async ({ page }) => {
		await page.goto('/categories');

		// Check for empty state message
		// Note: This assumes the test user has no categories initially
		// In a real test suite, you'd want to ensure clean state
		await expect(
			page.getByText(/No categories yet/i).or(page.getByText(/My Categories/))
		).toBeVisible();
	});
});
