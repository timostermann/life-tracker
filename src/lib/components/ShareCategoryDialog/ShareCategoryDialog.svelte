<script lang="ts">
	import * as Dialog from '$lib/components/ui/Dialog';
	import { Button } from '$lib/components/ui/Button';
	import { Label } from '$lib/components/ui/Label';
	import * as Select from '$lib/components/ui/Select';
	import Badge from '$lib/components/ui/Badge/Badge.svelte';
	import { createResource, deleteResource, fetchResource } from '$lib/utils/api';
	import { Users, X } from 'lucide-svelte';

	type UserOption = { id: number; username: string };
	type Share = { user_id: number; username: string; permission: 'view' | 'edit' };

	type Props = {
		open?: boolean;
		categoryId: number;
		categoryName: string;
		onClose?: () => void;
	};

	let { open = $bindable(false), categoryId, categoryName, onClose }: Props = $props();

	let users = $state<UserOption[]>([]);
	let shares = $state<Share[]>([]);
	let loading = $state(false);
	let submitting = $state(false);

	let selectedUserId = $state<string>('');
	let selectedPermission = $state<'view' | 'edit'>('view');
	let revokeConfirmUserId = $state<number | null>(null);
	let revokingUserId = $state<number | null>(null);

	async function loadData() {
		loading = true;
		try {
			const [usersRes, sharesRes] = await Promise.all([
				fetchResource<{ users: UserOption[] }>('/api/users', {
					errorMessage: 'Failed to load users'
				}),
				fetchResource<{ shares: Share[] }>(`/api/categories/${categoryId}/shares`, {
					errorMessage: 'Failed to load shares'
				})
			]);

			if (usersRes.success && usersRes.data) users = usersRes.data.users;
			if (sharesRes.success && sharesRes.data) shares = sharesRes.data.shares;
		} finally {
			loading = false;
		}
	}

	async function handleShare() {
		if (!selectedUserId || submitting) return;
		const userId = Number(selectedUserId);
		if (!Number.isFinite(userId)) return;

		submitting = true;
		try {
			const result = await createResource(
				`/api/categories/${categoryId}/share`,
				{ user_id: userId, permission: selectedPermission },
				{
					successMessage: 'Category shared',
					errorMessage: 'Failed to share category',
					invalidate: true
				}
			);

			if (result.success) {
				selectedUserId = '';
				selectedPermission = 'view';
				revokeConfirmUserId = null;
				await loadData();
			}
		} finally {
			submitting = false;
		}
	}

	async function handleRevoke(userId: number) {
		if (revokingUserId !== null) return;

		revokingUserId = userId;
		try {
			const result = await deleteResource(`/api/categories/${categoryId}/share/${userId}`, {
				successMessage: 'Access revoked',
				errorMessage: 'Failed to revoke access',
				invalidate: true
			});

			if (result.success) {
				revokeConfirmUserId = null;
				await loadData();
			}
		} finally {
			revokingUserId = null;
		}
	}

	$effect(() => {
		if (!open) return;
		if (!categoryId) return;
		void loadData();
	});
</script>

<Dialog.Dialog
	bind:open
	onOpenChange={(v) => {
		if (!v) {
			selectedUserId = '';
			selectedPermission = 'view';
			revokeConfirmUserId = null;
			revokingUserId = null;
			submitting = false;
			onClose?.();
		}
	}}
>
	<Dialog.Content class="max-w-xl">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Users class="size-4" />
				Share “{categoryName}”
			</Dialog.Title>
			<Dialog.Description>Choose a user and permission level.</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-6">
			<div class="grid gap-4 sm:grid-cols-2">
				<div class="space-y-2">
					<Label for="share-user">User</Label>
					<Select.Root type="single" bind:value={selectedUserId}>
						<Select.Trigger id="share-user" data-testid="share-user-trigger">
							{#if selectedUserId}
								{users.find((u) => String(u.id) === selectedUserId)?.username ?? 'Select user'}
							{:else}
								Select user
							{/if}
						</Select.Trigger>
						<Select.Content portalProps={{ disabled: true }} data-testid="share-user-content">
							{#each users as u (u.id)}
								<Select.Item data-testid={`share-user-item-${u.id}`} value={String(u.id)}
									>{u.username}</Select.Item
								>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>

				<div class="space-y-2">
					<Label for="share-permission">Permission</Label>
					<Select.Root type="single" bind:value={selectedPermission}>
						<Select.Trigger id="share-permission">
							{selectedPermission === 'edit' ? 'Edit (can manage items)' : 'View (read-only)'}
						</Select.Trigger>
						<Select.Content portalProps={{ disabled: true }}>
							<Select.Item value="view">View (read-only)</Select.Item>
							<Select.Item value="edit">Edit (can manage items)</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>
			</div>

			<div class="flex justify-end">
				<Button
					data-testid="share-submit"
					onclick={handleShare}
					disabled={!selectedUserId || loading || submitting}
				>
					{submitting ? 'Sharing...' : 'Share'}
				</Button>
			</div>

			<div class="space-y-2">
				<h3 class="text-sm font-semibold">Shared with</h3>

				{#if shares.length === 0}
					<p class="text-sm text-muted-foreground">Not shared with anyone yet.</p>
				{:else}
					<ul class="space-y-2">
						{#each shares as s (s.user_id)}
							<li class="flex items-center justify-between rounded-md border p-3">
								<div class="flex items-center gap-2">
									<span class="font-medium">{s.username}</span>
									<Badge variant="secondary">
										{s.permission}
									</Badge>
								</div>

								{#if revokeConfirmUserId === s.user_id}
									<div class="flex items-center gap-2">
										<Button
											data-testid={`share-confirm-revoke-${s.user_id}`}
											variant="destructive"
											size="sm"
											onclick={() => handleRevoke(s.user_id)}
											disabled={revokingUserId === s.user_id}
										>
											{revokingUserId === s.user_id ? 'Revoking...' : 'Confirm revoke'}
										</Button>
										<Button
											variant="outline"
											size="sm"
											onclick={() => (revokeConfirmUserId = null)}
											aria-label="Cancel revoke"
											disabled={revokingUserId === s.user_id}
										>
											<X class="size-4" />
										</Button>
									</div>
								{:else}
									<Button
										data-testid={`share-revoke-${s.user_id}`}
										variant="outline"
										size="sm"
										onclick={() => (revokeConfirmUserId = s.user_id)}
										disabled={revokingUserId !== null}
									>
										Revoke
									</Button>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</div>

		<Dialog.Footer>
			<Button
				variant="outline"
				onclick={() => {
					open = false;
				}}
			>
				Close
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Dialog>
