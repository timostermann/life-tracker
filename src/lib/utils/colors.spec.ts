import { describe, it, expect } from 'vitest';
import { getColorClass, isTailwindColorName, getContrastTextColor } from './colors';

describe('utils/colors', () => {
	describe('isTailwindColorName', () => {
		it('returns true for valid color names', () => {
			expect(isTailwindColorName('red')).toBe(true);
			expect(isTailwindColorName('blue')).toBe(true);
			expect(isTailwindColorName('emerald')).toBe(true);
			expect(isTailwindColorName('slate')).toBe(true);
		});

		it('returns false for invalid color names', () => {
			expect(isTailwindColorName('invalid')).toBe(false);
			expect(isTailwindColorName('red-500')).toBe(false);
			expect(isTailwindColorName('#ff0000')).toBe(false);
		});

		it('returns false for non-string values', () => {
			expect(isTailwindColorName(null)).toBe(false);
			expect(isTailwindColorName(undefined)).toBe(false);
			expect(isTailwindColorName(123)).toBe(false);
			expect(isTailwindColorName({})).toBe(false);
			expect(isTailwindColorName([])).toBe(false);
		});
	});

	describe('getColorClass', () => {
		it('returns correct bg class for valid color', () => {
			expect(getColorClass('blue', 'bg', '500')).toBe('bg-blue-500');
			expect(getColorClass('red', 'bg', '600')).toBe('bg-red-600');
			expect(getColorClass('emerald', 'bg', '300')).toBe('bg-emerald-300');
		});

		it('returns correct text class for valid color', () => {
			expect(getColorClass('blue', 'text', '500')).toBe('text-blue-500');
			expect(getColorClass('purple', 'text', '700')).toBe('text-purple-700');
		});

		it('returns correct border class for valid color', () => {
			expect(getColorClass('green', 'border', '400')).toBe('border-green-400');
		});

		it('returns correct ring class for valid color', () => {
			expect(getColorClass('amber', 'ring', '600')).toBe('ring-amber-600');
		});

		it('uses default shade of 500 when not specified', () => {
			expect(getColorClass('blue', 'bg')).toBe('bg-blue-500');
		});

		it('uses default variant of bg when not specified', () => {
			expect(getColorClass('blue')).toBe('bg-blue-500');
		});

		it('returns gray fallback for null color', () => {
			expect(getColorClass(null, 'bg', '500')).toBe('bg-gray-500');
			expect(getColorClass(null, 'text', '500')).toBe('text-gray-500');
		});

		it('returns gray fallback for undefined color', () => {
			expect(getColorClass(undefined, 'bg', '500')).toBe('bg-gray-500');
			expect(getColorClass(undefined, 'text', '500')).toBe('text-gray-500');
		});

		it('works with all supported color names', () => {
			const colors = [
				'red',
				'orange',
				'amber',
				'yellow',
				'lime',
				'green',
				'emerald',
				'teal',
				'cyan',
				'sky',
				'blue',
				'indigo',
				'violet',
				'purple',
				'fuchsia',
				'pink',
				'rose',
				'slate',
				'gray',
				'zinc',
				'neutral',
				'stone'
			];

			colors.forEach((color) => {
				// @ts-expect-error - testing with valid color names
				expect(getColorClass(color, 'bg', '500')).toBe(`bg-${color}-500`);
			});
		});

		it('works with all supported shades', () => {
			const shades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];

			shades.forEach((shade) => {
				// @ts-expect-error - testing with valid shades
				expect(getColorClass('blue', 'bg', shade)).toBe(`bg-blue-${shade}`);
			});
		});

		it('works with all supported variants', () => {
			expect(getColorClass('blue', 'bg', '500')).toBe('bg-blue-500');
			expect(getColorClass('blue', 'text', '500')).toBe('text-blue-500');
			expect(getColorClass('blue', 'border', '500')).toBe('border-blue-500');
			expect(getColorClass('blue', 'ring', '500')).toBe('ring-blue-500');
		});
	});

	describe('getContrastTextColor', () => {
		it('returns white text for dark colors (shade 500-900)', () => {
			expect(getContrastTextColor('blue', '500')).toBe('text-white');
			expect(getContrastTextColor('red', '600')).toBe('text-white');
			expect(getContrastTextColor('emerald', '700')).toBe('text-white');
			expect(getContrastTextColor('purple', '800')).toBe('text-white');
			expect(getContrastTextColor('gray', '900')).toBe('text-white');
		});

		it('returns dark text for light colors (shade 50-400)', () => {
			expect(getContrastTextColor('blue', '50')).toBe('text-gray-900');
			expect(getContrastTextColor('yellow', '100')).toBe('text-gray-900');
			expect(getContrastTextColor('amber', '200')).toBe('text-gray-900');
			expect(getContrastTextColor('lime', '300')).toBe('text-gray-900');
			expect(getContrastTextColor('cyan', '400')).toBe('text-gray-900');
		});

		it('defaults to white text for shade 500', () => {
			expect(getContrastTextColor('blue')).toBe('text-white');
			expect(getContrastTextColor('red')).toBe('text-white');
		});

		it('returns white text for null/undefined color', () => {
			expect(getContrastTextColor(null)).toBe('text-white');
			expect(getContrastTextColor(undefined)).toBe('text-white');
		});
	});
});
