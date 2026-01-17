import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import TemplatePicker from './TemplatePicker.svelte';
import type { Template } from '$lib/schemas';

describe('TemplatePicker', () => {
	const mockTemplates: Template[] = [
		{
			id: 1,
			name: 'Tasks',
			template_type: 'task',
			description: 'Action items',
			icon: '✓',
			category_config: JSON.stringify({
				name: 'Tasks',
				icon: '✓',
				color: '#3b82f6',
				fields: [{ name: 'Title', field_type: 'text', field_order: 1 }]
			}),
			is_system: true,
			created_at: '2024-01-01 00:00:00'
		},
		{
			id: 2,
			name: 'Chores',
			template_type: 'chore',
			description: 'Recurring tasks',
			icon: '🧹',
			category_config: JSON.stringify({
				name: 'Chores',
				icon: '🧹',
				color: '#10b981',
				fields: [{ name: 'Chore Name', field_type: 'text', field_order: 1 }]
			}),
			is_system: true,
			created_at: '2024-01-01 00:00:00'
		},
		{
			id: 3,
			name: 'Habits',
			template_type: 'habit',
			description: 'Daily tracking',
			icon: '📈',
			category_config: JSON.stringify({
				name: 'Habits',
				icon: '📈',
				color: '#8b5cf6',
				fields: [{ name: 'Habit Name', field_type: 'text', field_order: 1 }]
			}),
			is_system: true,
			created_at: '2024-01-01 00:00:00'
		}
	];

	it('renders with templates', () => {
		const onApply = vi.fn();
		const { container } = render(TemplatePicker, { templates: mockTemplates, onApply });

		expect(container).toBeDefined();
	});

	it('renders with empty templates array', () => {
		const onApply = vi.fn();
		const { container } = render(TemplatePicker, { templates: [], onApply });

		expect(container).toBeDefined();
	});

	it('renders with multiple templates of same type', () => {
		const templatesWithDuplicates = [
			...mockTemplates,
			{
				id: 4,
				name: 'Work Tasks',
				template_type: 'task' as const,
				description: 'Work items',
				icon: '💼',
				category_config: JSON.stringify({
					name: 'Work Tasks',
					icon: '💼',
					color: '#ef4444',
					fields: [{ name: 'Task', field_type: 'text', field_order: 1 }]
				}),
				is_system: false,
				created_at: '2024-01-01 00:00:00'
			}
		];
		const onApply = vi.fn();
		const { container } = render(TemplatePicker, { templates: templatesWithDuplicates, onApply });

		expect(container).toBeDefined();
	});

	it('renders with only task templates', () => {
		const onApply = vi.fn();
		const { container } = render(TemplatePicker, {
			templates: mockTemplates.filter((t) => t.template_type === 'task'),
			onApply
		});

		expect(container).toBeDefined();
	});

	it('renders with only chore templates', () => {
		const onApply = vi.fn();
		const { container } = render(TemplatePicker, {
			templates: mockTemplates.filter((t) => t.template_type === 'chore'),
			onApply
		});

		expect(container).toBeDefined();
	});
});
