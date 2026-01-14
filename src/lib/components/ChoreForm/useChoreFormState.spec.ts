import { describe, it, expect } from 'vitest';
import { useChoreFormState } from './useChoreFormState.svelte';
import type { Field } from '$lib/schemas';

const mockFields: Field[] = [
	{
		id: 1,
		name: 'Chore Name',
		field_type: 'text',
		field_order: 1,
		category_id: 1,
		created_at: '2026-01-01T00:00:00Z'
	},
	{
		id: 2,
		name: 'Notes',
		field_type: 'text',
		field_order: 2,
		category_id: 1,
		created_at: '2026-01-01T00:00:00Z'
	}
];

describe('useChoreFormState', () => {
	it('should initialize with default values', () => {
		const state = useChoreFormState(mockFields);

		expect(state.assignedTo).toBeNull();
		expect(state.recurringConfig).toBeNull();
		expect(state.fieldValues).toEqual({});
		expect(state.loading).toBe(false);
		expect(Object.keys(state.errors)).toHaveLength(0);
	});

	it('should load data correctly', () => {
		const state = useChoreFormState(mockFields);
		const initialData = {
			id: 1,
			assigned_to_user_id: 2,
			recurring_config: { frequency: 'weekly' as const, interval: 1 },
			values: { '1': 'Vacuum living room', '2': 'Deep clean' }
		};

		state.loadData(initialData);

		expect(state.assignedTo).toBe(2);
		expect(state.recurringConfig).toEqual({ frequency: 'weekly', interval: 1 });
		expect(state.fieldValues).toEqual({ '1': 'Vacuum living room', '2': 'Deep clean' });
	});

	it('should validate recurring_config is required', () => {
		const state = useChoreFormState(mockFields);
		state.setFieldValue('1', 'Test chore');
		state.recurringConfig = null;

		const isValid = state.validate();

		expect(isValid).toBe(false);
		expect(state.errors['recurring_config']).toBe('Recurring schedule is required for chores');
	});

	it('should validate required fields', () => {
		const fieldsWithRequired: Field[] = [
			{
				id: 1,
				name: '* Chore Name',
				field_type: 'text',
				field_order: 1,
				category_id: 1,
				created_at: '2026-01-01T00:00:00Z'
			}
		];
		const state = useChoreFormState(fieldsWithRequired);
		state.recurringConfig = { frequency: 'weekly', interval: 1 };

		const isValid = state.validate();

		expect(isValid).toBe(false);
		expect(state.errors['1']).toBe('* Chore Name is required');
	});

	it('should pass validation with all required fields', () => {
		const fieldsWithRequired: Field[] = [
			{
				id: 1,
				name: '* Chore Name',
				field_type: 'text',
				field_order: 1,
				category_id: 1,
				created_at: '2026-01-01T00:00:00Z'
			}
		];
		const state = useChoreFormState(fieldsWithRequired);
		state.recurringConfig = { frequency: 'monthly', interval: 1 };
		state.setFieldValue('1', 'Test chore');

		const isValid = state.validate();

		expect(isValid).toBe(true);
		expect(Object.keys(state.errors)).toHaveLength(0);
	});

	it('should get form data correctly', () => {
		const state = useChoreFormState(mockFields);
		state.assignedTo = 2;
		state.recurringConfig = { frequency: 'weekly', interval: 2 };
		state.setFieldValue('1', 'Vacuum');
		state.setFieldValue('2', 'Notes');

		const formData = state.getFormData();

		expect(formData).toEqual({
			assigned_to_user_id: 2,
			recurring_config: { frequency: 'weekly', interval: 2 },
			values: { '1': 'Vacuum', '2': 'Notes' }
		});
	});

	it('should throw error when getting form data without recurring_config', () => {
		const state = useChoreFormState(mockFields);
		state.recurringConfig = null;

		expect(() => state.getFormData()).toThrow('Recurring config is required');
	});

	it('should set field value correctly', () => {
		const state = useChoreFormState(mockFields);
		state.setFieldValue('1', 'New value');

		expect(state.fieldValues['1']).toBe('New value');
	});

	it('should reset state correctly', () => {
		const state = useChoreFormState(mockFields);
		state.assignedTo = 2;
		state.recurringConfig = { frequency: 'weekly', interval: 1 };
		state.setFieldValue('1', 'Test');
		state.loading = true;
		state.validate();

		state.reset();

		expect(state.assignedTo).toBeNull();
		expect(state.recurringConfig).toBeNull();
		expect(state.fieldValues).toEqual({});
		expect(state.loading).toBe(false);
		expect(Object.keys(state.errors)).toHaveLength(0);
	});

	it('should handle reactive fields getter function', () => {
		let fields = mockFields;
		const getFields = () => fields;
		const state = useChoreFormState(getFields);

		expect(state.fieldValues).toEqual({});

		fields = [
			{
				id: 3,
				name: 'New Field',
				field_type: 'text',
				field_order: 1,
				category_id: 1,
				created_at: '2026-01-01T00:00:00Z'
			}
		];

		state.setFieldValue('3', 'New value');
		expect(state.fieldValues['3']).toBe('New value');
	});
});
