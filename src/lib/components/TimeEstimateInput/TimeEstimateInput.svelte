<script lang="ts">
	import { Input } from '$lib/components/ui/Input';
	import { Label } from '$lib/components/ui/Label';
	import Button from '$lib/components/ui/Button/Button.svelte';

	type Props = {
		value?: number | null;
		onValueChange?: (value: number | null) => void;
		label?: string;
		id?: string;
	};

	let { value = null, onValueChange, label = 'Time Estimate', id }: Props = $props();

	const presets = [15, 30, 60, 120];

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const num = parseInt(target.value, 10);
		if (!isNaN(num) && num > 0) {
			onValueChange?.(num);
		} else if (target.value === '') {
			onValueChange?.(null);
		}
	}

	function setPreset(minutes: number) {
		onValueChange?.(minutes);
	}
</script>

<div class="space-y-2">
	{#if label}
		<Label for={id}>{label}</Label>
	{/if}
	<div class="flex gap-2">
		<Input
			{id}
			type="number"
			min="1"
			step="1"
			value={value ?? ''}
			oninput={handleInput}
			placeholder="Minutes"
			class="flex-1"
		/>
	</div>
	<div class="flex flex-wrap gap-2">
		{#each presets as preset (preset)}
			<Button
				type="button"
				variant="outline"
				size="sm"
				onclick={() => setPreset(preset)}
				class="text-xs"
			>
				{preset}m
			</Button>
		{/each}
	</div>
</div>
