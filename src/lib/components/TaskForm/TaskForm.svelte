<script lang="ts">
	import { Button } from '$lib/components/ui/Button';
	import { useTaskFormState } from './useTaskFormState.svelte';
	import { PrioritySelector } from '$lib/components/PrioritySelector';
	import { AssigneeSelector } from '$lib/components/AssigneeSelector';
	import { DeadlinePicker } from '$lib/components/DeadlinePicker';
	import { TimeEstimateInput } from '$lib/components/TimeEstimateInput';
	import { RecurringConfigDialog } from '$lib/components/RecurringConfigDialog';
	import { Input } from '$lib/components/ui/Input';
	import { Label } from '$lib/components/ui/Label';
	import { Checkbox } from '$lib/components/ui/Checkbox';
	import type { Field, RecurringConfig } from '$lib/schemas';

	type TaskFormData = {
		priority?: 'urgent' | 'high' | 'medium' | 'low' | null;
		deadline?: string | null;
		time_estimate?: number | null;
		assigned_to_user_id?: number | null;
		recurring_config?: RecurringConfig | null;
		values: Record<string, string>;
	};

	type Props = {
		fields: Field[];
		currentUserId?: number;
		categoryId?: number;
		initialData?: {
			id: number;
			priority?: 'urgent' | 'high' | 'medium' | 'low' | null;
			deadline?: string | null;
			time_estimate?: number | null;
			assigned_to_user_id?: number | null;
			recurring_config?: RecurringConfig | null;
			values?: Record<string, string>;
		};
		onSubmit: (data: TaskFormData) => void | Promise<void>;
		onCancel: () => void;
	};

	let { fields, currentUserId, categoryId, initialData, onSubmit, onCancel }: Props = $props();

	// Create state once - fields structure is stable during component lifecycle
	// Pass getter function to access prop reactively
	const state = useTaskFormState(
		() => fields,
		() => currentUserId
	);

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
		<h3 class="text-sm font-medium">Task Details</h3>
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
				{/if}
				{#if state.errors[field.id.toString()]}
					<p class="text-sm text-destructive">{state.errors[field.id.toString()]}</p>
				{/if}
			</div>
		{/each}
	</div>

	<div class="space-y-4">
		<h3 class="text-sm font-medium">Task Settings</h3>

		<PrioritySelector value={state.priority} onValueChange={(v) => (state.priority = v)} />

		<AssigneeSelector
			value={state.assignedTo}
			onValueChange={(v) => (state.assignedTo = v)}
			{categoryId}
		/>

		<div class="grid gap-4 sm:grid-cols-2">
			<DeadlinePicker value={state.deadline} onValueChange={(v) => (state.deadline = v)} />
			<TimeEstimateInput
				value={state.timeEstimate}
				onValueChange={(v) => (state.timeEstimate = v)}
			/>
		</div>

		<RecurringConfigDialog
			value={state.recurringConfig}
			onValueChange={(v) => (state.recurringConfig = v)}
		/>
	</div>

	<div class="flex justify-end gap-2">
		<Button type="button" variant="outline" onclick={onCancel}>Cancel</Button>
		<Button type="submit" disabled={state.loading}>
			{initialData ? 'Update' : 'Create'} Task
		</Button>
	</div>
</form>
