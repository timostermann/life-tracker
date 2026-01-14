<script lang="ts">
	import * as Dialog from '$lib/components/ui/Dialog';
	import * as Select from '$lib/components/ui/Select';
	import { Button } from '$lib/components/ui/Button';
	import { Label } from '$lib/components/ui/Label';
	import { Input } from '$lib/components/ui/Input';
	import { X, Repeat } from 'lucide-svelte';
	import type { RecurringConfig } from '$lib/schemas/items';
	import { formatRecurringConfig } from '$lib/utils/recurring';

	type Props = {
		value?: RecurringConfig | null;
		onValueChange: (value: RecurringConfig | null) => void;
		label?: string;
	};

	let { value = null, onValueChange, label = 'Recurring' }: Props = $props();

	let open = $state(false);
	let editFrequency = $state<'daily' | 'weekly' | 'monthly'>('daily');
	let editInterval = $state<number>(1);

	// Sync from props when value changes
	$effect(() => {
		if (value) {
			editFrequency = value.frequency;
			editInterval = value.interval;
		} else {
			editFrequency = 'daily';
			editInterval = 1;
		}
	});

	function handleSave() {
		if (onValueChange && editInterval > 0) {
			onValueChange({ frequency: editFrequency, interval: editInterval });
			open = false;
		}
	}

	function handleClear() {
		if (onValueChange) {
			onValueChange(null);
			open = false;
		}
	}

	function handleIntervalInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const num = parseInt(target.value, 10);
		if (!isNaN(num) && num > 0) {
			editInterval = num;
		}
	}
</script>

<div class="space-y-2">
	{#if label}
		<Label>{label}</Label>
	{/if}
	<Button
		variant="outline"
		class="w-full justify-start text-left font-normal"
		onclick={() => (open = true)}
	>
		<Repeat class="mr-2 size-4" />
		{value ? formatRecurringConfig(value) : 'Set recurring schedule'}
	</Button>

	<Dialog.Dialog bind:open>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>Recurring Schedule</Dialog.Title>
				<Dialog.Description>Configure how often this task repeats</Dialog.Description>
			</Dialog.Header>

			<div class="space-y-4 py-4">
				<div class="space-y-2">
					<Label for="interval">Repeat every</Label>
					<div class="flex gap-2">
						<Input
							id="interval"
							type="number"
							min="1"
							step="1"
							value={editInterval}
							oninput={handleIntervalInput}
							class="w-24"
						/>
						<Select.Root
							type="single"
							value={editFrequency}
							onValueChange={(v) => v && (editFrequency = v as 'daily' | 'weekly' | 'monthly')}
						>
							<Select.Trigger class="flex-1">
								{editFrequency === 'daily'
									? editInterval === 1
										? 'day'
										: 'days'
									: editFrequency === 'weekly'
										? editInterval === 1
											? 'week'
											: 'weeks'
										: editInterval === 1
											? 'month'
											: 'months'}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="daily">{editInterval === 1 ? 'day' : 'days'}</Select.Item>
								<Select.Item value="weekly">{editInterval === 1 ? 'week' : 'weeks'}</Select.Item>
								<Select.Item value="monthly">{editInterval === 1 ? 'month' : 'months'}</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>
				</div>

				<div class="rounded-lg bg-muted p-3 text-sm">
					<strong>Preview:</strong>
					{formatRecurringConfig({ frequency: editFrequency, interval: editInterval })}
				</div>
			</div>

			<Dialog.Footer class="flex flex-col gap-2 sm:flex-row sm:justify-between">
				<Button variant="ghost" onclick={handleClear} class="sm:mr-auto">
					<X class="mr-2 size-4" />
					Remove recurring
				</Button>
				<div class="flex gap-2">
					<Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
					<Button onclick={handleSave}>Save</Button>
				</div>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Dialog>
</div>
