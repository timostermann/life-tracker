import { defineConfig } from 'histoire';
import { HstSvelte } from '@histoire/plugin-svelte';

export default defineConfig({
	plugins: [HstSvelte()],
	setupFile: '/src/histoire.setup.ts',
	theme: {
		title: 'Life Tracker Components'
	},
	vite: {
		server: {
			fs: {
				allow: ['.']
			}
		},
		optimizeDeps: {
			exclude: ['flexsearch', 'vscode-oniguruma', 'vscode-textmate']
		}
	}
});
