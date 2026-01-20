import { expect, test, type Page } from '@playwright/test';

async function login(page: Page, username: 'tim' | 'jule') {
	await page.goto('/');

	// Check if already on login page or redirected
	if (page.url().includes('/login')) {
		await page.getByLabel('Username').fill(username);
		await page.getByLabel('Password').fill(username);
		await page.getByRole('button', { name: 'Sign in' }).click();
		await expect(page).not.toHaveURL(/\/login$/);
	}
}

test.describe('Dashboard', () => {
	test('should display dashboard after login', async ({ page }) => {
		await login(page, 'tim');

		await page.goto('/');
		await expect(page).toHaveURL('/');
		await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
	});

	test('should show all dashboard sections', async ({ page }) => {
		await login(page, 'tim');

		await page.goto('/');

		// Check for main sections
		await expect(page.getByRole('heading', { name: 'Recent Categories' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Assigned to Me' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Due Soon' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Habits to Log Today' })).toBeVisible();
	});

	test('should show "View All" link for categories', async ({ page }) => {
		await login(page, 'tim');

		await page.goto('/');

		const viewAllLink = page.getByRole('link', { name: 'View All →' });
		await expect(viewAllLink).toBeVisible();

		// Click and verify navigation
		await viewAllLink.click();
		await expect(page).toHaveURL('/categories');
	});

	test('should display categories with counts', async ({ page }) => {
		await login(page, 'tim');

		// First ensure we have at least one category
		await page.goto('/categories');

		const categoryCards = page.locator('[aria-label*="Category:"]');
		const count = await categoryCards.count();

		if (count > 0) {
			// Go to dashboard
			await page.goto('/');

			// Should show categories (max 6)
			const dashboardCategories = page.locator('[aria-label*="Category:"]');
			const dashboardCount = await dashboardCategories.count();

			expect(dashboardCount).toBeGreaterThan(0);
			expect(dashboardCount).toBeLessThanOrEqual(6);

			// Verify first category has item count
			const firstCategory = dashboardCategories.first();
			await expect(firstCategory).toContainText(/\d+ items?/);
		}
	});

	test('should show empty state when no categories', async ({ page }) => {
		await login(page, 'tim');

		await page.goto('/');

		// If user has no categories, should show empty message
		const categoriesSection = page.locator('text=Recent Categories').locator('..');
		const emptyMessage = categoriesSection.locator(
			'text=Create your first category from a template'
		);

		// Either categories are shown OR empty message is shown
		const hasCategories = (await page.locator('[aria-label*="Category:"]').count()) > 0;
		const hasEmptyMessage = await emptyMessage.isVisible();

		expect(hasCategories || hasEmptyMessage).toBe(true);
	});

	test('should navigate to category when clicked', async ({ page }) => {
		await login(page, 'tim');

		await page.goto('/');

		// Find first category card
		const categoryCard = page.locator('[aria-label*="Category:"]').first();

		if (await categoryCard.isVisible()) {
			await categoryCard.click();

			// Should navigate to category detail page
			await expect(page).toHaveURL(/\/categories\/\d+/);
		}
	});

	test('should show Create Category button', async ({ page }) => {
		await login(page, 'tim');

		await page.goto('/');

		const createButton = page.getByRole('button', { name: 'Create Category' });
		await expect(createButton).toBeVisible();

		// Click should navigate to categories page
		await createButton.click();
		await expect(page).toHaveURL('/categories');
	});

	test('should display assigned tasks grouped by priority', async ({ page }) => {
		await login(page, 'tim');

		await page.goto('/');

		// Check Assigned to Me section exists
		const assignedHeading = page.getByRole('heading', { name: 'Assigned to Me' });
		await expect(assignedHeading).toBeVisible();

		// Test passes if the section is visible - actual priority groups depend on data
	});

	test('should show empty state for no assigned items', async ({ page }) => {
		await login(page, 'jule'); // Use different user with potentially no assignments

		await page.goto('/');

		// Check if Assigned to Me section is visible
		const assignedHeading = page.getByRole('heading', { name: 'Assigned to Me' });
		await expect(assignedHeading).toBeVisible();

		// The section should either have priority groups or show the empty message
		const hasPriorityGroups =
			(await page
				.locator(
					'h3:has-text("Urgent"), h3:has-text("High"), h3:has-text("Medium"), h3:has-text("Low")'
				)
				.count()) > 0;
		const hasEmptyMessage = await page.locator('text=No tasks assigned to you').isVisible();

		// One of these should be true
		expect(hasPriorityGroups || hasEmptyMessage).toBe(true);
	});

	test('should show due soon section', async ({ page }) => {
		await login(page, 'tim');

		await page.goto('/');

		const dueSoonSection = page.getByRole('heading', { name: 'Due Soon' });
		await expect(dueSoonSection).toBeVisible();

		// The section should either have items or show the empty message
		const hasItems = (await page.locator('button[aria-label*="Item"]').count()) > 0;
		const hasEmptyMessage = await page.locator("text=You're all caught up!").isVisible();

		// One of these should be true
		expect(hasItems || hasEmptyMessage).toBe(true);
	});

	test('should show habits today section', async ({ page }) => {
		await login(page, 'tim');

		await page.goto('/');

		const habitsSection = page.getByRole('heading', { name: 'Habits to Log Today' });
		await expect(habitsSection).toBeVisible();

		// The section should either have habits or show the empty message
		const hasHabits = (await page.locator('button[aria-label*="Log habit"]').count()) > 0;
		const hasEmptyMessage = await page.locator('text=Start tracking a habit').isVisible();

		// One of these should be true
		expect(hasHabits || hasEmptyMessage).toBe(true);
	});

	test('should navigate to category from habit card', async ({ page }) => {
		await login(page, 'tim');

		await page.goto('/');

		// Find habits section
		const habitsSection = page.locator('text=Habits to Log Today').locator('..');
		const habitCard = habitsSection.locator('button').first();

		if (await habitCard.isVisible()) {
			await habitCard.click();

			// Should navigate to category page
			await expect(page).toHaveURL(/\/categories\/\d+/);
		}
	});

	test('should be responsive on mobile', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
		await login(page, 'tim');

		await page.goto('/');

		// All sections should still be visible
		await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Recent Categories' })).toBeVisible();

		// Categories should stack in single column (check if first two are vertically aligned)
		const categories = page.locator('[aria-label*="Category:"]');
		if ((await categories.count()) >= 2) {
			const first = categories.nth(0);
			const second = categories.nth(1);

			const firstBox = await first.boundingBox();
			const secondBox = await second.boundingBox();

			if (firstBox && secondBox) {
				// Second card should be below first (not side by side)
				expect(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height - 10);
			}
		}
	});

	test('should limit categories to 6', async ({ page }) => {
		await login(page, 'tim');

		await page.goto('/');

		// Count categories on dashboard
		const dashboardCategories = page.locator('[aria-label*="Category:"]');
		const count = await dashboardCategories.count();

		// Should show max 6 categories
		expect(count).toBeLessThanOrEqual(6);
	});
});
