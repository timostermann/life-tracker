<script lang="ts">
	import { cn } from '$lib/utils';

	type Props = {
		name: string;
		color?: string;
		imageUrl?: string;
		size?: 'sm' | 'md' | 'lg';
	};

	let { name, color = '#94a3b8', imageUrl, size = 'md' }: Props = $props();

	let initials = $derived(
		name
			.split(' ')
			.slice(0, 2)
			.map((word) => word[0])
			.join('')
			.toUpperCase()
	);

	let sizeClass = $derived(
		size === 'sm' ? 'size-6 text-xs' : size === 'lg' ? 'size-12 text-lg' : 'size-8 text-sm'
	);
</script>

<div
	class={cn('flex items-center justify-center rounded-full font-medium', sizeClass)}
	style="background-color: {color}"
	aria-label={name}
	role="img"
>
	{#if imageUrl}
		<img src={imageUrl} alt={name} class="h-full w-full rounded-full object-cover" />
	{:else}
		<span class="text-white">{initials}</span>
	{/if}
</div>
