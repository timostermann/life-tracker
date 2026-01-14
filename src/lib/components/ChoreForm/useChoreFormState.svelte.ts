import type { RecurringConfig } from '$lib/schemas/items';
import type { Field } from '$lib/schemas';

type ChoreFormData = {
	assigned_to_user_id?: number | null;
	recurring_config: RecurringConfig;
	values: Record<string, string>;
};

type InitialData = {
	id: number;
	assigned_to_user_id?: number | null;
	recurring_config?: RecurringConfig | null;
	values?: Record<string, string>;
};

export function useChoreFormState(fields: Field[] | (() => Field[])) {
	const fieldsReactive = $derived.by(() => (typeof fields === 'function' ? fields() : fields));

	let assignedTo = $state<number | null>(null);
	let recurringConfig = $state<RecurringConfig | null>(null);
	let fieldValues = $state<Record<string, string>>({});
	let loading = $state(false);
	let errors = $state<Record<string, string>>({});

	function loadData(data: InitialData) {
		assignedTo = data.assigned_to_user_id ?? null;
		recurringConfig = data.recurring_config ?? null;
		fieldValues = data.values ?? {};
		errors = {};
	}

	function reset() {
		assignedTo = null;
		recurringConfig = null;
		fieldValues = {};
		errors = {};
		loading = false;
	}

	function validate(): boolean {
		const newErrors: Record<string, string> = {};

		if (!recurringConfig) {
			newErrors['recurring_config'] = 'Recurring schedule is required for chores';
		}

		for (const field of fieldsReactive) {
			const value = fieldValues[field.id.toString()];
			if (field.name.includes('*') && (!value || value.trim() === '')) {
				newErrors[field.id.toString()] = `${field.name} is required`;
			}
		}

		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	function getFormData(): ChoreFormData {
		if (!recurringConfig) {
			throw new Error('Recurring config is required');
		}
		return {
			assigned_to_user_id: assignedTo,
			recurring_config: recurringConfig,
			values: fieldValues
		};
	}

	function setFieldValue(fieldId: string, value: string) {
		fieldValues[fieldId] = value;
	}

	return {
		get assignedTo() {
			return assignedTo;
		},
		set assignedTo(value: number | null) {
			assignedTo = value;
		},
		get recurringConfig() {
			return recurringConfig;
		},
		set recurringConfig(value: RecurringConfig | null) {
			recurringConfig = value;
		},
		get fieldValues() {
			return fieldValues;
		},
		get loading() {
			return loading;
		},
		set loading(value: boolean) {
			loading = value;
		},
		get errors() {
			return errors;
		},
		loadData,
		reset,
		validate,
		getFormData,
		setFieldValue
	};
}
