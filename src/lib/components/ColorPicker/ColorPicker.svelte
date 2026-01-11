<script lang="ts">
	import type { TailwindColorName } from '$lib/schemas/categories';
	import { cn, getColorClass, getContrastTextColor } from '$lib/utils';
	import { Check } from 'lucide-svelte';

	type Props = {
		value?: TailwindColorName;
		onchange?: (color: TailwindColorName) => void;
	};

	let { value = $bindable(), onchange }: Props = $props();

	const TAILWIND_COLORS: Array<{ name: TailwindColorName; label: string }> = [
		{ name: 'red', label: 'Red' },
		{ name: 'orange', label: 'Orange' },
		{ name: 'amber', label: 'Amber' },
		{ name: 'yellow', label: 'Yellow' },
		{ name: 'lime', label: 'Lime' },
		{ name: 'green', label: 'Green' },
		{ name: 'emerald', label: 'Emerald' },
		{ name: 'teal', label: 'Teal' },
		{ name: 'cyan', label: 'Cyan' },
		{ name: 'sky', label: 'Sky' },
		{ name: 'blue', label: 'Blue' },
		{ name: 'indigo', label: 'Indigo' },
		{ name: 'violet', label: 'Violet' },
		{ name: 'purple', label: 'Purple' },
		{ name: 'fuchsia', label: 'Fuchsia' },
		{ name: 'pink', label: 'Pink' }
	];

	function selectColor(color: TailwindColorName) {
		value = color;
		onchange?.(color);
	}
</script>

<div class="space-y-2">
	<div class="grid grid-cols-8 gap-2">
		{#each TAILWIND_COLORS as color (color.name)}
			<button
				type="button"
				class={cn(
					'relative size-10 rounded-md transition-all hover:scale-110',
					'focus:ring-2 focus:ring-offset-2 focus:outline-none',
					'border-2',
					getColorClass(color.name, 'bg', '500'),
					getColorClass(color.name, 'border', '600'),
					value === color.name
						? ['ring-2 ring-offset-2', getColorClass(color.name, 'ring', '600')]
						: 'border-transparent'
				)}
				aria-label={color.label}
				aria-pressed={value === color.name}
				title={color.label}
				onclick={() => selectColor(color.name)}
			>
				{#if value === color.name}
					<Check class={cn('absolute inset-0 m-auto size-5', getContrastTextColor(color.name))} />
				{/if}
			</button>
		{/each}
	</div>
	{#if value}
		<p class="text-sm text-muted-foreground">
			Selected: <span class="font-medium capitalize">{value}</span>
		</p>
	{/if}
</div>
