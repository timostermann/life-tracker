import { describe, it, expect } from 'vitest';
import {
	createCategorySchema,
	updateCategorySchema,
	categoryFieldSchema,
	tailwindColorNames,
	shareCategorySchema
} from './categories';

describe('categoryFieldSchema', () => {
	it('validates valid field data', () => {
		const validField = {
			name: 'Priority',
			field_type: 'select',
			options: JSON.stringify(['High', 'Medium', 'Low']),
			field_order: 0
		};

		const result = categoryFieldSchema.safeParse(validField);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toEqual(validField);
		}
	});

	it('validates field without optional fields', () => {
		const minimalField = {
			name: 'Notes',
			field_type: 'text'
		};

		const result = categoryFieldSchema.safeParse(minimalField);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.field_order).toBe(0);
		}
	});

	it('rejects empty name', () => {
		const invalidField = {
			name: '',
			field_type: 'text'
		};

		const result = categoryFieldSchema.safeParse(invalidField);
		expect(result.success).toBe(false);
	});

	it('rejects invalid field_type', () => {
		const invalidField = {
			name: 'Invalid',
			field_type: 'invalid_type'
		};

		const result = categoryFieldSchema.safeParse(invalidField);
		expect(result.success).toBe(false);
	});

	it('rejects name longer than 100 characters', () => {
		const invalidField = {
			name: 'a'.repeat(101),
			field_type: 'text'
		};

		const result = categoryFieldSchema.safeParse(invalidField);
		expect(result.success).toBe(false);
	});
});

describe('createCategorySchema', () => {
	it('validates valid category data with Tailwind color', () => {
		const validCategory = {
			name: 'Work Tasks',
			template_type: 'task',
			icon: '💼',
			color: 'blue',
			is_private: true,
			fields: [
				{
					name: 'Priority',
					field_type: 'select',
					options: JSON.stringify(['High', 'Low']),
					field_order: 0
				}
			]
		};

		const result = createCategorySchema.safeParse(validCategory);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.color).toBe('blue');
		}
	});

	it('validates minimal category data', () => {
		const minimalCategory = {
			name: 'Simple Category',
			template_type: 'chore'
		};

		const result = createCategorySchema.safeParse(minimalCategory);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.is_private).toBe(true);
			expect(result.data.fields).toEqual([]);
		}
	});

	it('accepts all valid Tailwind color names', () => {
		tailwindColorNames.forEach((color) => {
			const category = {
				name: 'Test',
				template_type: 'task',
				color
			};

			const result = createCategorySchema.safeParse(category);
			expect(result.success).toBe(true);
		});
	});

	it('rejects hex color codes', () => {
		const invalidCategory = {
			name: 'Test',
			template_type: 'task',
			color: '#ff0000'
		};

		const result = createCategorySchema.safeParse(invalidCategory);
		expect(result.success).toBe(false);
	});

	it('rejects invalid color names', () => {
		const invalidCategory = {
			name: 'Test',
			template_type: 'task',
			color: 'invalid_color'
		};

		const result = createCategorySchema.safeParse(invalidCategory);
		expect(result.success).toBe(false);
	});

	it('rejects empty name', () => {
		const invalidCategory = {
			name: '',
			template_type: 'task'
		};

		const result = createCategorySchema.safeParse(invalidCategory);
		expect(result.success).toBe(false);
	});

	it('rejects name longer than 100 characters', () => {
		const invalidCategory = {
			name: 'a'.repeat(101),
			template_type: 'task'
		};

		const result = createCategorySchema.safeParse(invalidCategory);
		expect(result.success).toBe(false);
	});

	it('rejects invalid template_type', () => {
		const invalidCategory = {
			name: 'Test',
			template_type: 'invalid'
		};

		const result = createCategorySchema.safeParse(invalidCategory);
		expect(result.success).toBe(false);
	});

	it('validates all template types', () => {
		const templateTypes = ['task', 'chore', 'habit'] as const;

		templateTypes.forEach((template_type) => {
			const category = {
				name: 'Test',
				template_type
			};

			const result = createCategorySchema.safeParse(category);
			expect(result.success).toBe(true);
		});
	});
});

describe('updateCategorySchema', () => {
	it('validates partial updates', () => {
		const partialUpdate = {
			name: 'Updated Name'
		};

		const result = updateCategorySchema.safeParse(partialUpdate);
		expect(result.success).toBe(true);
	});

	it('validates color update with Tailwind name', () => {
		const colorUpdate = {
			color: 'emerald'
		};

		const result = updateCategorySchema.safeParse(colorUpdate);
		expect(result.success).toBe(true);
	});

	it('validates multiple field updates', () => {
		const multipleUpdates = {
			name: 'New Name',
			icon: '🎯',
			color: 'purple',
			is_private: false
		};

		const result = updateCategorySchema.safeParse(multipleUpdates);
		expect(result.success).toBe(true);
	});

	it('validates empty update object', () => {
		const emptyUpdate = {};

		const result = updateCategorySchema.safeParse(emptyUpdate);
		expect(result.success).toBe(true);
	});

	it('rejects hex color codes', () => {
		const invalidUpdate = {
			color: '#00ff00'
		};

		const result = updateCategorySchema.safeParse(invalidUpdate);
		expect(result.success).toBe(false);
	});

	it('rejects invalid color names', () => {
		const invalidUpdate = {
			color: 'notacolor'
		};

		const result = updateCategorySchema.safeParse(invalidUpdate);
		expect(result.success).toBe(false);
	});

	it('rejects name longer than 100 characters', () => {
		const invalidUpdate = {
			name: 'a'.repeat(101)
		};

		const result = updateCategorySchema.safeParse(invalidUpdate);
		expect(result.success).toBe(false);
	});

	it('rejects empty name', () => {
		const invalidUpdate = {
			name: ''
		};

		const result = updateCategorySchema.safeParse(invalidUpdate);
		expect(result.success).toBe(false);
	});

	it('does not allow template_type changes', () => {
		const updateWithTemplateType = {
			name: 'New Name',
			template_type: 'habit'
		};

		const result = updateCategorySchema.safeParse(updateWithTemplateType);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).not.toHaveProperty('template_type');
		}
	});
});

describe('shareCategorySchema', () => {
	it('validates valid share input', () => {
		const input = { user_id: 2, permission: 'view' as const };
		const result = shareCategorySchema.safeParse(input);
		expect(result.success).toBe(true);
	});

	it('rejects invalid permission', () => {
		const input = { user_id: 2, permission: 'owner' };
		const result = shareCategorySchema.safeParse(input);
		expect(result.success).toBe(false);
	});

	it('rejects invalid user_id', () => {
		const input = { user_id: 0, permission: 'edit' as const };
		const result = shareCategorySchema.safeParse(input);
		expect(result.success).toBe(false);
	});
});
