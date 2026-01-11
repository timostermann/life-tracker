<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/Button';
	import * as Dialog from '$lib/components/ui/Dialog';
	import * as Tabs from '$lib/components/ui/Tabs';
	import { CategoryList } from '$lib/components/CategoryList';
	import { CategoryForm } from '$lib/components/CategoryForm';
	import { DeleteCategoryDialog } from '$lib/components/DeleteCategoryDialog';
	import { Plus } from 'lucide-svelte';
	import { useCategoryActions } from './useCategoryActions.svelte';

	let { data }: { data: PageData } = $props();

	const actions = useCategoryActions();
</script>

<svelte:head>
	<title>Categories - Life Tracker</title>
</svelte:head>

<div class="container mx-auto py-8">
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Categories</h1>
			<p class="mt-2 text-muted-foreground">Manage your task, chore, and habit categories</p>
		</div>
		<Button onclick={actions.openCreate}>
			<Plus class="mr-2 size-4" />
			New Category
		</Button>
	</div>

	<Tabs.Root value="owned" class="w-full">
		<Tabs.List class="mb-4">
			<Tabs.Trigger value="owned">
				My Categories ({data.categories.owned.length})
			</Tabs.Trigger>
			<Tabs.Trigger value="shared">
				Shared with me ({data.categories.shared.length})
			</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="owned">
			<CategoryList
				categories={data.categories.owned}
				onEdit={actions.handleEdit}
				onDelete={actions.handleDeleteClick}
			/>
		</Tabs.Content>

		<Tabs.Content value="shared">
			{#if data.categories.shared.length === 0}
				<div class="flex flex-col items-center justify-center py-12 text-center">
					<p class="text-lg text-muted-foreground">No shared categories yet</p>
					<p class="text-sm text-muted-foreground">Categories shared with you will appear here</p>
				</div>
			{:else}
				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each data.categories.shared as category (category.id)}
						<div class="rounded-lg border p-4">
							<div class="flex items-center gap-3">
								{#if category.icon}
									<span class="text-2xl">{category.icon}</span>
								{/if}
								<div>
									<h3 class="text-lg font-semibold">{category.name}</h3>
									<p class="text-sm text-muted-foreground capitalize">
										{category.template_type} · {category.permission}
									</p>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</Tabs.Content>
	</Tabs.Root>
</div>

<Dialog.Dialog bind:open={actions.createDialogOpen.value}>
	<Dialog.Content class="max-h-[90vh] max-w-2xl overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title>Create Category</Dialog.Title>
			<Dialog.Description>Create a new category for tasks, chores, or habits</Dialog.Description>
		</Dialog.Header>
		<CategoryForm mode="create" onSubmit={actions.handleCreate} onCancel={actions.cancelCreate} />
	</Dialog.Content>
</Dialog.Dialog>

<Dialog.Dialog bind:open={actions.editDialogOpen.value}>
	<Dialog.Content class="max-h-[90vh] max-w-2xl overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title>Edit Category</Dialog.Title>
			<Dialog.Description>Update your category settings and fields</Dialog.Description>
		</Dialog.Header>
		{#if actions.selectedCategory}
			<CategoryForm
				mode="edit"
				initialData={actions.selectedCategory}
				onSubmit={actions.handleUpdate}
				onCancel={actions.cancelEdit}
			/>
		{/if}
	</Dialog.Content>
</Dialog.Dialog>

<DeleteCategoryDialog
	bind:open={actions.deleteDialogOpen.value}
	categoryName={actions.selectedCategory?.name ?? ''}
	onConfirm={actions.confirmDelete}
	onCancel={actions.cancelDelete}
/>
