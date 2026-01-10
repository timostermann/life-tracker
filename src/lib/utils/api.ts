import { toast } from 'svelte-sonner';
import { invalidateAll } from '$app/navigation';

type ApiOptions = {
	successMessage?: string;
	errorMessage?: string;
	onSuccess?: () => void | Promise<void>;
	invalidate?: boolean;
};

export async function apiRequest<T = unknown>(
	url: string,
	options: RequestInit & { successMessage?: string; errorMessage?: string } = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
	try {
		const response = await fetch(url, options);
		const result = await response.json();

		if (!response.ok) {
			const errorMsg = options.errorMessage || result.message || 'Request failed';
			toast.error(errorMsg);
			return { success: false, error: errorMsg };
		}

		if (options.successMessage) {
			toast.success(result.message || options.successMessage);
		}

		return { success: true, data: result };
	} catch (error) {
		const errorMsg = options.errorMessage || 'An error occurred. Please try again.';
		toast.error(errorMsg);
		console.error(`API request error (${url}):`, error);
		return { success: false, error: errorMsg };
	}
}

export async function createResource<TInput, TResult = unknown>(
	endpoint: string,
	data: TInput,
	opts: ApiOptions = {}
): Promise<{ success: boolean; data?: TResult }> {
	const result = await apiRequest<TResult>(endpoint, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
		successMessage: opts.successMessage,
		errorMessage: opts.errorMessage
	});

	if (result.success) {
		await opts.onSuccess?.();
		if (opts.invalidate !== false) await invalidateAll();
	}

	return result;
}

export async function updateResource<TInput, TResult = unknown>(
	endpoint: string,
	data: TInput,
	opts: ApiOptions = {}
): Promise<{ success: boolean; data?: TResult }> {
	const result = await apiRequest<TResult>(endpoint, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
		successMessage: opts.successMessage,
		errorMessage: opts.errorMessage
	});

	if (result.success) {
		await opts.onSuccess?.();
		if (opts.invalidate !== false) await invalidateAll();
	}

	return result;
}

export async function deleteResource<TResult = unknown>(
	endpoint: string,
	opts: ApiOptions = {}
): Promise<{ success: boolean; data?: TResult }> {
	const result = await apiRequest<TResult>(endpoint, {
		method: 'DELETE',
		successMessage: opts.successMessage,
		errorMessage: opts.errorMessage
	});

	if (result.success) {
		await opts.onSuccess?.();
		if (opts.invalidate !== false) await invalidateAll();
	}

	return result;
}

export async function fetchResource<TResult = unknown>(
	endpoint: string,
	opts: Omit<ApiOptions, 'successMessage' | 'invalidate'> = {}
): Promise<{ success: boolean; data?: TResult }> {
	return apiRequest<TResult>(endpoint, {
		method: 'GET',
		errorMessage: opts.errorMessage
	});
}
