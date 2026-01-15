import { test, expect } from '@playwright/test';

test.describe('Habits', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/login');
		await page.fill('input[name="username"]', 'tim');
		await page.fill('input[name="password"]', 'password');
		await page.click('button[type="submit"]');
		await page.waitForURL('/categories');
	});

	test('should create a habit', async ({ page }) => {
		await page.goto('/categories');

		const habitCategory = page.locator('text=Fitness Habits').first();
		if ((await habitCategory.count()) === 0) {
			await page.click('text=Create Category');
			await page.selectOption('select[name="template_type"]', 'habit');
			await page.fill('input[name="name"]', 'Fitness Habits');
			await page.click('button:has-text("Create")');
			await page.waitForURL(/\/categories\/\d+/);
		} else {
			await habitCategory.click();
			await page.waitForURL(/\/categories\/\d+/);
		}

		await page.click('button:has-text("New Habit")');
		await page.waitForSelector('form');

		const nameField = page.locator('input[id^="field-"]').first();
		await nameField.fill('Test Habit');

		const goalField = page.locator('input[id^="field-"]').nth(1);
		if ((await goalField.count()) > 0) {
			await goalField.fill('Test goal');
		}

		await page.click('button:has-text("Create Habit")');
		await page.waitForSelector('text=Test Habit', { timeout: 5000 });
	});

	test('should log a habit entry', async ({ page }) => {
		await page.goto('/categories');

		const habitCategory = page.locator('text=Fitness Habits').first();
		if ((await habitCategory.count()) === 0) {
			test.skip();
		}
		await habitCategory.click();
		await page.waitForURL(/\/categories\/\d+/);

		const habitItem = page.locator('text=Morning Run').first();
		if ((await habitItem.count()) === 0) {
			test.skip();
		}

		await habitItem.locator('..').locator('button').first().click();
		await page.waitForSelector('form');

		await page.click('[id="status"]');
		await page.click('text=Done');
		await page.fill('textarea[id="notes"]', 'Great run today!');
		await page.click('button:has-text("Log Entry")');

		await expect(page.locator('text=Entry logged successfully')).toBeVisible({ timeout: 5000 });
	});

	test('should view habit stats', async ({ page }) => {
		await page.goto('/categories');

		const habitCategory = page.locator('text=Fitness Habits').first();
		if ((await habitCategory.count()) === 0) {
			test.skip();
		}
		await habitCategory.click();
		await page.waitForURL(/\/categories\/\d+/);

		await expect(page.locator('text=Current Streak')).toBeVisible({ timeout: 5000 });
		await expect(page.locator('text=Longest Streak')).toBeVisible();
		await expect(page.locator('text=Last 7 Days')).toBeVisible();
	});

	test('should update a habit entry', async ({ page }) => {
		await page.goto('/categories');

		const habitCategory = page.locator('text=Fitness Habits').first();
		if ((await habitCategory.count()) === 0) {
			test.skip();
		}
		await habitCategory.click();
		await page.waitForURL(/\/categories\/\d+/);

		await page.click('text=History');
		await page.waitForSelector('[role="tabpanel"]');

		const entry = page.locator('text=Done').first();
		if ((await entry.count()) === 0) {
			test.skip();
		}

		await entry.locator('..').locator('button').first().click();
		await page.waitForSelector('form');

		await page.click('[id="status"]');
		await page.click('text=Skipped');
		await page.click('button:has-text("Update Entry")');

		await expect(page.locator('text=Entry updated successfully')).toBeVisible({ timeout: 5000 });
	});

	test('should delete a habit entry', async ({ page }) => {
		await page.goto('/categories');

		const habitCategory = page.locator('text=Fitness Habits').first();
		if ((await habitCategory.count()) === 0) {
			test.skip();
		}
		await habitCategory.click();
		await page.waitForURL(/\/categories\/\d+/);

		await page.click('text=History');
		await page.waitForSelector('[role="tabpanel"]');

		const entry = page.locator('text=Done').first();
		if ((await entry.count()) === 0) {
			test.skip();
		}

		await entry.locator('..').locator('button').nth(1).click();
		await page.waitForSelector('button:has-text("Delete")');

		await page.click('button:has-text("Delete")');
		await expect(page.locator('text=Entry deleted successfully')).toBeVisible({ timeout: 5000 });
	});

	test('should view calendar', async ({ page }) => {
		await page.goto('/categories');

		const habitCategory = page.locator('text=Fitness Habits').first();
		if ((await habitCategory.count()) === 0) {
			test.skip();
		}
		await habitCategory.click();
		await page.waitForURL(/\/categories\/\d+/);

		const habitItem = page.locator('text=Morning Run').first();
		if ((await habitItem.count()) === 0) {
			test.skip();
		}

		await page.click('text=Calendar');
		await page.waitForSelector('[role="tabpanel"]');

		await expect(page.locator('text=Select a habit')).toBeVisible();
	});
});
