import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './+server';
import * as queries from '$lib/server/db/queries';
import * as db from '$lib/server/db';

vi.mock('$lib/server/db/queries', () => ({
	getTemplateById: vi.fn(),
	createCategory: vi.fn(),
	createField: vi.fn()
}));

vi.mock('$lib/server/db', () => ({
	getDb: vi.fn()
}));

describe('POST /api/templates/:id/apply', () => {
	const mockTemplate = {
		id: 1,
		name: 'Tasks',
		template_type: 'task' as const,
		description: 'Action items',
		icon: '✓',
		category_config: JSON.stringify({
			name: 'Tasks',
			icon: '✓',
			color: '#3b82f6',
			fields: [
				{ name: 'Title', field_type: 'text', field_order: 1 },
				{ name: 'Description', field_type: 'text', field_order: 2 }
			]
		}),
		is_system: true,
		created_at: '2024-01-01 00:00:00'
	};

	const mockCategory = {
		id: 1,
		user_id: 1,
		name: 'My Tasks',
		template_type: 'task' as const,
		icon: '✓',
		color: '#3b82f6',
		is_private: true,
		created_at: '2024-01-01 00:00:00',
		updated_at: '2024-01-01 00:00:00'
	};

	let mockTransaction: ReturnType<typeof vi.fn>;
	let mockDb: {
		begin: ReturnType<typeof vi.fn>;
		transaction: ReturnType<typeof vi.fn>;
		prepare: ReturnType<typeof vi.fn>;
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockTransaction = vi.fn((fn) => fn(mockDb));
		mockDb = {
			begin: mockTransaction,
			transaction: mockTransaction,
			prepare: vi.fn()
		};
		vi.mocked(db.getDb).mockReturnValue(mockDb as unknown as ReturnType<typeof db.getDb>);
	});

	it('should return 401 if user not authenticated', async () => {
		const request = new Request('http://localhost/api/templates/1/apply', {
			method: 'POST',
			body: JSON.stringify({ name: 'My Tasks' })
		});

		const response = await POST({
			params: { id: '1' },
			request,
			locals: { user: null }
		} as Parameters<typeof POST>[0]);

		const data = await response.json();
		expect(response.status).toBe(401);
		expect(data.error).toBe('Unauthorized');
	});

	it('should return 400 for invalid template ID', async () => {
		const request = new Request('http://localhost/api/templates/invalid/apply', {
			method: 'POST',
			body: JSON.stringify({ name: 'My Tasks' })
		});

		const response = await POST({
			params: { id: 'invalid' },
			request,
			locals: { user: { id: 1, username: 'test' } }
		} as Parameters<typeof POST>[0]);

		const data = await response.json();
		expect(response.status).toBe(400);
		expect(data.error).toBe('Invalid template ID');
	});

	it('should return 400 for invalid JSON body', async () => {
		const request = new Request('http://localhost/api/templates/1/apply', {
			method: 'POST',
			body: 'invalid json'
		});

		const response = await POST({
			params: { id: '1' },
			request,
			locals: { user: { id: 1, username: 'test' } }
		} as Parameters<typeof POST>[0]);

		const data = await response.json();
		expect(response.status).toBe(400);
		expect(data.error).toBe('Invalid JSON');
	});

	it('should return 400 for missing name', async () => {
		const request = new Request('http://localhost/api/templates/1/apply', {
			method: 'POST',
			body: JSON.stringify({})
		});

		const response = await POST({
			params: { id: '1' },
			request,
			locals: { user: { id: 1, username: 'test' } }
		} as Parameters<typeof POST>[0]);

		const data = await response.json();
		expect(response.status).toBe(400);
		expect(data.error).toBe('Invalid input');
	});

	it('should return 404 if template not found', async () => {
		vi.mocked(queries.getTemplateById).mockReturnValue(undefined);

		const request = new Request('http://localhost/api/templates/999/apply', {
			method: 'POST',
			body: JSON.stringify({ name: 'My Tasks' })
		});

		const response = await POST({
			params: { id: '999' },
			request,
			locals: { user: { id: 1, username: 'test' } }
		} as Parameters<typeof POST>[0]);

		const data = await response.json();
		expect(response.status).toBe(404);
		expect(data.error).toBe('Template not found');
	});

	it('should create category from template successfully', async () => {
		vi.mocked(queries.getTemplateById).mockReturnValue(mockTemplate);
		vi.mocked(queries.createCategory).mockReturnValue(mockCategory);
		vi.mocked(queries.createField).mockReturnValue({
			id: 1,
			category_id: 1,
			name: 'Title',
			field_type: 'text',
			options: null,
			field_order: 1,
			created_at: '2024-01-01 00:00:00'
		});

		const request = new Request('http://localhost/api/templates/1/apply', {
			method: 'POST',
			body: JSON.stringify({ name: 'My Tasks' })
		});

		const response = await POST({
			params: { id: '1' },
			request,
			locals: { user: { id: 1, username: 'test' } }
		} as Parameters<typeof POST>[0]);

		const data = await response.json();
		expect(response.status).toBe(201);
		expect(data.category).toEqual(mockCategory);
		expect(data.message).toBe('Category "My Tasks" created successfully');
		expect(mockTransaction).toHaveBeenCalled();
	});

	it('should create all fields from template', async () => {
		vi.mocked(queries.getTemplateById).mockReturnValue(mockTemplate);
		vi.mocked(queries.createCategory).mockReturnValue(mockCategory);
		vi.mocked(queries.createField).mockReturnValue({
			id: 1,
			category_id: 1,
			name: 'Title',
			field_type: 'text',
			options: null,
			field_order: 1,
			created_at: '2024-01-01 00:00:00'
		});

		const request = new Request('http://localhost/api/templates/1/apply', {
			method: 'POST',
			body: JSON.stringify({ name: 'My Tasks' })
		});

		await POST({
			params: { id: '1' },
			request,
			locals: { user: { id: 1, username: 'test' } }
		} as Parameters<typeof POST>[0]);

		expect(queries.createField).toHaveBeenCalledTimes(2);
		expect(queries.createField).toHaveBeenCalledWith(
			expect.objectContaining({
				name: 'Title',
				field_type: 'text',
				field_order: 1
			}),
			mockDb
		);
		expect(queries.createField).toHaveBeenCalledWith(
			expect.objectContaining({
				name: 'Description',
				field_type: 'text',
				field_order: 2
			}),
			mockDb
		);
	});

	it('should use custom name instead of template name', async () => {
		vi.mocked(queries.getTemplateById).mockReturnValue(mockTemplate);
		vi.mocked(queries.createCategory).mockReturnValue(mockCategory);

		const request = new Request('http://localhost/api/templates/1/apply', {
			method: 'POST',
			body: JSON.stringify({ name: 'Custom Name' })
		});

		await POST({
			params: { id: '1' },
			request,
			locals: { user: { id: 1, username: 'test' } }
		} as Parameters<typeof POST>[0]);

		expect(queries.createCategory).toHaveBeenCalledWith(
			expect.objectContaining({
				name: 'Custom Name'
			}),
			mockDb
		);
	});

	it('should handle template with invalid JSON config', async () => {
		const invalidTemplate = {
			...mockTemplate,
			category_config: 'invalid json'
		};
		vi.mocked(queries.getTemplateById).mockReturnValue(invalidTemplate);

		const request = new Request('http://localhost/api/templates/1/apply', {
			method: 'POST',
			body: JSON.stringify({ name: 'My Tasks' })
		});

		const response = await POST({
			params: { id: '1' },
			request,
			locals: { user: { id: 1, username: 'test' } }
		} as Parameters<typeof POST>[0]);

		const data = await response.json();
		expect(response.status).toBe(500);
		expect(data.error).toBe('Invalid template configuration');
	});
});
