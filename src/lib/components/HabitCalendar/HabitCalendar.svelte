<script lang="ts">
	import { Calendar } from '$lib/components/ui/Calendar';
	import * as CalendarComponents from '$lib/components/ui/Calendar';
	import type { HabitEntry } from '$lib/schemas/db';
	import type { DateValue } from '@internationalized/date';

	type Props = {
		entries: HabitEntry[];
		onDayClick?: (date: string, entry?: HabitEntry) => void;
	};

	let { entries, onDayClick }: Props = $props();

	let selectedDate = $state<DateValue | undefined>(undefined);

	const entriesByDate = $derived.by(() => {
		const map: Record<string, HabitEntry> = {};
		for (const entry of entries) {
			map[entry.logged_date] = entry;
		}
		return map;
	});

	function getEntryForDate(dateStr: string): HabitEntry | undefined {
		return entriesByDate[dateStr];
	}

	function handleDayClick(date: DateValue | undefined) {
		if (!date || !onDayClick) return;
		const dateStr = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
		const entry = getEntryForDate(dateStr);
		onDayClick(dateStr, entry);
	}

	function getStatusClass(dateStr: string): string {
		const entry = entriesByDate[dateStr];
		if (!entry) return '';
		switch (entry.status) {
			case 'done':
				return 'bg-green-500 text-white';
			case 'skipped':
				return 'bg-yellow-500 text-white';
			case 'failed':
				return 'bg-red-500 text-white';
		}
	}

	$effect(() => {
		if (selectedDate) {
			handleDayClick(selectedDate);
		}
	});
</script>

{#snippet daySnippet({ day, outsideMonth }: { day: DateValue; outsideMonth: boolean })}
	{@const dateStr = `${day.year}-${String(day.month).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`}
	{@const statusClass = getStatusClass(dateStr)}
	{@const className = `h-8 w-8 rounded-md ${statusClass} ${outsideMonth ? 'opacity-50' : ''} ${onDayClick ? 'cursor-pointer hover:bg-accent' : ''}`}
	<CalendarComponents.Day class={className} />
{/snippet}

<Calendar bind:value={selectedDate} day={daySnippet} />

<div class="mt-4 flex gap-4 text-sm">
	<div class="flex items-center gap-2">
		<div class="h-4 w-4 rounded bg-green-500"></div>
		<span>Done</span>
	</div>
	<div class="flex items-center gap-2">
		<div class="h-4 w-4 rounded bg-yellow-500"></div>
		<span>Skipped</span>
	</div>
	<div class="flex items-center gap-2">
		<div class="h-4 w-4 rounded bg-red-500"></div>
		<span>Failed</span>
	</div>
</div>
