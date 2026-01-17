import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ApplyTemplateDialog from './ApplyTemplateDialog.svelte';
import type { Template } from '$lib/schemas';

describe('ApplyTemplateDialog', () => {
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

	it('renders without crashing when closed', () => {
		const onApply = vi.fn().mockResolvedValue(undefined);
		const onCancel = vi.fn();
		const { container } = render(ApplyTemplateDialog, {
			open: false,
			template: mockTemplate,
			onApply,
			onCancel
		});

		expect(container).toBeDefined();
	});

	it('renders with loading state', () => {
		const onApply = vi.fn();
		const onCancel = vi.fn();
		const { container } = render(ApplyTemplateDialog, {
			open: false,
			template: mockTemplate,
			loading: true,
			onApply,
			onCancel
		});

		expect(container).toBeDefined();
	});

	it('renders with null template', () => {
		const onApply = vi.fn();
		const onCancel = vi.fn();
		const { container } = render(ApplyTemplateDialog, {
			open: false,
			template: null,
			onApply,
			onCancel
		});

		expect(container).toBeDefined();
	});

	it('renders with template without name in config', () => {
		const templateWithoutName = {
			...mockTemplate,
			category_config: JSON.stringify({
				icon: '✓',
				fields: []
			})
		};
		const onApply = vi.fn();
		const onCancel = vi.fn();
		const { container } = render(ApplyTemplateDialog, {
			open: false,
			template: templateWithoutName,
			onApply,
			onCancel
		});

		expect(container).toBeDefined();
	});

	it('renders with invalid JSON in category_config', () => {
		const templateWithInvalidConfig = {
			...mockTemplate,
			category_config: 'invalid json'
		};
		const onApply = vi.fn();
		const onCancel = vi.fn();
		const { container } = render(ApplyTemplateDialog, {
			open: false,
			template: templateWithInvalidConfig,
			onApply,
			onCancel
		});

		expect(container).toBeDefined();
	});
});
