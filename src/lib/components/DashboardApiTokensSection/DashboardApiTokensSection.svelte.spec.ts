import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import DashboardApiTokensSection from './DashboardApiTokensSection.svelte';

describe('DashboardApiTokensSection', () => {
	it('renders API access heading and generate control', async () => {
		render(DashboardApiTokensSection, {
			tokens: []
		});

		await expect.element(page.getByRole('heading', { name: 'API access' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: /Generate token/i })).toBeInTheDocument();
		await expect.element(page.getByText('No API tokens yet.')).toBeInTheDocument();
	});

	it('lists active tokens', async () => {
		render(DashboardApiTokensSection, {
			tokens: [
				{
					id: 1,
					name: 'Test bot',
					created_at: 1700000000,
					last_used_at: null
				}
			]
		});

		await expect.element(page.getByText('Test bot')).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: /Revoke/i })).toBeInTheDocument();
	});
});
