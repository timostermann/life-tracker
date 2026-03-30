<script lang="ts">
	import type { PageData } from './$types';
	import { DashboardSection } from '$lib/components/DashboardSection';
	import CategoryCard from '$lib/components/CategoryCard/CategoryCard.svelte';
	import ItemCard from '$lib/components/ItemCard/ItemCard.svelte';
	import { Button } from '$lib/components/ui/Button';
	import { Plus, LogOut } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { getDaysUntilDue, getItemTitle, getItemDescription } from '$lib/utils/dashboard';
	import { apiRequest } from '$lib/utils/api';
	import { DashboardApiTokensSection } from '$lib/components/DashboardApiTokensSection';

	let { data }: { data: PageData } = $props();

	const hasCategories = $derived(data.categories.length > 0);
	const hasAssignedItems = $derived(
		data.assigned_to_me.urgent.length > 0 ||
			data.assigned_to_me.high.length > 0 ||
			data.assigned_to_me.medium.length > 0 ||
			data.assigned_to_me.low.length > 0
	);
	const hasDueSoon = $derived(data.due_soon.length > 0);
	const hasHabits = $derived(data.habits_today.length > 0);

	async function handleLogout() {
		const result = await apiRequest('/api/auth/logout', {
			method: 'POST',
			successMessage: 'Logged out successfully'
		});

		if (result.success) {
			await goto(resolve('/login'));
		}
	}
</script>

<svelte:head>
	<title>Dashboard - Life Tracker</title>
</svelte:head>

<div class="container mx-auto py-8">
	<div class="mb-8 flex items-start justify-between">
		<div>
			<h1 class="text-4xl font-bold">Dashboard</h1>
			<p class="mt-2 text-muted-foreground">Your overview at a glance</p>
		</div>
		<Button variant="outline" onclick={handleLogout}>
			<LogOut class="mr-2 size-4" />
			Logout
		</Button>
	</div>

	<div class="mb-8">
		<Button onclick={() => goto(resolve('/categories'))}>
			<Plus class="mr-2 size-4" />
			Create Category
		</Button>
	</div>

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
						<h3 class="mb-3 text-sm font-semibold tracking-wide text-red-600 uppercase">Urgent</h3>
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
						<h3 class="mb-3 text-sm font-semibold tracking-wide text-orange-600 uppercase">High</h3>
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
						<h3 class="mb-3 text-sm font-semibold tracking-wide text-blue-600 uppercase">Medium</h3>
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
						<h3 class="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
							Low
						</h3>
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
							priority={item.priority ?? undefined}
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
						class="flex flex-col gap-2 rounded-lg border border-border p-4 text-left transition-colors hover:bg-accent/30"
						aria-label="Log habit: {getItemTitle(habit.values)}"
						onclick={() => goto(resolve(`/categories/${habit.category_id}`))}
					>
						<h3 class="font-semibold">{getItemTitle(habit.values)}</h3>
						<div class="flex items-center gap-2 text-sm text-muted-foreground">
							{#if habit.current_streak > 0}
								<span class="font-medium text-green-600">
									🔥 {habit.current_streak} day{habit.current_streak === 1 ? '' : 's'}
								</span>
							{:else}
								<span>Click to log</span>
							{/if}
						</div>
					</button>
				{/each}
			</div>
		</DashboardSection>

		<DashboardApiTokensSection tokens={data.apiTokens} />
	</div>
</div>
