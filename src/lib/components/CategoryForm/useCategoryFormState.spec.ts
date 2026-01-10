import { describe, it, expect } from 'vitest';
import { useCategoryFormState } from './useCategoryFormState.svelte';

describe('useCategoryFormState', () => {
	describe('initialization', () => {
		it('should initialize with default values', () => {
			const state = useCategoryFormState();

			expect(state.name).toBe('');
			expect(state.templateType).toBe('task');
			expect(state.icon).toBe('');
			expect(state.color).toBeUndefined();
			expect(state.isPrivate).toBe(true);
			expect(state.fields).toEqual([]);
			expect(state.loading).toBe(false);
			expect(state.errors).toEqual({});
		});

		it('should load data via loadData method', () => {
			const state = useCategoryFormState();

			state.loadData({
				id: 1,
				name: 'Work Tasks',
				template_type: 'task',
				icon: '📋',
				color: 'blue',
				is_private: false,
				user_id: 1,
				created_at: '2024-01-01',
				updated_at: '2024-01-01',
				fields: [
					{
						id: 1,
						category_id: 1,
						name: 'Priority',
						field_type: 'select',
						options: 'Low\nMedium\nHigh',
						field_order: 0,
						created_at: '2024-01-01',
						updated_at: '2024-01-01'
					}
				]
			});

			expect(state.name).toBe('Work Tasks');
			expect(state.templateType).toBe('task');
			expect(state.icon).toBe('📋');
			expect(state.color).toBe('blue');
			expect(state.isPrivate).toBe(false);
			expect(state.fields).toHaveLength(1);
			expect(state.fields[0].name).toBe('Priority');
		});

		it('should initialize state properties that can be set directly', () => {
			const state = useCategoryFormState();

			state.name = 'Work Tasks';
			state.templateType = 'chore';
			state.icon = '📋';
			state.color = 'blue';
			state.isPrivate = false;

			expect(state.name).toBe('Work Tasks');
			expect(state.templateType).toBe('chore');
			expect(state.icon).toBe('📋');
			expect(state.color).toBe('blue');
			expect(state.isPrivate).toBe(false);
		});

		it('should handle missing optional fields when set manually', () => {
			const state = useCategoryFormState();

			state.icon = '';
			state.color = undefined;

			expect(state.icon).toBe('');
			expect(state.color).toBeUndefined();
		});
	});

	describe('field management', () => {
		it('should add a new field', () => {
			const state = useCategoryFormState();

			state.addField();

			expect(state.fields).toHaveLength(1);
			expect(state.fields[0]).toEqual({
				name: '',
				field_type: 'text',
				options: '',
				field_order: 0
			});
		});

		it('should add multiple fields with correct order', () => {
			const state = useCategoryFormState();

			state.addField();
			state.addField();
			state.addField();

			expect(state.fields).toHaveLength(3);
			expect(state.fields[0].field_order).toBe(0);
			expect(state.fields[1].field_order).toBe(1);
			expect(state.fields[2].field_order).toBe(2);
		});

		it('should remove a field and reorder remaining fields', () => {
			const state = useCategoryFormState();

			state.addField();
			state.addField();
			state.addField();
			state.updateField(0, 'name', 'Field 1');
			state.updateField(1, 'name', 'Field 2');
			state.updateField(2, 'name', 'Field 3');

			state.removeField(1);

			expect(state.fields).toHaveLength(2);
			expect(state.fields[0].name).toBe('Field 1');
			expect(state.fields[1].name).toBe('Field 3');
			expect(state.fields[0].field_order).toBe(0);
			expect(state.fields[1].field_order).toBe(1);
		});

		it('should update field properties', () => {
			const state = useCategoryFormState();

			state.addField();
			state.updateField(0, 'name', 'Priority');
			state.updateField(0, 'field_type', 'select');
			state.updateField(0, 'options', 'High\nMedium\nLow');

			expect(state.fields[0].name).toBe('Priority');
			expect(state.fields[0].field_type).toBe('select');
			expect(state.fields[0].options).toBe('High\nMedium\nLow');
		});
	});

	describe('validation', () => {
		it('should validate that name is required', () => {
			const state = useCategoryFormState();

			const isValid = state.validate();

			expect(isValid).toBe(false);
			expect(state.errors.name).toBe('Name is required');
		});

		it('should validate that field names are required', () => {
			const state = useCategoryFormState();
			state.name = 'Test Category';
			state.addField();
			state.addField();

			const isValid = state.validate();

			expect(isValid).toBe(false);
			expect(state.errors.field_0_name).toBe('Field name is required');
			expect(state.errors.field_1_name).toBe('Field name is required');
		});

		it('should pass validation with valid data', () => {
			const state = useCategoryFormState();
			state.name = 'Test Category';
			state.addField();
			state.updateField(0, 'name', 'Priority');

			const isValid = state.validate();

			expect(isValid).toBe(true);
			expect(state.errors).toEqual({});
		});

		it('should clear previous errors on revalidation', () => {
			const state = useCategoryFormState();

			state.validate();
			expect(state.errors.name).toBeDefined();

			state.name = 'Test Category';
			state.validate();
			expect(state.errors.name).toBeUndefined();
		});
	});

	describe('getFormData', () => {
		it('should return formatted form data', () => {
			const state = useCategoryFormState();
			state.name = '  Test Category  ';
			state.templateType = 'chore';
			state.icon = '  📋  ';
			state.color = 'blue';
			state.isPrivate = false;
			state.addField();
			state.updateField(0, 'name', 'Priority');
			state.updateField(0, 'field_type', 'select');
			state.updateField(0, 'options', '  High  ');

			const formData = state.getFormData();

			expect(formData.name).toBe('Test Category');
			expect(formData.template_type).toBe('chore');
			expect(formData.icon).toBe('📋');
			expect(formData.color).toBe('blue');
			expect(formData.is_private).toBe(false);
			expect(formData.fields[0].name).toBe('Priority');
			expect(formData.fields[0].options).toBe('High');
		});

		it('should return undefined for empty icon', () => {
			const state = useCategoryFormState();
			state.name = 'Test';
			state.icon = '   ';

			const formData = state.getFormData();

			expect(formData.icon).toBeUndefined();
		});

		it('should return undefined for empty field options', () => {
			const state = useCategoryFormState();
			state.name = 'Test';
			state.addField();
			state.updateField(0, 'name', 'Field');
			state.updateField(0, 'options', '   ');

			const formData = state.getFormData();

			expect(formData.fields[0].options).toBeUndefined();
		});
	});

	describe('state setters', () => {
		it('should allow setting name', () => {
			const state = useCategoryFormState();

			state.name = 'New Name';

			expect(state.name).toBe('New Name');
		});

		it('should allow setting template type', () => {
			const state = useCategoryFormState();

			state.templateType = 'habit';

			expect(state.templateType).toBe('habit');
		});

		it('should allow setting loading state', () => {
			const state = useCategoryFormState();

			state.loading = true;

			expect(state.loading).toBe(true);
		});

		it('should allow setting color', () => {
			const state = useCategoryFormState();

			state.color = 'emerald';

			expect(state.color).toBe('emerald');
		});

		it('should allow setting isPrivate', () => {
			const state = useCategoryFormState();

			state.isPrivate = false;

			expect(state.isPrivate).toBe(false);
		});
	});
});
