<script lang="ts">
	import { Button } from '$lib/components/ui/Button';
	import { Input } from '$lib/components/ui/Input';
	import { Label } from '$lib/components/ui/Label';
	import { Textarea } from '$lib/components/ui/Textarea';
	import * as Select from '$lib/components/ui/Select';
	import type { HabitEntryInput } from '$lib/schemas/habits';

	type Props = {
		initialDate?: string;
		initialData?: {
			status: 'done' | 'skipped' | 'failed';
			notes?: string | null;
		};
		onSubmit: (data: HabitEntryInput) => void | Promise<void>;
		onCancel: () => void;
	};

	let { initialDate, initialData, onSubmit, onCancel }: Props = $props();

	const today = new Date().toISOString().split('T')[0];
	let selectedDate = $state(today);
	let status = $state<'done' | 'skipped' | 'failed'>('done');
	let notes = $state('');
	let loading = $state(false);

	$effect(() => {
		selectedDate = initialDate ?? today;
		if (initialData) {
			status = initialData.status;
			notes = initialData.notes ?? '';
		} else {
			status = 'done';
			notes = '';
		}
	});

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		loading = true;
		try {
			await onSubmit({
				logged_date: selectedDate,
				status,
				notes: notes.trim() || undefined
			});
		} finally {
			loading = false;
		}
	}
</script>

<form onsubmit={handleSubmit} class="space-y-6">
	<div class="space-y-4">
		<div>
			<Label for="date">Date</Label>
			<Input
				id="date"
				type="date"
				value={selectedDate}
				oninput={(e) => (selectedDate = e.currentTarget.value)}
				required
			/>
		</div>

		<div>
			<Label for="status">Status</Label>
			<Select.Root
				type="single"
				value={status}
				onValueChange={(v: string | string[] | undefined) => {
					if (v) {
						const val = Array.isArray(v) ? v[0] : v;
						if (val) {
							status = val as typeof status;
						}
					}
				}}
			>
				<Select.Trigger id="status">
					{status === 'done'
						? 'Done'
						: status === 'skipped'
							? 'Skipped'
							: status === 'failed'
								? 'Failed'
								: 'Select status'}
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="done">Done</Select.Item>
					<Select.Item value="skipped">Skipped</Select.Item>
					<Select.Item value="failed">Failed</Select.Item>
				</Select.Content>
			</Select.Root>
		</div>

		<div>
			<Label for="notes">Notes (optional)</Label>
			<Textarea
				id="notes"
				value={notes}
				oninput={(e) => (notes = e.currentTarget.value)}
				placeholder="Add any notes about this entry..."
				maxlength={500}
				rows={4}
			/>
			<p class="mt-1 text-xs text-muted-foreground">{notes.length}/500</p>
		</div>
	</div>

	<div class="flex justify-end gap-2">
		<Button type="button" variant="outline" onclick={onCancel}>Cancel</Button>
		<Button type="submit" disabled={loading}>
			{initialData ? 'Update' : 'Log'} Entry
		</Button>
	</div>
</form>
