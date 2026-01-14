import type { Field } from '$lib/schemas';

type HabitFormData = {
	values: Record<string, string>;
};

type InitialData = {
	id: number;
	values?: Record<string, string>;
};

export function useHabitFormState(fields: Field[] | (() => Field[])) {
	const fieldsReactive = $derived.by(() => (typeof fields === 'function' ? fields() : fields));

	let fieldValues = $state<Record<string, string>>({});
	let loading = $state(false);
	let errors = $state<Record<string, string>>({});

	function loadData(data: InitialData) {
		fieldValues = data.values ?? {};
		errors = {};
	}

	function reset() {
		fieldValues = {};
		errors = {};
		loading = false;
	}

	function validate(): boolean {
		const newErrors: Record<string, string> = {};

		for (const field of fieldsReactive) {
			const value = fieldValues[field.id.toString()];
			if (field.name.includes('*') && (!value || value.trim() === '')) {
				newErrors[field.id.toString()] = `${field.name} is required`;
			}
		}

		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	function getFormData(): HabitFormData {
		return {
			values: fieldValues
		};
	}

	function setFieldValue(fieldId: string, value: string) {
		fieldValues[fieldId] = value;
	}

	return {
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
