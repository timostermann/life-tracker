<script lang="ts">
	import * as Calendar from '$lib/components/ui/Calendar';
	import { Button } from '$lib/components/ui/Button';
	import { Label } from '$lib/components/ui/Label';
	import * as Dialog from '$lib/components/ui/Dialog';
	import { CalendarIcon, X } from 'lucide-svelte';
	import { DateFormatter, parseDate } from '@internationalized/date';
	import type { DateValue } from '@internationalized/date';

	type Props = {
		value?: string | null;
		onValueChange?: (value: string | null) => void;
		label?: string;
		id?: string;
	};

	let { value = null, onValueChange, label = 'Deadline', id }: Props = $props();

	let open = $state(false);
	const df = new DateFormatter('en-US', {
		dateStyle: 'medium'
	});

	let calendarValue = $state<DateValue | undefined>(undefined);

	$effect(() => {
		const parsedValue = value ? parseDate(value.split('T')[0]) : undefined;
		calendarValue = parsedValue;
	});

	// Notify parent when local state changes (user selects date)
	$effect(() => {
		if (calendarValue && onValueChange) {
			const isoString = `${calendarValue.year}-${String(calendarValue.month).padStart(2, '0')}-${String(calendarValue.day).padStart(2, '0')}T00:00:00.000Z`;
			if (isoString !== value) {
				onValueChange(isoString);
				open = false;
			}
		}
	});

	function handleClear() {
		if (onValueChange) {
			onValueChange(null);
			open = false;
		}
	}

	let displayValue = $derived(value ? df.format(new Date(value)) : 'Pick a date');
</script>

<div class="space-y-2">
	{#if label}
		<Label for={id}>{label}</Label>
	{/if}
	<Button
		{id}
		variant="outline"
		class="w-full justify-start text-left font-normal"
		onclick={() => (open = true)}
	>
		<CalendarIcon class="mr-2 size-4" />
		{displayValue}
	</Button>

	<Dialog.Dialog bind:open>
		<Dialog.Content class="w-auto p-0">
			<Calendar.Calendar bind:value={calendarValue} class="rounded-md border" />
			{#if value}
				<div class="border-t p-3">
					<Button variant="ghost" onclick={handleClear} class="w-full">
						<X class="mr-2 size-4" />
						Clear deadline
					</Button>
				</div>
			{/if}
		</Dialog.Content>
	</Dialog.Dialog>
</div>
