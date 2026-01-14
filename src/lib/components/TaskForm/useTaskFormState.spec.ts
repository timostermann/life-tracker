import { describe, it, expect } from 'vitest';
import { useTaskFormState } from './useTaskFormState.svelte';
import type { Field } from '$lib/schemas';

const mockFields: Field[] = [
	{
		id: 1,
		category_id: 1,
		name: 'Task Title*',
		field_type: 'text',
		options: null,
		field_order: 0,
		created_at: '2024-01-01'
	},
	{
		id: 2,
		category_id: 1,
		name: 'Description',
		field_type: 'text',
		options: null,
		field_order: 1,
		created_at: '2024-01-01'
	}
];

describe('useTaskFormState', () => {
	describe('initialization', () => {
		it('should initialize with default values', () => {
			const state = useTaskFormState(mockFields);

			expect(state.priority).toBeNull();
			expect(state.deadline).toBeNull();
			expect(state.timeEstimate).toBeNull();
			expect(state.assignedTo).toBeNull();
			expect(state.recurringConfig).toBeNull();
			expect(state.fieldValues).toEqual({});
			expect(state.loading).toBe(false);
			expect(state.errors).toEqual({});
		});

		it('should accept fields as array', () => {
			const state = useTaskFormState(mockFields);
			expect(state.fieldValues).toEqual({});
		});

		it('should accept fields as getter function', () => {
			const state = useTaskFormState(() => mockFields);
			expect(state.fieldValues).toEqual({});
		});
	});

	describe('loadData', () => {
		it('should load data from initial data object', () => {
			const state = useTaskFormState(mockFields);

			state.loadData({
				id: 1,
				priority: 'high',
				deadline: '2024-12-31T00:00:00.000Z',
				time_estimate: 60,
				assigned_to_user_id: 2,
				recurring_config: { frequency: 'weekly', interval: 1 },
				values: { '1': 'Test Task', '2': 'Test Description' }
			});

			expect(state.priority).toBe('high');
			expect(state.deadline).toBe('2024-12-31T00:00:00.000Z');
			expect(state.timeEstimate).toBe(60);
			expect(state.assignedTo).toBe(2);
			expect(state.recurringConfig).toEqual({ frequency: 'weekly', interval: 1 });
			expect(state.fieldValues).toEqual({ '1': 'Test Task', '2': 'Test Description' });
			expect(state.errors).toEqual({});
		});

		it('should handle null values', () => {
			const state = useTaskFormState(mockFields);

			state.loadData({
				id: 1,
				priority: null,
				deadline: null,
				time_estimate: null,
				assigned_to_user_id: null,
				recurring_config: null,
				values: {}
			});

			expect(state.priority).toBeNull();
			expect(state.deadline).toBeNull();
			expect(state.timeEstimate).toBeNull();
			expect(state.assignedTo).toBeNull();
			expect(state.recurringConfig).toBeNull();
		});

		it('should handle missing values property', () => {
			const state = useTaskFormState(mockFields);

			state.loadData({
				id: 1
			});

			expect(state.fieldValues).toEqual({});
		});
	});

	describe('reset', () => {
		it('should reset all state to defaults', () => {
			const state = useTaskFormState(mockFields);

			state.loadData({
				id: 1,
				priority: 'high',
				deadline: '2024-12-31T00:00:00.000Z',
				time_estimate: 60,
				assigned_to_user_id: 2,
				recurring_config: { frequency: 'weekly', interval: 1 },
				values: { '1': 'Test Task' }
			});

			state.loading = true;
			state.setFieldValue('1', 'Test');
			state.validate(); // This sets errors

			state.reset();

			expect(state.priority).toBeNull();
			expect(state.deadline).toBeNull();
			expect(state.timeEstimate).toBeNull();
			expect(state.assignedTo).toBeNull();
			expect(state.recurringConfig).toBeNull();
			expect(state.fieldValues).toEqual({});
			expect(state.errors).toEqual({});
			expect(state.loading).toBe(false);
		});
	});

	describe('validate', () => {
		it('should pass validation when required fields are filled', () => {
			const state = useTaskFormState(mockFields);

			state.setFieldValue('1', 'Test Task');
			state.setFieldValue('2', 'Description');

			const isValid = state.validate();

			expect(isValid).toBe(true);
			expect(state.errors).toEqual({});
		});

		it('should fail validation when required fields are empty', () => {
			const state = useTaskFormState(mockFields);

			state.setFieldValue('1', '');
			state.setFieldValue('2', 'Description');

			const isValid = state.validate();

			expect(isValid).toBe(false);
			expect(state.errors['1']).toBe('Task Title* is required');
		});

		it('should fail validation when required fields are whitespace only', () => {
			const state = useTaskFormState(mockFields);

			state.setFieldValue('1', '   ');
			state.setFieldValue('2', 'Description');

			const isValid = state.validate();

			expect(isValid).toBe(false);
			expect(state.errors['1']).toBe('Task Title* is required');
		});

		it('should pass validation for non-required fields', () => {
			const state = useTaskFormState(mockFields);

			state.setFieldValue('1', 'Test Task');
			state.setFieldValue('2', '');

			const isValid = state.validate();

			expect(isValid).toBe(true);
			expect(state.errors).toEqual({});
		});

		it('should clear previous errors on revalidation', () => {
			const state = useTaskFormState(mockFields);

			state.setFieldValue('1', '');
			state.validate();
			expect(state.errors['1']).toBeDefined();

			state.setFieldValue('1', 'Test Task');
			state.validate();
			expect(state.errors['1']).toBeUndefined();
		});
	});

	describe('getFormData', () => {
		it('should return formatted form data', () => {
			const state = useTaskFormState(mockFields);

			state.priority = 'high';
			state.deadline = '2024-12-31T00:00:00.000Z';
			state.timeEstimate = 60;
			state.assignedTo = 2;
			state.recurringConfig = { frequency: 'weekly', interval: 1 };
			state.setFieldValue('1', 'Test Task');
			state.setFieldValue('2', 'Description');

			const formData = state.getFormData();

			expect(formData).toEqual({
				priority: 'high',
				deadline: '2024-12-31T00:00:00.000Z',
				time_estimate: 60,
				assigned_to_user_id: 2,
				recurring_config: { frequency: 'weekly', interval: 1 },
				values: { '1': 'Test Task', '2': 'Description' }
			});
		});

		it('should return null values when not set', () => {
			const state = useTaskFormState(mockFields);

			const formData = state.getFormData();

			expect(formData.priority).toBeNull();
			expect(formData.deadline).toBeNull();
			expect(formData.time_estimate).toBeNull();
			expect(formData.assigned_to_user_id).toBeNull();
			expect(formData.recurring_config).toBeNull();
			expect(formData.values).toEqual({});
		});
	});

	describe('setFieldValue', () => {
		it('should set field value', () => {
			const state = useTaskFormState(mockFields);

			state.setFieldValue('1', 'Test Task');

			expect(state.fieldValues['1']).toBe('Test Task');
		});

		it('should update existing field value', () => {
			const state = useTaskFormState(mockFields);

			state.setFieldValue('1', 'Test Task');
			state.setFieldValue('1', 'Updated Task');

			expect(state.fieldValues['1']).toBe('Updated Task');
		});
	});

	describe('state setters and getters', () => {
		it('should allow setting and getting priority', () => {
			const state = useTaskFormState(mockFields);

			state.priority = 'urgent';
			expect(state.priority).toBe('urgent');

			state.priority = null;
			expect(state.priority).toBeNull();
		});

		it('should allow setting and getting deadline', () => {
			const state = useTaskFormState(mockFields);

			state.deadline = '2024-12-31T00:00:00.000Z';
			expect(state.deadline).toBe('2024-12-31T00:00:00.000Z');

			state.deadline = null;
			expect(state.deadline).toBeNull();
		});

		it('should allow setting and getting timeEstimate', () => {
			const state = useTaskFormState(mockFields);

			state.timeEstimate = 60;
			expect(state.timeEstimate).toBe(60);

			state.timeEstimate = null;
			expect(state.timeEstimate).toBeNull();
		});

		it('should allow setting and getting assignedTo', () => {
			const state = useTaskFormState(mockFields);

			state.assignedTo = 2;
			expect(state.assignedTo).toBe(2);

			state.assignedTo = null;
			expect(state.assignedTo).toBeNull();
		});

		it('should allow setting and getting recurringConfig', () => {
			const state = useTaskFormState(mockFields);

			state.recurringConfig = { frequency: 'weekly', interval: 1 };
			expect(state.recurringConfig).toEqual({ frequency: 'weekly', interval: 1 });

			state.recurringConfig = null;
			expect(state.recurringConfig).toBeNull();
		});

		it('should allow setting and getting loading', () => {
			const state = useTaskFormState(mockFields);

			state.loading = true;
			expect(state.loading).toBe(true);

			state.loading = false;
			expect(state.loading).toBe(false);
		});
	});
});
