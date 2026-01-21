import { test as base, type Page } from '@playwright/test';

/**
 * Clean up test data created during E2E tests.
 * This removes categories and items created by tests to prevent pollution during a test run.
 *
 * Note: The test database is completely cleaned and re-migrated before the entire test suite runs
 * via global-setup.ts. This cleanup is for preventing data pollution between individual tests
 * in the same test run.
 */
async function cleanupTestData(page: Page, username: 'tim' | 'jule') {
	try {
		// Try to login to get session (with timeout)
		await page.goto('/categories', { timeout: 5000 });
		const isLoginPage = page.url().includes('/login');

		if (isLoginPage) {
			await page.getByLabel('Username').fill(username);
			await page.getByLabel('Password').fill(username);
			await page.getByRole('button', { name: 'Sign in' }).click();
			await page.waitForURL(/\/categories$/, { timeout: 5000 });
		}

		// Fetch all categories for this user via API
		const categoriesResponse = await page.request.get('/api/categories');
		if (!categoriesResponse.ok()) return;

		const data = await categoriesResponse.json();
		const categories = Array.isArray(data) ? data : [];

		// Delete ALL categories (since we're in test environment)
		// This is safe because the test database is separate from development
		for (const category of categories) {
			try {
				await page.request.delete(`/api/categories/${category.id}`);
			} catch {
				// Ignore errors during cleanup
			}
		}
	} catch {
		// Silently ignore cleanup errors (e.g., timeouts for non-auth tests)
	}
}

export const test = base.extend({
	page: async ({ page, context }, use, testInfo) => {
		// Skip cleanup for tests that don't need it or test auth itself
		const skipCleanup =
			testInfo.file.includes('health.spec') ||
			testInfo.file.includes('pwa.spec') ||
			testInfo.file.includes('auth-api.spec') ||
			testInfo.file.includes('auth.spec'); // Auth tests handle their own sessions

		if (!skipCleanup) {
			// Cleanup before test runs (parallel for speed)
			try {
				await Promise.all([cleanupTestData(page, 'tim'), cleanupTestData(page, 'jule')]);

				// CRITICAL: Clear all cookies/sessions after cleanup
				// This ensures tests start with a fresh, logged-out state
				await context.clearCookies();
			} catch {
				// Silently continue if cleanup fails
			}
		}

		// Run the test
		await use(page);

		// No cleanup after test - we clean before the next test
	}
});

export { expect } from '@playwright/test';
