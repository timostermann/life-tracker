<script lang="ts">
	import type { ApiTokenListItem } from '$lib/schemas/db';
	import { DashboardSection } from '$lib/components/DashboardSection';
	import { Button } from '$lib/components/ui/Button';
	import { Input } from '$lib/components/ui/Input';
	import { Label } from '$lib/components/ui/Label';
	import { Copy, KeyRound, Trash2 } from 'lucide-svelte';
	import { resolve } from '$app/paths';
	import { invalidateAll } from '$app/navigation';
	import { deleteResource } from '$lib/utils/api';
	import { toast } from 'svelte-sonner';

	type Props = {
		tokens: ApiTokenListItem[];
	};

	let { tokens }: Props = $props();

	let newTokenName = $state('');
	let creating = $state(false);
	let newlyCreatedSecret = $state<string | null>(null);
	let newlyCreatedId = $state<number | null>(null);
	let revokingId = $state<number | null>(null);

	function formatUnix(sec: number): string {
		return new Date(sec * 1000).toLocaleString(undefined, {
			dateStyle: 'medium',
			timeStyle: 'short'
		});
	}

	async function createToken() {
		const name = newTokenName.trim();
		if (!name) {
			toast.error('Please enter a name for this token');
			return;
		}

		creating = true;
		try {
			const res = await fetch(resolve('/api/tokens'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name })
			});
			const body: { id?: number; token?: string; error?: string } = await res.json();
			if (!res.ok) {
				toast.error(body.error ?? 'Failed to create token');
				return;
			}
			if (body.token) {
				newlyCreatedSecret = body.token;
			}
			if (typeof body.id === 'number') {
				newlyCreatedId = body.id;
			}
			newTokenName = '';
			toast.success('Token created — copy it now; it will not be shown again');
			await invalidateAll();
		} catch (e) {
			console.error(e);
			toast.error('Failed to create token');
		} finally {
			creating = false;
		}
	}

	async function copySecret() {
		if (!newlyCreatedSecret) return;
		try {
			await navigator.clipboard.writeText(newlyCreatedSecret);
			toast.success('Copied to clipboard');
		} catch {
			toast.error('Could not copy — copy manually');
		}
	}

	function dismissSecret() {
		newlyCreatedSecret = null;
		newlyCreatedId = null;
	}

	async function revokeToken(id: number) {
		revokingId = id;
		const result = await deleteResource<{ message?: string }>(resolve(`/api/tokens/${id}`), {
			successMessage: 'API token revoked'
		});
		revokingId = null;
		if (result.success && newlyCreatedId === id) {
			dismissSecret();
		}
	}
</script>

<DashboardSection title="API access" hasItems={true}>
	<div class="space-y-6">
		<p class="text-sm text-muted-foreground">
			Use an API token with
			<code class="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">Authorization: Bearer …</code>
			for scripts or assistants. Tokens act as your user account.
		</p>

		{#if newlyCreatedSecret}
			<div
				class="space-y-3 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 dark:border-amber-400/40 dark:bg-amber-950/40"
				role="status"
			>
				<p class="text-sm font-medium text-amber-900 dark:text-amber-100">
					Copy this token now — you will not see it again.
				</p>
				<div class="flex flex-wrap items-center gap-2">
					<code
						class="max-w-full min-w-[12rem] flex-1 overflow-x-auto rounded border bg-background px-2 py-1.5 font-mono text-xs break-all"
					>
						{newlyCreatedSecret}
					</code>
					<Button type="button" variant="secondary" size="sm" onclick={copySecret}>
						<Copy class="mr-1.5 size-4" />
						Copy
					</Button>
					<Button type="button" variant="ghost" size="sm" onclick={dismissSecret}>Dismiss</Button>
				</div>
			</div>
		{/if}

		<div class="flex flex-col gap-3 sm:flex-row sm:items-end">
			<div class="min-w-0 flex-1 space-y-2">
				<Label for="api-token-name">New token name</Label>
				<Input
					id="api-token-name"
					type="text"
					placeholder="e.g. Home assistant"
					autocomplete="off"
					bind:value={newTokenName}
					disabled={creating}
				/>
			</div>
			<Button type="button" onclick={createToken} disabled={creating} class="shrink-0">
				<KeyRound class="mr-2 size-4" />
				{creating ? 'Creating…' : 'Generate token'}
			</Button>
		</div>

		{#if tokens.length > 0}
			<div class="space-y-2">
				<h3 class="text-sm font-semibold text-muted-foreground">Active tokens</h3>
				<ul class="divide-y rounded-lg border">
					{#each tokens as t (t.id)}
						<li class="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5">
							<div class="min-w-0">
								<p class="font-medium">{t.name}</p>
								<p class="text-xs text-muted-foreground">
									Created {formatUnix(t.created_at)}
									{#if t.last_used_at != null}
										· Last used {formatUnix(t.last_used_at)}
									{:else}
										· Never used
									{/if}
								</p>
							</div>
							<Button
								type="button"
								variant="outline"
								size="sm"
								class="text-destructive hover:bg-destructive/10 hover:text-destructive"
								disabled={revokingId !== null}
								onclick={() => revokeToken(t.id)}
							>
								<Trash2 class="mr-1.5 size-4" />
								{revokingId === t.id ? 'Revoking…' : 'Revoke'}
							</Button>
						</li>
					{/each}
				</ul>
			</div>
		{:else}
			<p class="text-sm text-muted-foreground">No API tokens yet.</p>
		{/if}
	</div>
</DashboardSection>
