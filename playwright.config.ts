import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: {
		command: 'npm run build && npm run preview',
		port: 4173,
		env: {
			DATABASE_PATH: ':memory:',
			AUTH_SEED_TIM_PASSWORD: 'tim',
			AUTH_SEED_JULE_PASSWORD: 'jule',
			AUTH_COOKIE_SECURE: 'false'
		}
	},
	testDir: 'e2e'
});
