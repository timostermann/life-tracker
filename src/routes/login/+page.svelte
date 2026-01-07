<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { fetch as apiFetch, ApiError } from '$lib/api/fetch';
	import { toast } from '$lib/utils/toast';

	import { loginSchema } from '$lib/schemas';

	let username = '';
	let password = '';
	let submitting = false;
	let formError: string | null = null;
	let fieldErrors: Partial<Record<'username' | 'password', string>> = {};

	async function onSubmit(e: SubmitEvent) {
		e.preventDefault();
		formError = null;
		fieldErrors = {};

		const parsed = loginSchema.safeParse({ username, password });
		if (!parsed.success) {
			const flat = parsed.error.flatten();
			fieldErrors.username = flat.fieldErrors.username?.[0];
			fieldErrors.password = flat.fieldErrors.password?.[0];
			formError = 'Please fix the errors and try again.';
			return;
		}

		submitting = true;
		try {
			await apiFetch<{ ok: true }>(
				'/api/auth/login',
				{
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify(parsed.data)
				},
				{ toastOnError: false }
			);

			toast.success('Logged in');
			await goto(resolve('/'));
		} catch (err) {
			if (err instanceof ApiError) {
				formError = err.message || 'Login failed';
				toast.error(formError);
				return;
			}
			formError = 'Network error. Please try again.';
			toast.error(formError);
		} finally {
			submitting = false;
		}
	}
</script>

<main class="mx-auto max-w-md px-6 py-10">
	<h1 class="text-2xl font-semibold">Login</h1>
	<p class="mt-2 text-sm text-zinc-600">Sign in to continue.</p>

	<form class="mt-8 space-y-5" onsubmit={onSubmit} novalidate>
		<div>
			<label class="block text-sm font-medium" for="username">Username</label>
			<input
				class="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
				id="username"
				name="username"
				autocomplete="username"
				disabled={submitting}
				bind:value={username}
				aria-invalid={fieldErrors.username ? 'true' : 'false'}
				aria-describedby={fieldErrors.username ? 'username-error' : undefined}
			/>
			{#if fieldErrors.username}
				<p id="username-error" class="mt-2 text-sm text-red-600">{fieldErrors.username}</p>
			{/if}
		</div>

		<div>
			<label class="block text-sm font-medium" for="password">Password</label>
			<input
				class="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
				id="password"
				name="password"
				type="password"
				autocomplete="current-password"
				disabled={submitting}
				bind:value={password}
				aria-invalid={fieldErrors.password ? 'true' : 'false'}
				aria-describedby={fieldErrors.password ? 'password-error' : undefined}
			/>
			{#if fieldErrors.password}
				<p id="password-error" class="mt-2 text-sm text-red-600">{fieldErrors.password}</p>
			{/if}
		</div>

		{#if formError}
			<p class="text-sm text-red-600" role="alert" aria-live="polite">{formError}</p>
		{/if}

		<button
			class="w-full rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
			type="submit"
			disabled={submitting}
		>
			{submitting ? 'Signing in…' : 'Sign in'}
		</button>
	</form>
</main>
