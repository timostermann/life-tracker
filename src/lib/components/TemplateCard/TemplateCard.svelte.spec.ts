import { page } from 'vitest/browser';
import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import TemplateCard from './TemplateCard.svelte';
import type { Template } from '$lib/schemas';

describe('TemplateCard', () => {
	const mockTemplate: Template = {
		id: 1,
		name: 'Tasks',
		template_type: 'task',
		description: 'Action items with priorities',
		icon: '✓',
		category_config: JSON.stringify({
			name: 'Tasks',
			icon: '✓',
			color: '#3b82f6',
			fields: [
				{ name: 'Title', field_type: 'text', field_order: 1 },
				{ name: 'Description', field_type: 'text', field_order: 2 }
			]
		}),
		is_system: true,
		created_at: '2024-01-01 00:00:00'
	};

	it('should render template name', async () => {
		const onApply = vi.fn();
		render(TemplateCard, { template: mockTemplate, onApply });

		await expect.element(page.getByText('Tasks')).toBeInTheDocument();
	});

	it('should render template description', async () => {
		const onApply = vi.fn();
		render(TemplateCard, { template: mockTemplate, onApply });

		await expect.element(page.getByText('Action items with priorities')).toBeInTheDocument();
	});

	it('should render template icon', async () => {
		const onApply = vi.fn();
		render(TemplateCard, { template: mockTemplate, onApply });

		await expect.element(page.getByText('✓')).toBeInTheDocument();
	});

	it('should render all fields from config', async () => {
		const onApply = vi.fn();
		render(TemplateCard, { template: mockTemplate, onApply });

		await expect.element(page.getByText('Title')).toBeInTheDocument();
		await expect.element(page.getByText('Description')).toBeInTheDocument();
		// Both fields are of type "text" so there will be two "(text)" elements
		await expect.element(page.getByText('(text)').first()).toBeInTheDocument();
	});

	it('should show "Fields included:" label', async () => {
		const onApply = vi.fn();
		render(TemplateCard, { template: mockTemplate, onApply });

		await expect.element(page.getByText('Fields included:')).toBeInTheDocument();
	});

	it('should call onApply with template id when button clicked', async () => {
		const onApply = vi.fn();
		render(TemplateCard, { template: mockTemplate, onApply });

		const button = page.getByRole('button', { name: /use template/i });
		await button.click();

		expect(onApply).toHaveBeenCalledWith(1);
	});

	it('should handle template without icon', async () => {
		const templateWithoutIcon = { ...mockTemplate, icon: null };
		const onApply = vi.fn();
		render(TemplateCard, { template: templateWithoutIcon, onApply });

		await expect.element(page.getByText('Tasks')).toBeInTheDocument();
	});

	it('should handle template without description', async () => {
		const templateWithoutDesc = { ...mockTemplate, description: null };
		const onApply = vi.fn();
		render(TemplateCard, { template: templateWithoutDesc, onApply });

		await expect.element(page.getByText('Tasks')).toBeInTheDocument();
	});

	it('should handle invalid JSON in category_config gracefully', async () => {
		const templateWithInvalidConfig = { ...mockTemplate, category_config: 'invalid json' };
		const onApply = vi.fn();
		render(TemplateCard, { template: templateWithInvalidConfig, onApply });

		await expect.element(page.getByText('Tasks')).toBeInTheDocument();
		await expect.element(page.getByText('Fields included:')).toBeInTheDocument();
	});
});
