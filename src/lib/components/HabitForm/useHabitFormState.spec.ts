import { describe, it, expect } from 'vitest';
import { useHabitFormState } from './useHabitFormState.svelte';
import type { Field } from '$lib/schemas';

describe('useHabitFormState', () => {
	const fields: Field[] = [
		{
			id: 1,
			category_id: 1,
			name: 'Habit Name',
			field_type: 'text',
			options: null,
			field_order: 0,
			created_at: '2024-01-01 00:00:00'
		},
		{
			id: 2,
			category_id: 1,
			name: 'Goal',
			field_type: 'text',
			options: null,
			field_order: 1,
			created_at: '2024-01-01 00:00:00'
		},
		{
			id: 3,
			category_id: 1,
			name: 'Is Good Habit',
			field_type: 'boolean',
			options: null,
			field_order: 2,
			created_at: '2024-01-01 00:00:00'
		}
	];

	it('initializes with empty field values', () => {
		const state = useHabitFormState(fields);
		expect(state.fieldValues).toEqual({});
		expect(state.loading).toBe(false);
		expect(state.errors).toEqual({});
	});

	it('loads initial data correctly', () => {
		const state = useHabitFormState(fields);
		const initialData = {
			id: 1,
			values: {
				'1': 'Morning Run',
				'2': 'Run 5km daily',
				'3': 'true'
			}
		};

		state.loadData(initialData);
		expect(state.fieldValues).toEqual({
			'1': 'Morning Run',
			'2': 'Run 5km daily',
			'3': 'true'
		});
	});

	it('validates required fields', () => {
		const state = useHabitFormState([
			{
				...fields[0],
				name: 'Habit Name *'
			}
		]);

		expect(state.validate()).toBe(false);
		expect(state.errors).toHaveProperty('1');

		state.setFieldValue('1', 'Morning Run');
		expect(state.validate()).toBe(true);
		expect(state.errors).toEqual({});
	});

	it('sets field values correctly', () => {
		const state = useHabitFormState(fields);
		state.setFieldValue('1', 'Test Habit');
		expect(state.fieldValues['1']).toBe('Test Habit');
	});

	it('resets state correctly', () => {
		const state = useHabitFormState(fields);
		state.setFieldValue('1', 'Test');
		state.loading = true;
		state.loadData({ id: 1, values: { '1': 'Test' } });

		state.reset();
		expect(state.fieldValues).toEqual({});
		expect(state.loading).toBe(false);
		expect(state.errors).toEqual({});
	});

	it('gets form data correctly', () => {
		const state = useHabitFormState(fields);
		state.setFieldValue('1', 'Morning Run');
		state.setFieldValue('2', 'Run daily');

		const formData = state.getFormData();
		expect(formData).toEqual({
			values: {
				'1': 'Morning Run',
				'2': 'Run daily'
			}
		});
	});
});
