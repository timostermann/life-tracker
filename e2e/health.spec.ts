import { test, expect } from './fixtures';

test.describe('Health Check Endpoint', () => {
	test('should return 200 status', async ({ request }) => {
		const response = await request.get('/api/health');
		expect(response.status()).toBe(200);
	});

	test('should return correct JSON structure', async ({ request }) => {
		const response = await request.get('/api/health');
		const body = await response.json();

		expect(body).toHaveProperty('status', 'ok');
		expect(body).toHaveProperty('timestamp');
		expect(body).toHaveProperty('database', 'connected');

		// Verify timestamp is valid ISO string
		const timestamp = new Date(body.timestamp);
		expect(timestamp.toString()).not.toBe('Invalid Date');
	});

	test('should respond quickly', async ({ request }) => {
		const start = Date.now();
		const response = await request.get('/api/health');
		const duration = Date.now() - start;

		expect(response.status()).toBe(200);
		expect(duration).toBeLessThan(1000); // Should respond in less than 1 second
	});

	test('should be accessible without authentication', async ({ page }) => {
		const response = await page.goto('/api/health');
		expect(response?.status()).toBe(200);

		const body = await response?.json();
		expect(body?.status).toBe('ok');
	});
});
