import type { RecurringConfig } from '$lib/schemas/items';
import type { Field } from '$lib/schemas';

type Priority = 'urgent' | 'high' | 'medium' | 'low';

type TaskFormData = {
	priority?: Priority | null;
	deadline?: string | null;
	time_estimate?: number | null;
	assigned_to_user_id?: number | null;
	recurring_config?: RecurringConfig | null;
	values: Record<string, string>;
};

type InitialData = {
	id: number;
	priority?: Priority | null;
	deadline?: string | null;
	time_estimate?: number | null;
	assigned_to_user_id?: number | null;
	recurring_config?: RecurringConfig | null;
	values?: Record<string, string>;
};

export function useTaskFormState(fields: Field[] | (() => Field[])) {
	// Store fields reactively - handle both direct array and getter function
	// Access fields reactively to avoid capturing initial value
	const fieldsReactive = $derived.by(() => (typeof fields === 'function' ? fields() : fields));

	let priority = $state<Priority | null>(null);
	let deadline = $state<string | null>(null);
	let timeEstimate = $state<number | null>(null);
	let assignedTo = $state<number | null>(null);
	let recurringConfig = $state<RecurringConfig | null>(null);
	let fieldValues = $state<Record<string, string>>({});
	let loading = $state(false);
	let errors = $state<Record<string, string>>({});

	function loadData(data: InitialData) {
		priority = data.priority ?? null;
		deadline = data.deadline ?? null;
		timeEstimate = data.time_estimate ?? null;
		assignedTo = data.assigned_to_user_id ?? null;
		recurringConfig = data.recurring_config ?? null;
		fieldValues = data.values ?? {};
		errors = {};
	}

	function reset() {
		priority = null;
		deadline = null;
		timeEstimate = null;
		assignedTo = null;
		recurringConfig = null;
		fieldValues = {};
		errors = {};
		loading = false;
	}

	function validate(): boolean {
		const newErrors: Record<string, string> = {};

		// Validate required fields - use reactive fields
		for (const field of fieldsReactive) {
			const value = fieldValues[field.id.toString()];
			if (field.name.includes('*') && (!value || value.trim() === '')) {
				newErrors[field.id.toString()] = `${field.name} is required`;
			}
		}

		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	function getFormData(): TaskFormData {
		return {
			priority,
			deadline,
			time_estimate: timeEstimate,
			assigned_to_user_id: assignedTo,
			recurring_config: recurringConfig,
			values: fieldValues
		};
	}

	function setFieldValue(fieldId: string, value: string) {
		fieldValues[fieldId] = value;
	}

	return {
		get priority() {
			return priority;
		},
		set priority(value: Priority | null) {
			priority = value;
		},
		get deadline() {
			return deadline;
		},
		set deadline(value: string | null) {
			deadline = value;
		},
		get timeEstimate() {
			return timeEstimate;
		},
		set timeEstimate(value: number | null) {
			timeEstimate = value;
		},
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
