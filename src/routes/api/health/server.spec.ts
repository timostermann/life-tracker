import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './+server';
import * as dbModule from '$lib/server/db';
import type { Database } from 'better-sqlite3';

vi.mock('$lib/server/db', () => ({
	getDb: vi.fn()
}));

describe('GET /api/health', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns 200 when database is connected', async () => {
		const mockDb: Partial<Database> = {
			prepare: vi.fn().mockReturnValue({
				get: vi.fn().mockReturnValue({ result: 1 })
			})
		};
		vi.mocked(dbModule.getDb).mockReturnValue(mockDb as Database);

		const response = await GET(
			{} as Partial<Parameters<typeof GET>[0]> as Parameters<typeof GET>[0]
		);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.status).toBe('ok');
		expect(data.database).toBe('connected');
		expect(data.timestamp).toBeDefined();
		expect(mockDb.prepare).toHaveBeenCalledWith('SELECT 1');
	});

	it('returns 503 when database fails', async () => {
		vi.mocked(dbModule.getDb).mockImplementation(() => {
			throw new Error('Database connection failed');
		});

		const response = await GET(
			{} as Partial<Parameters<typeof GET>[0]> as Parameters<typeof GET>[0]
		);
		const data = await response.json();

		expect(response.status).toBe(503);
		expect(data.status).toBe('error');
		expect(data.database).toBe('disconnected');
		expect(data.error).toBe('Database connection failed');
	});

	it('returns 503 when query fails', async () => {
		const mockDb: Partial<Database> = {
			prepare: vi.fn().mockReturnValue({
				get: vi.fn().mockImplementation(() => {
					throw new Error('Query failed');
				})
			})
		};
		vi.mocked(dbModule.getDb).mockReturnValue(mockDb as Database);

		const response = await GET(
			{} as Partial<Parameters<typeof GET>[0]> as Parameters<typeof GET>[0]
		);
		const data = await response.json();

		expect(response.status).toBe(503);
		expect(data.status).toBe('error');
		expect(data.database).toBe('disconnected');
		expect(data.error).toBe('Query failed');
	});
});
