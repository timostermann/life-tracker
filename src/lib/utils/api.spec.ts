import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createResource, updateResource, deleteResource, fetchResource } from './api';
import { toast } from 'svelte-sonner';
import { invalidateAll } from '$app/navigation';

vi.mock('svelte-sonner');
vi.mock('$app/navigation');

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('api utilities', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('createResource', () => {
		it('creates resource successfully', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ id: 1, message: 'Created' })
			});

			const result = await createResource(
				'/api/test',
				{ name: 'Test' },
				{
					successMessage: 'Success!',
					invalidate: true
				}
			);

			expect(result.success).toBe(true);
			expect(result.data).toEqual({ id: 1, message: 'Created' });
			expect(toast.success).toHaveBeenCalledWith('Created');
			expect(invalidateAll).toHaveBeenCalled();
		});

		it('handles create failure', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				json: async () => ({ message: 'Failed' })
			});

			const result = await createResource(
				'/api/test',
				{ name: 'Test' },
				{
					errorMessage: 'Error!'
				}
			);

			expect(result.success).toBe(false);
			expect(toast.error).toHaveBeenCalledWith('Error!');
		});

		it('handles network error', async () => {
			mockFetch.mockRejectedValueOnce(new Error('Network error'));

			const result = await createResource('/api/test', { name: 'Test' });

			expect(result.success).toBe(false);
			expect(toast.error).toHaveBeenCalled();
		});

		it('skips invalidation when invalidate is false', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ id: 1 })
			});

			await createResource('/api/test', { name: 'Test' }, { invalidate: false });

			expect(invalidateAll).not.toHaveBeenCalled();
		});
	});

	describe('updateResource', () => {
		it('updates resource successfully', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ id: 1, message: 'Updated' })
			});

			const result = await updateResource(
				'/api/test/1',
				{ name: 'Updated' },
				{
					successMessage: 'Success!'
				}
			);

			expect(result.success).toBe(true);
			expect(toast.success).toHaveBeenCalledWith('Updated');
			expect(invalidateAll).toHaveBeenCalled();
		});
	});

	describe('deleteResource', () => {
		it('deletes resource successfully', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ message: 'Deleted' })
			});

			const result = await deleteResource('/api/test/1', {
				successMessage: 'Deleted!'
			});

			expect(result.success).toBe(true);
			expect(toast.success).toHaveBeenCalledWith('Deleted');
			expect(invalidateAll).toHaveBeenCalled();
		});
	});

	describe('fetchResource', () => {
		it('fetches resource successfully', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ data: { id: 1, name: 'Test' } })
			});

			const result = await fetchResource('/api/test/1');

			expect(result.success).toBe(true);
			expect(result.data).toEqual({ data: { id: 1, name: 'Test' } });
			expect(toast.success).not.toHaveBeenCalled();
		});

		it('handles fetch failure', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				json: async () => ({ message: 'Not found' })
			});

			const result = await fetchResource('/api/test/999', {
				errorMessage: 'Failed to load'
			});

			expect(result.success).toBe(false);
			expect(toast.error).toHaveBeenCalledWith('Failed to load');
		});
	});

	describe('onSuccess callback', () => {
		it('calls onSuccess callback when provided', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ id: 1 })
			});

			const onSuccess = vi.fn();
			await createResource('/api/test', { name: 'Test' }, { onSuccess });

			expect(onSuccess).toHaveBeenCalled();
		});

		it('supports async onSuccess callback', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ id: 1 })
			});

			const onSuccess = vi.fn(async () => {
				await new Promise((resolve) => setTimeout(resolve, 10));
			});

			await createResource('/api/test', { name: 'Test' }, { onSuccess });

			expect(onSuccess).toHaveBeenCalled();
		});
	});
});
