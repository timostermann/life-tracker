import type { Category, Field } from '$lib/schemas';
import type { TailwindColorName } from '$lib/schemas/categories';
import { isTailwindColorName } from '$lib/utils/colors';

export type FieldInput = {
	name: string;
	field_type: 'text' | 'number' | 'date' | 'boolean' | 'select';
	options?: string;
	field_order: number;
};

export type CategoryFormData = {
	name: string;
	template_type: 'task' | 'chore' | 'habit';
	icon?: string;
	color?: TailwindColorName;
	is_private: boolean;
	fields: FieldInput[];
};

type CategoryWithFields = Category & { fields?: Field[] };

export function useCategoryFormState() {
	let name = $state('');
	let templateType = $state<'task' | 'chore' | 'habit'>('task');
	let icon = $state('');
	let color = $state<TailwindColorName | undefined>(undefined);
	let isPrivate = $state(true);
	let fields = $state<FieldInput[]>([]);
	let loading = $state(false);
	let errors = $state<Record<string, string>>({});

	function loadData(data: CategoryWithFields) {
		name = data.name ?? '';
		templateType = data.template_type ?? 'task';
		icon = data.icon ?? '';
		color = isTailwindColorName(data.color) ? data.color : undefined;
		isPrivate = data.is_private ?? true;
		fields =
			data.fields?.map((f, i) => ({
				name: f.name,
				field_type: f.field_type,
				options: f.options ?? '',
				field_order: f.field_order ?? i
			})) ?? [];
	}

	function addField() {
		fields = [
			...fields,
			{
				name: '',
				field_type: 'text',
				options: '',
				field_order: fields.length
			}
		];
	}

	function removeField(index: number) {
		fields = fields.filter((_, i) => i !== index);
		fields.forEach((f, i) => (f.field_order = i));
	}

	function updateField(index: number, key: keyof FieldInput, value: string) {
		fields[index] = { ...fields[index], [key]: value };
	}

	function validate(): boolean {
		errors = {};

		if (!name.trim()) {
			errors.name = 'Name is required';
		}

		for (let i = 0; i < fields.length; i++) {
			if (!fields[i].name.trim()) {
				errors[`field_${i}_name`] = 'Field name is required';
			}
		}

		return Object.keys(errors).length === 0;
	}

	function getFormData(): CategoryFormData {
		return {
			name: name.trim(),
			template_type: templateType,
			icon: icon.trim() || undefined,
			color,
			is_private: isPrivate,
			fields: fields.map((f) => ({
				...f,
				options: f.options?.trim() || undefined
			}))
		};
	}

	return {
		get name() {
			return name;
		},
		set name(v: string) {
			name = v;
		},
		get templateType() {
			return templateType;
		},
		set templateType(v: 'task' | 'chore' | 'habit') {
			templateType = v;
		},
		get icon() {
			return icon;
		},
		set icon(v: string) {
			icon = v;
		},
		get color() {
			return color;
		},
		set color(v: TailwindColorName | undefined) {
			color = v;
		},
		get isPrivate() {
			return isPrivate;
		},
		set isPrivate(v: boolean) {
			isPrivate = v;
		},
		get fields() {
			return fields;
		},
		get loading() {
			return loading;
		},
		set loading(v: boolean) {
			loading = v;
		},
		get errors() {
			return errors;
		},
		loadData,
		addField,
		removeField,
		updateField,
		validate,
		getFormData
	};
}
