import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './+server';
import * as queries from '$lib/server/db/queries';

vi.mock('$lib/server/db/queries', () => ({
	listTemplates: vi.fn()
}));

describe('GET /api/templates', () => {
	const mockTemplates = [
		{
			id: 1,
			name: 'Tasks',
			template_type: 'task' as const,
			description: 'Action items',
			icon: '✓',
			category_config: JSON.stringify({
				name: 'Tasks',
				icon: '✓',
				color: '#3b82f6',
				fields: [{ name: 'Title', field_type: 'text', field_order: 1 }]
			}),
			is_system: true,
			created_at: '2024-01-01 00:00:00'
		},
		{
			id: 2,
			name: 'Chores',
			template_type: 'chore' as const,
			description: 'Recurring tasks',
			icon: '🧹',
			category_config: JSON.stringify({
				name: 'Chores',
				icon: '🧹',
				color: '#10b981',
				fields: [{ name: 'Chore Name', field_type: 'text', field_order: 1 }]
			}),
			is_system: true,
			created_at: '2024-01-01 00:00:00'
		}
	];

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should return 401 if user not authenticated', async () => {
		const url = new URL('http://localhost/api/templates');
		const response = await GET({
			url,
			locals: { user: null }
		} as Parameters<typeof GET>[0]);

		const data = await response.json();
		expect(response.status).toBe(401);
		expect(data.error).toBe('Unauthorized');
	});

	it('should return all templates when no type filter', async () => {
		vi.mocked(queries.listTemplates).mockReturnValue(mockTemplates);

		const url = new URL('http://localhost/api/templates');
		const response = await GET({
			url,
			locals: { user: { id: 1, username: 'test' } }
		} as Parameters<typeof GET>[0]);

		const data = await response.json();
		expect(response.status).toBe(200);
		expect(data.templates).toHaveLength(2);
		expect(queries.listTemplates).toHaveBeenCalledWith(undefined);
	});

	it('should filter templates by task type', async () => {
		const taskTemplate = [mockTemplates[0]];
		vi.mocked(queries.listTemplates).mockReturnValue(taskTemplate);

		const url = new URL('http://localhost/api/templates?type=task');
		const response = await GET({
			url,
			locals: { user: { id: 1, username: 'test' } }
		} as Parameters<typeof GET>[0]);

		const data = await response.json();
		expect(response.status).toBe(200);
		expect(data.templates).toHaveLength(1);
		expect(queries.listTemplates).toHaveBeenCalledWith('task');
	});

	it('should filter templates by chore type', async () => {
		const choreTemplate = [mockTemplates[1]];
		vi.mocked(queries.listTemplates).mockReturnValue(choreTemplate);

		const url = new URL('http://localhost/api/templates?type=chore');
		const response = await GET({
			url,
			locals: { user: { id: 1, username: 'test' } }
		} as Parameters<typeof GET>[0]);

		const data = await response.json();
		expect(response.status).toBe(200);
		expect(data.templates).toHaveLength(1);
		expect(queries.listTemplates).toHaveBeenCalledWith('chore');
	});

	it('should filter templates by habit type', async () => {
		vi.mocked(queries.listTemplates).mockReturnValue([]);

		const url = new URL('http://localhost/api/templates?type=habit');
		const response = await GET({
			url,
			locals: { user: { id: 1, username: 'test' } }
		} as Parameters<typeof GET>[0]);

		expect(response.status).toBe(200);
		expect(queries.listTemplates).toHaveBeenCalledWith('habit');
	});

	it('should return 400 for invalid type parameter', async () => {
		const url = new URL('http://localhost/api/templates?type=invalid');
		const response = await GET({
			url,
			locals: { user: { id: 1, username: 'test' } }
		} as Parameters<typeof GET>[0]);

		const data = await response.json();
		expect(response.status).toBe(400);
		expect(data.error).toBe('Invalid template type');
	});
});
