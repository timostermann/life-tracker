import { test, expect } from './fixtures';

test.describe('PWA Configuration', () => {
	test('should serve manifest.json with correct structure', async ({ page }) => {
		const response = await page.goto('/manifest.json');
		expect(response?.status()).toBe(200);

		const manifest = await response?.json();
		expect(manifest).toBeDefined();
		expect(manifest.name).toBe('Life Tracker');
		expect(manifest.short_name).toBe('Tracker');
		expect(manifest.display).toBe('standalone');
		expect(manifest.start_url).toBe('/');
		expect(manifest.theme_color).toBe('#2E0E7A');
		expect(manifest.background_color).toBe('#ffffff');
		expect(manifest.icons).toHaveLength(2);
		expect(manifest.icons[0].sizes).toBe('192x192');
		expect(manifest.icons[1].sizes).toBe('512x512');
	});

	test('should serve PWA icons', async ({ page }) => {
		const icon192 = await page.goto('/icon-192.png');
		expect(icon192?.status()).toBe(200);
		expect(icon192?.headers()['content-type']).toContain('image/png');

		const icon512 = await page.goto('/icon-512.png');
		expect(icon512?.status()).toBe(200);
		expect(icon512?.headers()['content-type']).toContain('image/png');
	});

	test('should have manifest link in HTML', async ({ page }) => {
		await page.goto('/');
		const manifestLink = page.locator('link[rel="manifest"]');
		await expect(manifestLink).toHaveAttribute('href', '/manifest.json');
	});

	test('should have theme-color meta tag', async ({ page }) => {
		await page.goto('/');
		const themeColor = page.locator('meta[name="theme-color"]');
		await expect(themeColor).toHaveAttribute('content', '#2E0E7A');
	});

	test('should have apple-mobile-web-app meta tags', async ({ page }) => {
		await page.goto('/');
		const appleCapable = page.locator('meta[name="apple-mobile-web-app-capable"]');
		await expect(appleCapable).toHaveAttribute('content', 'yes');

		const appleTitle = page.locator('meta[name="apple-mobile-web-app-title"]');
		await expect(appleTitle).toHaveAttribute('content', 'Life Tracker');

		const appleTouchIcon = page.locator('link[rel="apple-touch-icon"]');
		const href = await appleTouchIcon.getAttribute('href');
		expect(href).toContain('/icon-192.png');
	});

	test('should have viewport meta tag', async ({ page }) => {
		await page.goto('/');
		const viewport = page.locator('meta[name="viewport"]');
		await expect(viewport).toHaveAttribute('content', 'width=device-width, initial-scale=1');
	});

	test('should have description meta tag', async ({ page }) => {
		await page.goto('/');
		const description = page.locator('meta[name="description"]');
		await expect(description).toHaveAttribute(
			'content',
			'Track your tasks, habits, and chores in one place'
		);
	});
});
