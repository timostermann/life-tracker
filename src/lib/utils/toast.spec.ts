import { describe, expect, it, vi } from 'vitest';

vi.mock('svelte-sonner', () => {
	return {
		toast: {
			success: vi.fn(),
			info: vi.fn(),
			warning: vi.fn(),
			error: vi.fn()
		}
	};
});

describe('$lib/utils/toast', () => {
	it('success() sets duration=3000 and closeButton=true by default', async () => {
		const { toast } = await import('./toast');
		const { toast: sonnerToast } = await import('svelte-sonner');

		toast.success('ok');

		expect(sonnerToast.success).toHaveBeenCalledWith('ok', { duration: 3000, closeButton: true });
	});

	it('error() sets duration=Infinity and closeButton=true by default', async () => {
		const { toast } = await import('./toast');
		const { toast: sonnerToast } = await import('svelte-sonner');

		toast.error('nope');

		expect(sonnerToast.error).toHaveBeenCalledWith('nope', {
			duration: Infinity,
			closeButton: true
		});
	});

	it('allows overriding defaults', async () => {
		const { toast } = await import('./toast');
		const { toast: sonnerToast } = await import('svelte-sonner');

		toast.warning('warn', { duration: 1234, closeButton: false });

		expect(sonnerToast.warning).toHaveBeenCalledWith('warn', {
			duration: 1234,
			closeButton: false
		});
	});
});
