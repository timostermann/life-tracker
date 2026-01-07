import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const toastError = vi.fn();

vi.mock('$lib/utils/toast', () => {
	return {
		toast: {
			success: vi.fn(),
			info: vi.fn(),
			warning: vi.fn(),
			error: toastError
		}
	};
});

function jsonResponse(body: unknown, init: ResponseInit) {
	return new Response(JSON.stringify(body), {
		...init,
		headers: { 'content-type': 'application/json', ...(init.headers ?? {}) }
	});
}

describe('$lib/api/fetch', () => {
	beforeEach(() => {
		toastError.mockReset();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('toasts unauthorized for 401 on /api/* excluding /api/auth/*', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => jsonResponse({ error: 'Unauthorized' }, { status: 401 }))
		);

		const { fetch, ApiError } = await import('./fetch');

		await expect(fetch('/api/projects')).rejects.toBeInstanceOf(ApiError);
		expect(toastError).toHaveBeenCalledWith('Unauthorized. Please log in.');
	});

	it('toasts server error message for non-401 errors', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => jsonResponse({ error: 'Boom' }, { status: 500 }))
		);

		const { fetch, ApiError } = await import('./fetch');

		await expect(fetch('/api/projects')).rejects.toBeInstanceOf(ApiError);
		expect(toastError).toHaveBeenCalledWith('Boom');
	});

	it('does not toast when toastOnError=false', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => jsonResponse({ error: 'Boom' }, { status: 500 }))
		);

		const { fetch, ApiError } = await import('./fetch');

		await expect(fetch('/api/projects', undefined, { toastOnError: false })).rejects.toBeInstanceOf(
			ApiError
		);
		expect(toastError).not.toHaveBeenCalled();
	});

	it('toasts network error on fetch throw', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => {
				throw new TypeError('network');
			})
		);

		const { fetch } = await import('./fetch');

		await expect(fetch('/api/projects')).rejects.toBeInstanceOf(TypeError);
		expect(toastError).toHaveBeenCalledWith('Network error. Please try again.');
	});

	it('does not toast unauthorized when toastUnauthorized=false', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => jsonResponse({ error: 'Unauthorized' }, { status: 401 }))
		);

		const { fetch, ApiError } = await import('./fetch');

		await expect(
			fetch('/api/projects', undefined, { toastUnauthorized: false })
		).rejects.toBeInstanceOf(ApiError);
		expect(toastError).not.toHaveBeenCalled();
	});
});
