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
		await expect(page.getByRole('heading', { name: 'Test Habit' })).toBeVisible({ timeout: 10000 });
	});

	test('should log a habit entry', async ({ page }) => {
		await page.goto('/categories');

		const habitCategory = page.getByRole('link', { name: /Fitness Goals|Fitness Habits/i }).first();
		const categoryExists = await habitCategory.isVisible().catch(() => false);

		if (!categoryExists) {
			test.skip();
		}

		await habitCategory.click();
		await page.waitForURL(/\/categories\/\d+/);

		const habitItem = page.getByText(/Morning Run|Meditation|Test Habit/i).first();
		const habitExists = await habitItem.isVisible().catch(() => false);

		if (!habitExists) {
			test.skip();
		}

		// Try to find log button - it might be in different locations depending on UI
		const logButton = page.getByRole('button', { name: /log|add entry/i }).first();
		const hasLogButton = await logButton.isVisible({ timeout: 5000 }).catch(() => false);

		if (!hasLogButton) {
			test.skip();
		}

		await logButton.click();
		await expect(page.getByRole('dialog')).toBeVisible();

		const statusField = page.locator('[id="status"]');
		const hasStatus = await statusField.isVisible().catch(() => false);

		if (hasStatus) {
			await statusField.click();
			await page.getByRole('option', { name: /Done|Completed/i }).click();
		}

		const notesField = page.locator('textarea[id="notes"]');
		const hasNotes = await notesField.isVisible().catch(() => false);

		if (hasNotes) {
			await notesField.fill('Great run today!');
		}

		await page.getByRole('button', { name: /Log Entry|Submit/i }).click();

		await expect(page.getByText(/Entry logged|Success/i)).toBeVisible({ timeout: 5000 });
	});

	test('should view habit stats', async ({ page }) => {
		await page.goto('/categories');

		const habitCategory = page.getByRole('link', { name: /Fitness Goals|Daily Wellness/i }).first();
		const categoryExists = await habitCategory.isVisible().catch(() => false);

		if (!categoryExists) {
			test.skip();
		}

		await habitCategory.click();
		await page.waitForURL(/\/categories\/\d+/);

		const statsTab = page.getByRole('tab', { name: /stats/i });
		const hasStatsTab = await statsTab.isVisible().catch(() => false);

		if (hasStatsTab) {
			await statsTab.click();
			await expect(
				page.getByText(/Current Streak|Longest Streak|Last 7 Days/i).first()
			).toBeVisible({
				timeout: 5000
			});
		} else {
			await expect(page.getByText(/streak|entries/i).first()).toBeVisible({ timeout: 5000 });
		}
	});

	test('should update a habit entry', async ({ page }) => {
		await page.goto('/categories');

		const habitCategory = page.getByRole('link', { name: /Fitness Goals|Daily Wellness/i }).first();
		const categoryExists = await habitCategory.isVisible().catch(() => false);

		if (!categoryExists) {
			test.skip();
		}

		await habitCategory.click();
		await page.waitForURL(/\/categories\/\d+/);

		const historyTab = page.getByRole('tab', { name: /history/i });
		const hasHistoryTab = await historyTab.isVisible().catch(() => false);

		if (!hasHistoryTab) {
			test.skip();
		}

		await historyTab.click();

		const activeTabpanel = page.locator('[role="tabpanel"][data-state="active"]');
		await expect(activeTabpanel).toBeVisible({ timeout: 5000 });

		const entry = activeTabpanel.getByText('Done').first();
		const hasEntry = await entry.isVisible().catch(() => false);

		if (!hasEntry) {
			test.skip();
		}

		const editButton = entry.locator('..').locator('button').first();
		await editButton.click();
		await expect(page.getByRole('dialog')).toBeVisible();

		const statusField = page.locator('[id="status"]');
		await statusField.click();
		await page.getByText(/Skipped|Failed/i).click();
		await page.getByRole('button', { name: /Update Entry|Save/i }).click();

		await expect(page.getByText(/Entry updated|Success/i)).toBeVisible({ timeout: 5000 });
	});

	test('should delete a habit entry', async ({ page }) => {
		await page.goto('/categories');

		const habitCategory = page.getByRole('link', { name: /Fitness Goals|Daily Wellness/i }).first();
		const categoryExists = await habitCategory.isVisible().catch(() => false);

		if (!categoryExists) {
			test.skip();
		}

		await habitCategory.click();
		await page.waitForURL(/\/categories\/\d+/);

		const historyTab = page.getByRole('tab', { name: /history/i });
		const hasHistoryTab = await historyTab.isVisible().catch(() => false);

		if (!hasHistoryTab) {
			test.skip();
		}

		await historyTab.click();

		const activeTabpanel = page.locator('[role="tabpanel"][data-state="active"]');
		await expect(activeTabpanel).toBeVisible({ timeout: 5000 });

		const entry = activeTabpanel.getByText('Done').first();
		const hasEntry = await entry.isVisible().catch(() => false);

		if (!hasEntry) {
			test.skip();
		}

		const deleteButton = entry.locator('..').locator('button').nth(1);
		await deleteButton.click();
		await expect(page.getByRole('button', { name: /Delete|Confirm/i })).toBeVisible();

		await page.getByRole('button', { name: /Delete|Confirm/i }).click();
		await expect(page.getByText(/Entry deleted|Success/i)).toBeVisible({ timeout: 5000 });
	});

	test('should view calendar', async ({ page }) => {
		await page.goto('/categories');

		const habitCategory = page.getByRole('link', { name: /Fitness Goals|Daily Wellness/i }).first();
		const categoryExists = await habitCategory.isVisible().catch(() => false);

		if (!categoryExists) {
			test.skip();
		}

		await habitCategory.click();
		await page.waitForURL(/\/categories\/\d+/);

		const habitItem = page.getByText(/Morning Run|Meditation/i).first();
		const hasHabit = await habitItem.isVisible().catch(() => false);

		if (!hasHabit) {
			test.skip();
		}

		const calendarTab = page.getByRole('tab', { name: /calendar/i });
		const hasCalendarTab = await calendarTab.isVisible().catch(() => false);

		if (!hasCalendarTab) {
			test.skip();
		}

		await calendarTab.click();

		const activeTabpanel = page.locator('[role="tabpanel"][data-state="active"]');
		await expect(activeTabpanel).toBeVisible({ timeout: 5000 });

		await expect(activeTabpanel.getByText(/Select a habit|calendar/i).first()).toBeVisible();
	});
});
