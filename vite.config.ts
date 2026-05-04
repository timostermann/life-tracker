import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';
import type { Plugin } from 'vite';

function stripViteBaseDuringVitest(): Plugin {
	return {
		name: 'strip-vite-base-during-vitest',
		// Remove an injected Vite `base` during Vitest runs to avoid SvelteKit's override warning.
		config(config) {
			if (!process.env.VITEST) return;
			if ('base' in config) delete (config as { base?: unknown }).base;
		}
	};
}

export default defineConfig({
	plugins: [stripViteBaseDuringVitest(), sveltekit(), tailwindcss()],

	test: {
		expect: { requireAssertions: true },
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: [
				'**/node_modules/**',
				'**/*.spec.{js,ts}',
				'**/*.svelte.spec.{js,ts}',
				'**/+page.svelte',
				'**/+layout.svelte',
				'**/+server.ts',
				'**/db/migrations/**',
				'**/db/seeds/**',
				'**/index.ts',
				'**/.svelte-kit/**',
				'**/build/**'
			]
		},

		projects: [
			{
				extends: './vite.config.ts',

				test: {
					name: 'client',

					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},

					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',

				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: [
						'src/**/*.svelte.{test,spec}.{js,ts}',
						'src/lib/server/auth/seed.spec.ts',
						'src/lib/server/auth/session.spec.ts',
						'src/lib/server/db/queries*.spec.ts',
						'src/lib/server/db/queries/**/*.spec.ts',
						'src/routes/api/categories/**/*.spec.ts',
						'src/routes/api/dashboard/server.spec.ts',
						'src/routes/api/tokens/**/*.spec.ts',
						'src/routes/api/tokens/server.spec.ts',
						'src/routes/api/users/server.spec.ts'
					],
					// Ensure tests run in isolation to prevent database singleton pollution
					isolate: true
				}
			}
		]
	}
});
