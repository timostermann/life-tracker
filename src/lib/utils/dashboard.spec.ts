import { describe, expect, it } from 'vitest';
import {
	getDaysUntilDue,
	getOrderedFieldValues,
	getItemTitle,
	getItemDescription
} from './dashboard';

describe('getDaysUntilDue', () => {
	it('should return "Due today" for today', () => {
		const today = new Date();
		const result = getDaysUntilDue(today.toISOString());
		expect(result).toBe('Due today');
	});

	it('should return "Due tomorrow" for tomorrow', () => {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		const result = getDaysUntilDue(tomorrow.toISOString());
		expect(result).toBe('Due tomorrow');
	});

	it('should return "Due in X days" for future dates', () => {
		const future = new Date();
		future.setDate(future.getDate() + 5);
		const result = getDaysUntilDue(future.toISOString());
		expect(result).toBe('Due in 5 days');
	});

	it('should return "Due in 1 day" for singular', () => {
		const future = new Date();
		future.setDate(future.getDate() + 1);
		const result = getDaysUntilDue(future.toISOString());
		expect(result).toBe('Due tomorrow');
	});

	it('should return "Overdue by X days" for past dates', () => {
		const past = new Date();
		past.setDate(past.getDate() - 3);
		const result = getDaysUntilDue(past.toISOString());
		expect(result).toBe('Overdue by 3 days');
	});

	it('should return "Overdue by 1 day" for singular', () => {
		const past = new Date();
		past.setDate(past.getDate() - 1);
		const result = getDaysUntilDue(past.toISOString());
		expect(result).toBe('Overdue by 1 day');
	});
});

describe('getOrderedFieldValues', () => {
	it('should return values sorted by field ID', () => {
		const values = {
			'3': 'third',
			'1': 'first',
			'2': 'second'
		};
		const result = getOrderedFieldValues(values);
		expect(result).toEqual(['first', 'second', 'third']);
	});

	it('should handle empty values', () => {
		const values = {};
		const result = getOrderedFieldValues(values);
		expect(result).toEqual([]);
	});

	it('should handle single value', () => {
		const values = { '1': 'only' };
		const result = getOrderedFieldValues(values);
		expect(result).toEqual(['only']);
	});
});

describe('getItemTitle', () => {
	it('should return first field value as title', () => {
		const values = {
			'1': 'Title Value',
			'2': 'Description'
		};
		const result = getItemTitle(values);
		expect(result).toBe('Title Value');
	});

	it('should return "Untitled" when no values', () => {
		const values = {};
		const result = getItemTitle(values);
		expect(result).toBe('Untitled');
	});

	it('should handle numeric field IDs correctly', () => {
		const values = {
			'10': 'Later Field',
			'2': 'Second Field',
			'1': 'First Field'
		};
		const result = getItemTitle(values);
		expect(result).toBe('First Field');
	});
});

describe('getItemDescription', () => {
	it('should return second field value as description', () => {
		const values = {
			'1': 'Title',
			'2': 'Description Value'
		};
		const result = getItemDescription(values);
		expect(result).toBe('Description Value');
	});

	it('should return undefined when only one field', () => {
		const values = {
			'1': 'Title'
		};
		const result = getItemDescription(values);
		expect(result).toBeUndefined();
	});

	it('should return undefined when no values', () => {
		const values = {};
		const result = getItemDescription(values);
		expect(result).toBeUndefined();
	});

	it('should handle numeric field IDs correctly', () => {
		const values = {
			'10': 'Tenth Field',
			'2': 'Second Field',
			'1': 'First Field'
		};
		const result = getItemDescription(values);
		expect(result).toBe('Second Field');
	});
});
