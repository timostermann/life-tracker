import { describe, expect, it, vi } from 'vitest';

describe('db bootstrap', () => {
	it('does not connect to Postgres during Vitest module import', async () => {
		vi.resetModules();
		const mod = await import('../db');
		await expect(mod.dbReady).resolves.toBeUndefined();
	});
});
