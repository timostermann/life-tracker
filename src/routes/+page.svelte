<script lang="ts">
	import type { PageData } from './$types';
	import { DashboardSection } from '$lib/components/DashboardSection';
	import CategoryCard from '$lib/components/CategoryCard/CategoryCard.svelte';
	import ItemCard from '$lib/components/ItemCard/ItemCard.svelte';
	import { Button } from '$lib/components/ui/Button';
	import { Skeleton } from '$lib/components/ui/Skeleton';
	import { Plus } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { getDaysUntilDue, getItemTitle, getItemDescription } from '$lib/utils/dashboard';
	import { navigating } from '$app/state';

	let { data }: { data: PageData } = $props();

	// navigating is null when not navigating, or an object with from/to/type when navigating
	const isLoading = $derived(navigating?.to?.route.id === '/');
	const hasCategories = $derived(data.categories.length > 0);
	const hasAssignedItems = $derived(
		data.assigned_to_me.urgent.length > 0 ||
			data.assigned_to_me.high.length > 0 ||
			data.assigned_to_me.medium.length > 0 ||
			data.assigned_to_me.low.length > 0
	);
	const hasDueSoon = $derived(data.due_soon.length > 0);
	const hasHabits = $derived(data.habits_today.length > 0);
</script>

<svelte:head>
	<title>Dashboard - Life Tracker</title>
</svelte:head>

<div class="container mx-auto py-8">
	<div class="mb-8">
		<h1 class="text-4xl font-bold">Dashboard</h1>
		<p class="mt-2 text-muted-foreground">Your overview at a glance</p>
	</div>

	<div class="mb-8">
		<Button onclick={() => goto(resolve('/categories'))}>
			<Plus class="mr-2 size-4" />
			Create Category
		</Button>
	</div>

	{#if isLoading}
		<!-- Loading Skeleton -->
		<div class="space-y-12">
			<!-- Recent Categories Skeleton -->
			<section class="space-y-4">
				<div class="flex items-center justify-between">
					<Skeleton class="h-8 w-48" />
					<Skeleton class="h-5 w-24" />
				</div>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each Array(6) as _item, i (i)}
						<Skeleton class="h-32" />
					{/each}
				</div>
			</section>

			<!-- Assigned to Me Skeleton -->
			<section class="space-y-4">
				<Skeleton class="h-8 w-40" />
				<div class="space-y-6">
					{#each Array(2) as _item, i (i)}
						<div class="space-y-2">
							<Skeleton class="h-5 w-24" />
							<Skeleton class="h-24" />
						</div>
					{/each}
				</div>
			</section>

			<!-- Due Soon Skeleton -->
			<section class="space-y-4">
				<Skeleton class="h-8 w-32" />
				<div class="space-y-2">
					{#each Array(3) as _item, i (i)}
						<Skeleton class="h-24" />
					{/each}
				</div>
			</section>

			<!-- Habits Today Skeleton -->
			<section class="space-y-4">
				<Skeleton class="h-8 w-48" />
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each Array(3) as _item, i (i)}
						<Skeleton class="h-28" />
					{/each}
				</div>
			</section>
		</div>
	{:else}
		<!-- Actual Content -->
		<div class="space-y-12">
			<!-- Recent Categories -->
			<DashboardSection
				title="Recent Categories"
				emptyMessage="Create your first category from a template"
				hasItems={hasCategories}
				viewAllHref={resolve('/categories')}
			>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each data.categories as category (category.id)}
						<CategoryCard
							name={category.name}
							icon={category.icon || '📁'}
							color={category.color || '#6b7280'}
							itemCount={category.item_count}
							onclick={() => goto(resolve(`/categories/${category.id}`))}
						/>
					{/each}
				</div>
			</DashboardSection>

			<!-- Assigned to Me -->
			<DashboardSection
				title="Assigned to Me"
				emptyMessage="No tasks assigned to you"
				hasItems={hasAssignedItems}
			>
				<div class="space-y-6">
					{#if data.assigned_to_me.urgent.length > 0}
						<div>
							<h3 class="mb-3 text-sm font-semibold tracking-wide text-red-600 uppercase">
								Urgent
							</h3>
							<div class="space-y-2">
								{#each data.assigned_to_me.urgent as item (item.id)}
									<ItemCard
										title={getItemTitle(item.values)}
										description={getItemDescription(item.values)}
										priority="urgent"
										dueDate={item.deadline ? new Date(item.deadline) : undefined}
										onclick={() => goto(resolve(`/categories/${item.category_id}`))}
									/>
								{/each}
							</div>
						</div>
					{/if}

					{#if data.assigned_to_me.high.length > 0}
						<div>
							<h3 class="mb-3 text-sm font-semibold tracking-wide text-orange-600 uppercase">
								High
							</h3>
							<div class="space-y-2">
								{#each data.assigned_to_me.high as item (item.id)}
									<ItemCard
										title={getItemTitle(item.values)}
										description={getItemDescription(item.values)}
										priority="high"
										dueDate={item.deadline ? new Date(item.deadline) : undefined}
										onclick={() => goto(resolve(`/categories/${item.category_id}`))}
									/>
								{/each}
							</div>
						</div>
					{/if}

					{#if data.assigned_to_me.medium.length > 0}
						<div>
							<h3 class="mb-3 text-sm font-semibold tracking-wide text-blue-600 uppercase">
								Medium
							</h3>
							<div class="space-y-2">
								{#each data.assigned_to_me.medium as item (item.id)}
									<ItemCard
										title={getItemTitle(item.values)}
										description={getItemDescription(item.values)}
										priority="medium"
										dueDate={item.deadline ? new Date(item.deadline) : undefined}
										onclick={() => goto(resolve(`/categories/${item.category_id}`))}
									/>
								{/each}
							</div>
						</div>
					{/if}

					{#if data.assigned_to_me.low.length > 0}
						<div>
							<h3 class="mb-3 text-sm font-semibold tracking-wide text-gray-600 uppercase">Low</h3>
							<div class="space-y-2">
								{#each data.assigned_to_me.low as item (item.id)}
									<ItemCard
										title={getItemTitle(item.values)}
										description={getItemDescription(item.values)}
										priority="low"
										dueDate={item.deadline ? new Date(item.deadline) : undefined}
										onclick={() => goto(resolve(`/categories/${item.category_id}`))}
									/>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</DashboardSection>

			<!-- Due Soon -->
			<DashboardSection title="Due Soon" emptyMessage="You're all caught up!" hasItems={hasDueSoon}>
				<div class="space-y-2">
					{#each data.due_soon as item (item.id)}
						<div class="flex items-start gap-3">
							<ItemCard
								title={getItemTitle(item.values)}
								description={getItemDescription(item.values)}
								priority={item.priority}
								dueDate={item.deadline ? new Date(item.deadline) : undefined}
								onclick={() => goto(resolve(`/categories/${item.category_id}`))}
							/>
							{#if item.deadline}
								<div class="shrink-0 pt-4 text-sm text-muted-foreground">
									{getDaysUntilDue(item.deadline)}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</DashboardSection>

			<!-- Habits Today -->
			<DashboardSection
				title="Habits to Log Today"
				emptyMessage="Start tracking a habit"
				hasItems={hasHabits}
			>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each data.habits_today as habit (habit.id)}
						<button
							type="button"
							class="flex flex-col gap-2 rounded-lg border border-gray-200 p-4 text-left transition-colors hover:bg-gray-50"
							aria-label="Log habit: {getItemTitle(habit.values)}"
							onclick={() => goto(resolve(`/categories/${habit.category_id}`))}
						>
							<h3 class="font-semibold">{getItemTitle(habit.values)}</h3>
							<p class="text-sm text-muted-foreground">Click to log</p>
						</button>
					{/each}
				</div>
			</DashboardSection>
		</div>
	{/if}
</div>
