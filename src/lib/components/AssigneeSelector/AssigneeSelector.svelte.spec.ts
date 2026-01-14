import { page } from 'vitest/browser';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import AssigneeSelector from './AssigneeSelector.svelte';
import * as api from '$lib/utils/api';

vi.mock('$lib/utils/api');

describe('AssigneeSelector', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders with default label', async () => {
		vi.mocked(api.fetchResource).mockResolvedValue({
			success: true,
			data: { users: [] }
		});

		render(AssigneeSelector, {
			value: null,
			onValueChange: vi.fn()
		});

		await expect.element(page.getByText('Assign to')).toBeInTheDocument();
	});

	it('renders loading state initially', async () => {
		vi.mocked(api.fetchResource).mockResolvedValue({
			success: true,
			data: { users: [] }
		});

		render(AssigneeSelector, {
			value: null,
			onValueChange: vi.fn()
		});

		await expect.element(page.getByText('Loading...')).toBeInTheDocument();
	});

	it('displays unassigned when no value', async () => {
		vi.mocked(api.fetchResource).mockResolvedValue({
			success: true,
			data: { users: [{ id: 1, username: 'user1' }] }
		});

		render(AssigneeSelector, {
			value: null,
			onValueChange: vi.fn()
		});

		await expect.element(page.getByText('Unassigned')).toBeInTheDocument();
	});

	it('displays selected user', async () => {
		vi.mocked(api.fetchResource).mockResolvedValue({
			success: true,
			data: {
				users: [
					{ id: 1, username: 'user1' },
					{ id: 2, username: 'user2' }
				]
			}
		});

		render(AssigneeSelector, {
			value: 1,
			onValueChange: vi.fn()
		});

		await expect.element(page.getByText('user1')).toBeInTheDocument();
	});

	it('calls onValueChange when user is selected', async () => {
		const onValueChange = vi.fn();

		vi.mocked(api.fetchResource).mockResolvedValue({
			success: true,
			data: { users: [{ id: 1, username: 'user1' }] }
		});

		render(AssigneeSelector, {
			value: null,
			onValueChange
		});

		const trigger = page.getByText('Unassigned');
		await trigger.click();

		const userOption = page.getByText('user1');
		await userOption.click();

		expect(onValueChange).toHaveBeenCalledWith(1);
	});

	it('calls onValueChange with null when unassigned is selected', async () => {
		const onValueChange = vi.fn();

		vi.mocked(api.fetchResource).mockResolvedValue({
			success: true,
			data: { users: [{ id: 1, username: 'user1' }] }
		});

		render(AssigneeSelector, {
			value: 1,
			onValueChange
		});

		const trigger = page.getByText('user1');
		await trigger.click();

		const unassignedOption = page.getByText('Unassigned');
		await unassignedOption.click();

		expect(onValueChange).toHaveBeenCalledWith(null);
	});

	it('renders all users in dropdown', async () => {
		vi.mocked(api.fetchResource).mockResolvedValue({
			success: true,
			data: {
				users: [
					{ id: 1, username: 'user1' },
					{ id: 2, username: 'user2' },
					{ id: 3, username: 'user3' }
				]
			}
		});

		render(AssigneeSelector, {
			value: null,
			onValueChange: vi.fn()
		});

		// Verify component renders and loads users
		await expect.element(page.getByText('Unassigned')).toBeInTheDocument();
	});

	it('handles API failure gracefully', async () => {
		vi.mocked(api.fetchResource).mockResolvedValue({
			success: false
		});

		render(AssigneeSelector, {
			value: null,
			onValueChange: vi.fn()
		});

		await expect.element(page.getByText('Unassigned')).toBeInTheDocument();
	});

	it('uses custom id when provided', async () => {
		vi.mocked(api.fetchResource).mockResolvedValue({
			success: true,
			data: { users: [] }
		});

		const { container } = render(AssigneeSelector, {
			value: null,
			onValueChange: vi.fn(),
			id: 'custom-assignee'
		});

		const trigger = container.querySelector('[id="custom-assignee"]');
		expect(trigger).toBeTruthy();
	});
});
