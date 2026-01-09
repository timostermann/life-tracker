<script lang="ts">
	import { cn } from '$lib/utils';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import PriorityBadge from '$lib/components/PriorityBadge/PriorityBadge.svelte';

	type Props = {
		title: string;
		description?: string;
		priority?: 'urgent' | 'high' | 'medium' | 'low';
		dueDate?: Date;
		completed?: boolean;
		categoryColor?: string;
		ontoggle?: () => void;
		onclick?: () => void;
	};

	let {
		title,
		description,
		priority,
		dueDate,
		completed = false,
		categoryColor,
		ontoggle,
		onclick
	}: Props = $props();

	// Format due date
	let formattedDueDate = $derived(
		dueDate
			? new Intl.DateTimeFormat('en-US', {
					month: 'short',
					day: 'numeric',
					year: 'numeric'
				}).format(dueDate)
			: null
	);

	// Generate unique ID for accessibility
	let descriptionId = $derived(`item-desc-${Math.random().toString(36).substr(2, 9)}`);

	// Determine element type
	let ElementType = $derived(onclick ? 'button' : 'article');
</script>

<svelte:element
	this={ElementType}
	class={cn(
		'flex gap-3 rounded-lg border border-gray-200 p-4 text-left',
		completed && 'opacity-60',
		onclick && 'cursor-pointer transition-colors hover:bg-gray-50'
	)}
	role={ElementType === 'article' ? 'article' : undefined}
	aria-describedby={description ? descriptionId : undefined}
	{onclick}
	onkeydown={(e) => {
		if (onclick && (e.key === 'Enter' || e.key === ' ')) {
			e.preventDefault();
			onclick();
		}
	}}
>
	<!-- Checkbox -->
	{#if ontoggle}
		<div class="pt-0.5">
			<Checkbox
				checked={completed}
				onCheckedChange={ontoggle}
				aria-label="Mark as {completed ? 'incomplete' : 'complete'}"
			/>
		</div>
	{/if}

	<!-- Category color indicator -->
	{#if categoryColor}
		<div class="pt-1.5">
			<div class="h-4 w-1 rounded-full" style="background-color: {categoryColor}"></div>
		</div>
	{/if}

	<!-- Content -->
	<div class="flex-1 space-y-2">
		<!-- Title and Priority -->
		<div class="flex items-start justify-between gap-2">
			<h3 class={cn('text-base font-medium', completed && 'line-through')}>
				{title}
			</h3>
			{#if priority}
				<PriorityBadge {priority} showLabel={false} />
			{/if}
		</div>

		<!-- Description -->
		{#if description}
			<p id={descriptionId} class="text-sm text-gray-600">
				{description}
			</p>
		{/if}

		<!-- Due Date -->
		{#if dueDate}
			<time datetime={dueDate.toISOString()} class="text-xs text-gray-500">
				Due: {formattedDueDate}
			</time>
		{/if}
	</div>
</svelte:element>
