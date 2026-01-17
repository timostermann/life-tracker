import { describe, it, expect } from 'vitest';
import { parseTemplateConfig, getDefaultCategoryName } from './templates';
import type { Template } from '$lib/schemas';

describe('parseTemplateConfig', () => {
	it('should parse valid template config', () => {
		const configJson = JSON.stringify({
			name: 'Test Template',
			icon: '✓',
			color: '#3b82f6',
			fields: [
				{ name: 'Title', field_type: 'text', field_order: 1 },
				{ name: 'Description', field_type: 'text', field_order: 2 }
			]
		});

		const result = parseTemplateConfig(configJson);
		expect(result).not.toBeNull();
		expect(result?.name).toBe('Test Template');
		expect(result?.icon).toBe('✓');
		expect(result?.color).toBe('#3b82f6');
		expect(result?.fields).toHaveLength(2);
	});

	it('should parse config without optional fields', () => {
		const configJson = JSON.stringify({
			name: 'Simple Template',
			fields: []
		});

		const result = parseTemplateConfig(configJson);
		expect(result).not.toBeNull();
		expect(result?.name).toBe('Simple Template');
		expect(result?.icon).toBeUndefined();
		expect(result?.color).toBeUndefined();
		expect(result?.fields).toEqual([]);
	});

	it('should return null for invalid JSON', () => {
		const result = parseTemplateConfig('invalid json');
		expect(result).toBeNull();
	});

	it('should return null for missing name field', () => {
		const configJson = JSON.stringify({
			icon: '✓',
			fields: []
		});

		const result = parseTemplateConfig(configJson);
		expect(result).toBeNull();
	});

	it('should return null for invalid field structure', () => {
		const configJson = JSON.stringify({
			name: 'Test',
			fields: [{ invalid: 'structure' }]
		});

		const result = parseTemplateConfig(configJson);
		expect(result).toBeNull();
	});

	it('should validate field_type enum', () => {
		const configJson = JSON.stringify({
			name: 'Test',
			fields: [{ name: 'Field', field_type: 'invalid', field_order: 1 }]
		});

		const result = parseTemplateConfig(configJson);
		expect(result).toBeNull();
	});
});

describe('getDefaultCategoryName', () => {
	it('should return name from config when available', () => {
		const template: Template = {
			id: 1,
			name: 'Template Name',
			template_type: 'task',
			description: 'Test',
			icon: '✓',
			category_config: JSON.stringify({ name: 'Config Name', fields: [] }),
			is_system: true,
			created_at: '2026-01-15T00:00:00Z'
		};

		const result = getDefaultCategoryName(template);
		expect(result).toBe('Config Name');
	});

	it('should fall back to template name when config parsing fails', () => {
		const template: Template = {
			id: 1,
			name: 'Template Name',
			template_type: 'task',
			description: 'Test',
			icon: '✓',
			category_config: 'invalid json',
			is_system: true,
			created_at: '2026-01-15T00:00:00Z'
		};

		const result = getDefaultCategoryName(template);
		expect(result).toBe('Template Name');
	});

	it('should fall back to template name when config has no name', () => {
		const template: Template = {
			id: 1,
			name: 'Template Name',
			template_type: 'task',
			description: 'Test',
			icon: '✓',
			category_config: JSON.stringify({ fields: [] }),
			is_system: true,
			created_at: '2026-01-15T00:00:00Z'
		};

		const result = getDefaultCategoryName(template);
		expect(result).toBe('Template Name');
	});
});
