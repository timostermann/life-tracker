<script lang="ts">
	import { Button } from '$lib/components/ui/Button';
	import { useChoreFormState } from './useChoreFormState.svelte';
	import { AssigneeSelector } from '$lib/components/AssigneeSelector';
	import { RecurringConfigDialog } from '$lib/components/RecurringConfigDialog';
	import { Input } from '$lib/components/ui/Input';
	import { Label } from '$lib/components/ui/Label';
	import { Checkbox } from '$lib/components/ui/Checkbox';
	import type { Field, RecurringConfig } from '$lib/schemas';

	type ChoreFormData = {
		assigned_to_user_id?: number | null;
		recurring_config: RecurringConfig;
		values: Record<string, string>;
	};

	type Props = {
		fields: Field[];
		initialData?: {
			id: number;
			assigned_to_user_id?: number | null;
			recurring_config?: RecurringConfig | null;
			values?: Record<string, string>;
		};
		onSubmit: (data: ChoreFormData) => void | Promise<void>;
		onCancel: () => void;
	};

	let { fields, initialData, onSubmit, onCancel }: Props = $props();

	const state = useChoreFormState(() => fields);

	$effect(() => {
		if (initialData) {
			state.loadData(initialData);
		}
	});

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		if (!state.validate()) {
			return;
		}

		state.loading = true;
		try {
			const formData = state.getFormData();
			await onSubmit(formData);
		} finally {
			state.loading = false;
		}
	}
</script>

<form onsubmit={handleSubmit} class="space-y-6">
	<div class="space-y-4">
		<h3 class="text-sm font-medium">Chore Details</h3>
		{#each fields as field (field.id)}
			<div>
				<Label for="field-{field.id}">{field.name}</Label>
				{#if field.field_type === 'text'}
					<Input
						id="field-{field.id}"
						value={state.fieldValues[field.id.toString()] ?? ''}
						oninput={(e) => state.setFieldValue(field.id.toString(), e.currentTarget.value)}
					/>
				{:else if field.field_type === 'number'}
					<Input
						id="field-{field.id}"
						type="number"
						value={state.fieldValues[field.id.toString()] ?? ''}
						oninput={(e) => state.setFieldValue(field.id.toString(), e.currentTarget.value)}
					/>
				{:else if field.field_type === 'boolean'}
					<div class="flex items-center gap-2">
						<Checkbox
							id="field-{field.id}"
							checked={state.fieldValues[field.id.toString()] === 'true'}
							onCheckedChange={(checked) =>
								state.setFieldValue(field.id.toString(), checked ? 'true' : 'false')}
						/>
						<Label for="field-{field.id}" class="mb-0!">{field.name}</Label>
					</div>
				{:else if field.field_type === 'date'}
					<Input
						id="field-{field.id}"
						type="date"
						value={state.fieldValues[field.id.toString()] ?? ''}
						oninput={(e) => state.setFieldValue(field.id.toString(), e.currentTarget.value)}
					/>
				{:else if field.field_type === 'select'}
					<select
						id="field-{field.id}"
						value={state.fieldValues[field.id.toString()] ?? ''}
						onchange={(e) => state.setFieldValue(field.id.toString(), e.currentTarget.value)}
						class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
					>
						<option value="">Select...</option>
						{#if field.options}
							{#each field.options.split('\n') as option (option)}
								<option value={option}>{option}</option>
							{/each}
						{/if}
					</select>
				{/if}
				{#if state.errors[field.id.toString()]}
					<p class="text-sm text-destructive">{state.errors[field.id.toString()]}</p>
				{/if}
			</div>
		{/each}
	</div>

	<div class="space-y-4">
		<h3 class="text-sm font-medium">Chore Settings</h3>

		<AssigneeSelector value={state.assignedTo} onValueChange={(v) => (state.assignedTo = v)} />

		<div>
			<RecurringConfigDialog
				value={state.recurringConfig}
				onValueChange={(v) => (state.recurringConfig = v)}
				label="Recurring Schedule *"
			/>
			{#if state.errors['recurring_config']}
				<p class="mt-1 text-sm text-destructive">{state.errors['recurring_config']}</p>
			{/if}
		</div>
	</div>

	<div class="flex justify-end gap-2">
		<Button type="button" variant="outline" onclick={onCancel}>Cancel</Button>
		<Button type="submit" disabled={state.loading}>
			{initialData ? 'Update' : 'Create'} Chore
		</Button>
	</div>
</form>
