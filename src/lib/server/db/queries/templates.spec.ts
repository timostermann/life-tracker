import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { listTemplates, getTemplateById } from './templates';
import type { Db } from './utils';

describe('Template Queries', () => {
	let db: Db;

	beforeEach(() => {
		db = new Database(':memory:');

		db.exec(`
			CREATE TABLE templates (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT NOT NULL,
				template_type TEXT NOT NULL CHECK(template_type IN ('task', 'chore', 'habit')),
				description TEXT,
				icon TEXT,
				category_config TEXT NOT NULL,
				is_system BOOLEAN NOT NULL DEFAULT 0,
				created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
			);
		`);

		db.prepare(
			`INSERT INTO templates (name, template_type, description, icon, category_config, is_system)
			VALUES (?, ?, ?, ?, ?, ?)`
		).run(
			'Tasks',
			'task',
			'Action items with priorities',
			'✓',
			JSON.stringify({
				name: 'Tasks',
				icon: '✓',
				color: '#3b82f6',
				fields: [
					{ name: 'Title', field_type: 'text', field_order: 1 },
					{ name: 'Description', field_type: 'text', field_order: 2 }
				]
			}),
			1
		);

		db.prepare(
			`INSERT INTO templates (name, template_type, description, icon, category_config, is_system)
			VALUES (?, ?, ?, ?, ?, ?)`
		).run(
			'Chores',
			'chore',
			'Recurring household tasks',
			'🧹',
			JSON.stringify({
				name: 'Chores',
				icon: '🧹',
				color: '#10b981',
				fields: [
					{ name: 'Chore Name', field_type: 'text', field_order: 1 },
					{ name: 'Notes', field_type: 'text', field_order: 2 }
				]
			}),
			1
		);

		db.prepare(
			`INSERT INTO templates (name, template_type, description, icon, category_config, is_system)
			VALUES (?, ?, ?, ?, ?, ?)`
		).run(
			'Habits',
			'habit',
			'Daily habit tracking',
			'📈',
			JSON.stringify({
				name: 'Habits',
				icon: '📈',
				color: '#8b5cf6',
				fields: [
					{ name: 'Habit Name', field_type: 'text', field_order: 1 },
					{ name: 'Goal', field_type: 'text', field_order: 2 },
					{ name: 'Is Good Habit', field_type: 'boolean', field_order: 3 }
				]
			}),
			1
		);
	});

	afterEach(() => {
		db.close();
	});

	describe('listTemplates', () => {
		it('should return all templates when no type filter', () => {
			const templates = listTemplates(undefined, db);
			expect(templates).toHaveLength(3);
			expect(templates.map((t) => t.name)).toEqual(['Tasks', 'Chores', 'Habits']);
		});

		it('should filter templates by task type', () => {
			const templates = listTemplates('task', db);
			expect(templates).toHaveLength(1);
			expect(templates[0].name).toBe('Tasks');
			expect(templates[0].template_type).toBe('task');
		});

		it('should filter templates by chore type', () => {
			const templates = listTemplates('chore', db);
			expect(templates).toHaveLength(1);
			expect(templates[0].name).toBe('Chores');
			expect(templates[0].template_type).toBe('chore');
		});

		it('should filter templates by habit type', () => {
			const templates = listTemplates('habit', db);
			expect(templates).toHaveLength(1);
			expect(templates[0].name).toBe('Habits');
			expect(templates[0].template_type).toBe('habit');
		});

		it('should return templates ordered by id', () => {
			const templates = listTemplates(undefined, db);
			expect(templates[0].id).toBe(1);
			expect(templates[1].id).toBe(2);
			expect(templates[2].id).toBe(3);
		});

		it('should parse category_config as valid JSON string', () => {
			const templates = listTemplates(undefined, db);
			const config = JSON.parse(templates[0].category_config);
			expect(config).toHaveProperty('name');
			expect(config).toHaveProperty('icon');
			expect(config).toHaveProperty('color');
			expect(config).toHaveProperty('fields');
			expect(Array.isArray(config.fields)).toBe(true);
		});
	});

	describe('getTemplateById', () => {
		it('should return template when found', () => {
			const template = getTemplateById(1, db);
			expect(template).toBeDefined();
			expect(template?.name).toBe('Tasks');
		});

		it('should return undefined when not found', () => {
			const template = getTemplateById(999, db);
			expect(template).toBeUndefined();
		});

		it('should return template with valid category_config', () => {
			const template = getTemplateById(1, db);
			expect(template).toBeDefined();
			const config = JSON.parse(template!.category_config);
			expect(config.fields).toHaveLength(2);
			expect(config.fields[0].name).toBe('Title');
		});
	});
});
