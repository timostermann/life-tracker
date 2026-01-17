<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/Button';
	import * as Dialog from '$lib/components/ui/Dialog';
	import * as Tabs from '$lib/components/ui/Tabs';
	import { CategoryList } from '$lib/components/CategoryList';
	import { CategoryForm } from '$lib/components/CategoryForm';
	import { DeleteCategoryDialog } from '$lib/components/DeleteCategoryDialog';
	import { ShareCategoryDialog } from '$lib/components/ShareCategoryDialog';
	import { TemplatePicker } from '$lib/components/TemplatePicker';
	import { ApplyTemplateDialog } from '$lib/components/ApplyTemplateDialog';
	import Badge from '$lib/components/ui/Badge/Badge.svelte';
	import { Plus, Users, FileText } from 'lucide-svelte';
	import { useCategoryActions } from './useCategoryActions.svelte';
	import { resolve } from '$app/paths';

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
		<div class="flex gap-2">
			<Button variant="outline" onclick={actions.openTemplatePicker}>
				<FileText class="mr-2 size-4" />
				Use Template
			</Button>
			<Button onclick={actions.openCreate}>
				<Plus class="mr-2 size-4" />
				New Category
			</Button>
		</div>
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
				onShare={actions.openShare}
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
						<a
							href={resolve(`/categories/${category.id}`)}
							class="rounded-lg border p-4 transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
						>
							<div class="flex items-center gap-3">
								{#if category.icon}
									<span class="text-2xl">{category.icon}</span>
								{/if}
								<div>
									<h3 class="text-lg font-semibold">{category.name}</h3>
									<div class="mt-1 flex items-center gap-2">
										<p class="text-sm text-muted-foreground capitalize">{category.template_type}</p>
										<Badge variant="secondary">
											<Users class="mr-1 size-3" />
											Shared ({category.permission})
										</Badge>
									</div>
								</div>
							</div>
						</a>
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

<ShareCategoryDialog
	bind:open={actions.shareDialogOpen.value}
	categoryId={actions.shareCategory?.id ?? 0}
	categoryName={actions.shareCategory?.name ?? ''}
	onClose={actions.closeShare}
/>

<Dialog.Dialog bind:open={actions.templatePickerOpen.value}>
	<Dialog.Content class="max-w-4xl">
		<Dialog.Header>
			<Dialog.Title>Choose a Template</Dialog.Title>
			<Dialog.Description>
				Select a template to quickly create a category with pre-configured fields
			</Dialog.Description>
		</Dialog.Header>
		<TemplatePicker
			templates={data.templates}
			onApply={(templateId) => actions.handleTemplateSelect(templateId, data.templates)}
		/>
	</Dialog.Content>
</Dialog.Dialog>

<ApplyTemplateDialog
	bind:open={actions.applyTemplateDialogOpen.value}
	template={actions.selectedTemplate}
	loading={actions.templateLoading}
	onApply={actions.handleApplyTemplate}
	onCancel={actions.cancelApplyTemplate}
/>
