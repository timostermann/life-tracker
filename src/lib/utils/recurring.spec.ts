import { describe, it, expect } from 'vitest';
import {
	parseRecurringConfig,
	stringifyRecurringConfig,
	calculateNextDate,
	formatRecurringConfig
} from './recurring';

describe('parseRecurringConfig', () => {
	it('should parse valid daily config', () => {
		const result = parseRecurringConfig('{"frequency":"daily","interval":1}');
		expect(result).toEqual({ frequency: 'daily', interval: 1 });
	});

	it('should parse valid weekly config', () => {
		const result = parseRecurringConfig('{"frequency":"weekly","interval":2}');
		expect(result).toEqual({ frequency: 'weekly', interval: 2 });
	});

	it('should parse valid monthly config', () => {
		const result = parseRecurringConfig('{"frequency":"monthly","interval":3}');
		expect(result).toEqual({ frequency: 'monthly', interval: 3 });
	});

	it('should return null for null input', () => {
		const result = parseRecurringConfig(null);
		expect(result).toBeNull();
	});

	it('should return null for empty string', () => {
		const result = parseRecurringConfig('');
		expect(result).toBeNull();
	});

	it('should return null for invalid JSON', () => {
		const result = parseRecurringConfig('not json');
		expect(result).toBeNull();
	});

	it('should return null for invalid frequency', () => {
		const result = parseRecurringConfig('{"frequency":"yearly","interval":1}');
		expect(result).toBeNull();
	});

	it('should return null for zero interval', () => {
		const result = parseRecurringConfig('{"frequency":"daily","interval":0}');
		expect(result).toBeNull();
	});

	it('should return null for negative interval', () => {
		const result = parseRecurringConfig('{"frequency":"daily","interval":-1}');
		expect(result).toBeNull();
	});

	it('should return null for non-numeric interval', () => {
		const result = parseRecurringConfig('{"frequency":"daily","interval":"one"}');
		expect(result).toBeNull();
	});

	it('should return null for missing frequency', () => {
		const result = parseRecurringConfig('{"interval":1}');
		expect(result).toBeNull();
	});

	it('should return null for missing interval', () => {
		const result = parseRecurringConfig('{"frequency":"daily"}');
		expect(result).toBeNull();
	});
});

describe('stringifyRecurringConfig', () => {
	it('should stringify valid config', () => {
		const result = stringifyRecurringConfig({ frequency: 'daily', interval: 1 });
		expect(result).toBe('{"frequency":"daily","interval":1}');
	});

	it('should return null for null input', () => {
		const result = stringifyRecurringConfig(null);
		expect(result).toBeNull();
	});
});

describe('calculateNextDate', () => {
	it('should add 1 day for daily frequency', () => {
		const from = new Date('2026-01-12T10:00:00Z');
		const result = calculateNextDate({ frequency: 'daily', interval: 1 }, from);
		expect(result.toISOString()).toBe('2026-01-13T10:00:00.000Z');
	});

	it('should add 3 days for daily with interval 3', () => {
		const from = new Date('2026-01-12T10:00:00Z');
		const result = calculateNextDate({ frequency: 'daily', interval: 3 }, from);
		expect(result.toISOString()).toBe('2026-01-15T10:00:00.000Z');
	});

	it('should add 1 week for weekly frequency', () => {
		const from = new Date('2026-01-12T10:00:00Z');
		const result = calculateNextDate({ frequency: 'weekly', interval: 1 }, from);
		expect(result.toISOString()).toBe('2026-01-19T10:00:00.000Z');
	});

	it('should add 2 weeks for weekly with interval 2', () => {
		const from = new Date('2026-01-12T10:00:00Z');
		const result = calculateNextDate({ frequency: 'weekly', interval: 2 }, from);
		expect(result.toISOString()).toBe('2026-01-26T10:00:00.000Z');
	});

	it('should add 1 month for monthly frequency', () => {
		const from = new Date('2026-01-12T10:00:00Z');
		const result = calculateNextDate({ frequency: 'monthly', interval: 1 }, from);
		expect(result.toISOString()).toBe('2026-02-12T10:00:00.000Z');
	});

	it('should add 3 months for monthly with interval 3', () => {
		const from = new Date('2026-01-12T10:00:00Z');
		const result = calculateNextDate({ frequency: 'monthly', interval: 3 }, from);
		// Check that it's approximately 3 months later (DST can affect time)
		expect(result.getFullYear()).toBe(2026);
		expect(result.getMonth()).toBe(3); // April (0-indexed)
		expect(result.getDate()).toBe(12);
	});

	it('should use current date when from is not provided', () => {
		const before = new Date();
		const result = calculateNextDate({ frequency: 'daily', interval: 1 });
		const after = new Date();

		// Result should be within 1 second of now + 1 day
		const expectedMin = new Date(before);
		expectedMin.setDate(expectedMin.getDate() + 1);
		expectedMin.setSeconds(expectedMin.getSeconds() - 1);

		const expectedMax = new Date(after);
		expectedMax.setDate(expectedMax.getDate() + 1);
		expectedMax.setSeconds(expectedMax.getSeconds() + 1);

		expect(result.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime());
		expect(result.getTime()).toBeLessThanOrEqual(expectedMax.getTime());
	});

	it('should handle month end correctly', () => {
		const from = new Date('2026-01-31T10:00:00Z');
		const result = calculateNextDate({ frequency: 'monthly', interval: 1 }, from);
		// JavaScript Date handles this - Feb 31 becomes Mar 3 in non-leap year
		expect(result.getMonth()).toBe(2); // March (0-indexed)
	});
});

describe('formatRecurringConfig', () => {
	it('should format daily with interval 1 as "Daily"', () => {
		const result = formatRecurringConfig({ frequency: 'daily', interval: 1 });
		expect(result).toBe('Daily');
	});

	it('should format weekly with interval 1 as "Weekly"', () => {
		const result = formatRecurringConfig({ frequency: 'weekly', interval: 1 });
		expect(result).toBe('Weekly');
	});

	it('should format monthly with interval 1 as "Monthly"', () => {
		const result = formatRecurringConfig({ frequency: 'monthly', interval: 1 });
		expect(result).toBe('Monthly');
	});

	it('should format daily with interval 2 as "Every 2 days"', () => {
		const result = formatRecurringConfig({ frequency: 'daily', interval: 2 });
		expect(result).toBe('Every 2 days');
	});

	it('should format weekly with interval 3 as "Every 3 weeks"', () => {
		const result = formatRecurringConfig({ frequency: 'weekly', interval: 3 });
		expect(result).toBe('Every 3 weeks');
	});

	it('should format monthly with interval 4 as "Every 4 months"', () => {
		const result = formatRecurringConfig({ frequency: 'monthly', interval: 4 });
		expect(result).toBe('Every 4 months');
	});
});
