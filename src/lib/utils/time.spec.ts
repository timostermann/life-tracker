import { describe, it, expect } from 'vitest';
import { formatMinutes } from './time';

describe('formatMinutes', () => {
	describe('edge cases', () => {
		it('should return "0m" for null', () => {
			expect(formatMinutes(null)).toBe('0m');
		});

		it('should return "0m" for undefined', () => {
			expect(formatMinutes(undefined)).toBe('0m');
		});

		it('should return "0m" for 0 minutes', () => {
			expect(formatMinutes(0)).toBe('0m');
		});

		it('should return "0m" for negative minutes', () => {
			expect(formatMinutes(-10)).toBe('0m');
			expect(formatMinutes(-100)).toBe('0m');
		});

		it('should floor decimal minutes', () => {
			expect(formatMinutes(45.9)).toBe('45m');
			expect(formatMinutes(90.5)).toBe('1h 30m');
		});
	});

	describe('minutes only', () => {
		it('should format 1 minute', () => {
			expect(formatMinutes(1)).toBe('1m');
		});

		it('should format minutes less than an hour', () => {
			expect(formatMinutes(15)).toBe('15m');
			expect(formatMinutes(30)).toBe('30m');
			expect(formatMinutes(45)).toBe('45m');
			expect(formatMinutes(59)).toBe('59m');
		});
	});

	describe('hours only', () => {
		it('should format exactly 1 hour', () => {
			expect(formatMinutes(60)).toBe('1h');
		});

		it('should format multiple hours without minutes', () => {
			expect(formatMinutes(120)).toBe('2h');
			expect(formatMinutes(180)).toBe('3h');
			expect(formatMinutes(240)).toBe('4h');
			expect(formatMinutes(300)).toBe('5h');
		});
	});

	describe('hours and minutes', () => {
		it('should format 1 hour and minutes', () => {
			expect(formatMinutes(61)).toBe('1h 1m');
			expect(formatMinutes(75)).toBe('1h 15m');
			expect(formatMinutes(90)).toBe('1h 30m');
			expect(formatMinutes(119)).toBe('1h 59m');
		});

		it('should format multiple hours and minutes', () => {
			expect(formatMinutes(150)).toBe('2h 30m');
			expect(formatMinutes(200)).toBe('3h 20m');
			expect(formatMinutes(400)).toBe('6h 40m');
			expect(formatMinutes(125)).toBe('2h 5m');
		});

		it('should format large durations', () => {
			expect(formatMinutes(600)).toBe('10h');
			expect(formatMinutes(665)).toBe('11h 5m');
			expect(formatMinutes(1440)).toBe('24h');
			expect(formatMinutes(1500)).toBe('25h');
		});
	});

	describe('real-world examples', () => {
		it('should format typical task durations', () => {
			expect(formatMinutes(5)).toBe('5m');
			expect(formatMinutes(15)).toBe('15m');
			expect(formatMinutes(30)).toBe('30m');
			expect(formatMinutes(45)).toBe('45m');
			expect(formatMinutes(60)).toBe('1h');
			expect(formatMinutes(90)).toBe('1h 30m');
			expect(formatMinutes(120)).toBe('2h');
			expect(formatMinutes(480)).toBe('8h');
		});
	});
});
