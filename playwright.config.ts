import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: 'e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 4 : undefined,
	timeout: 30000,
	reporter: process.env.CI ? [['html'], ['list'], ['github']] : [['html'], ['list']],
	globalSetup: './e2e/global-setup.ts',
	use: {
		baseURL: 'http://localhost:4173',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure'
	},
	expect: {
		timeout: 10000
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		}
	],
	webServer: {
		command: 'npm run build && npm run preview',
		port: 4173,
		reuseExistingServer: !process.env.CI,
		env: {
			DATABASE_PATH: '.data/db.test.sqlite',
			AUTH_SEED_TIM_PASSWORD: 'tim',
			AUTH_SEED_JULE_PASSWORD: 'jule',
			AUTH_COOKIE_SECURE: 'false'
		}
	}
});
