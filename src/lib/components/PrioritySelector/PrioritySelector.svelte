<script lang="ts">
	import * as Select from '$lib/components/ui/Select';
	import { Label } from '$lib/components/ui/Label';
	import Badge from '$lib/components/ui/Badge/Badge.svelte';

	type Priority = 'urgent' | 'high' | 'medium' | 'low';

	type Props = {
		value?: Priority | null;
		onValueChange?: (value: Priority | null) => void;
		label?: string;
		id?: string;
		required?: boolean;
	};

	let { value = null, onValueChange, label = 'Priority', id, required = false }: Props = $props();

	const priorities: {
		value: Priority;
		label: string;
		variant: 'destructive' | 'secondary' | 'outline' | 'default';
	}[] = [
		{ value: 'urgent', label: 'Urgent', variant: 'destructive' },
		{ value: 'high', label: 'High', variant: 'secondary' },
		{ value: 'medium', label: 'Medium', variant: 'default' },
		{ value: 'low', label: 'Low', variant: 'outline' }
	];

	function handleChange(newValue: string | undefined) {
		if (newValue && onValueChange) {
			onValueChange(newValue as Priority);
		} else if (!newValue && onValueChange) {
			onValueChange(null);
		}
	}

	let selectedPriority = $derived(priorities.find((p) => p.value === value));
</script>

<div class="space-y-2">
	{#if label}
		<Label for={id}>{label}{required ? ' *' : ''}</Label>
	{/if}
	<Select.Root type="single" value={value ?? undefined} onValueChange={handleChange}>
		<Select.Trigger {id} aria-required={required}>
			{#if selectedPriority}
				<Badge variant={selectedPriority.variant}>{selectedPriority.label}</Badge>
			{:else}
				Select priority
			{/if}
		</Select.Trigger>
		<Select.Content>
			{#each priorities as priority (priority.value)}
				<Select.Item value={priority.value}>
					<div class="flex items-center gap-2">
						<Badge variant={priority.variant}>{priority.label}</Badge>
					</div>
				</Select.Item>
			{/each}
		</Select.Content>
	</Select.Root>
</div>
