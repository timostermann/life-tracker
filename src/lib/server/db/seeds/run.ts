import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../../../..');

const args = process.argv.slice(2);
const clearExisting = args.includes('--clear');
const skipIfExists = args.includes('--skip-if-exists');

console.log('🌱 Starting database seeding...\n');

if (clearExisting) console.log('⚠️  Will clear existing categories\n');
if (skipIfExists) console.log('ℹ️  Will skip if categories already exist\n');

try {
	const migrationsDir = path.join(__dirname, '../migrations');
	const migrations = fs
		.readdirSync(migrationsDir)
		.filter((f) => f.endsWith('.sql'))
		.sort();

	const dbPath = process.env.DATABASE_PATH || path.join(projectRoot, '.data/db.sqlite');
	const dbDir = path.dirname(dbPath);

	if (!fs.existsSync(dbDir)) {
		fs.mkdirSync(dbDir, { recursive: true });
	}

	console.log(`Using database: ${dbPath}\n`);

	const db = new Database(dbPath);
	db.pragma('foreign_keys = ON');

	try {
		db.pragma('journal_mode = WAL');
	} catch {
		db.pragma('journal_mode = DELETE');
	}

	db.exec(`
		CREATE TABLE IF NOT EXISTS schema_version (
			version INTEGER PRIMARY KEY,
			applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
		);
	`);

	const applied = new Set(
		db
			.prepare('SELECT version FROM schema_version ORDER BY version')
			.all()
			.map((r: unknown) => {
				if (typeof r === 'object' && r !== null && 'version' in r) return r.version;
				return undefined;
			})
	);

	for (let i = 0; i < migrations.length; i++) {
		const version = i + 1;
		if (!applied.has(version)) {
			const sql = fs.readFileSync(path.join(migrationsDir, migrations[i]), 'utf-8');
			db.exec(sql);
			db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(version);
		}
	}

	const user = db.prepare('SELECT id FROM users WHERE username = ? LIMIT 1').get('tim') as
		| { id: number }
		| undefined;

	if (!user) {
		console.warn('⚠️  User "tim" not found. Create a user first (e.g., via /auth/register).');
		db.close();
		process.exit(0);
	}

	const userId = user.id;

	if (skipIfExists) {
		const result = db
			.prepare('SELECT COUNT(*) as count FROM categories WHERE user_id = ?')
			.get(userId) as { count: number };

		if (result.count > 0) {
			console.log(`User ${userId} already has ${result.count} categories. Skipping seed.`);
			db.close();
			process.exit(0);
		}
	}

	if (clearExisting) {
		const categories = db
			.prepare('SELECT id, name FROM categories WHERE user_id = ?')
			.all(userId) as Array<{ id: number; name: string }>;

		if (categories.length > 0) {
			console.log(`Clearing ${categories.length} existing categories...`);
			db.transaction(() => {
				for (const cat of categories) {
					db.prepare('DELETE FROM categories WHERE id = ?').run(cat.id);
				}
			})();
		}
	}

	const categories = [
		{
			name: 'Work Projects',
			template_type: 'task',
			icon: '📋',
			color: 'blue',
			is_private: true,
			fields: [
				{ name: 'Client Name', field_type: 'text', field_order: 0 },
				{ name: 'Priority', field_type: 'select', options: 'High\nMedium\nLow', field_order: 1 },
				{ name: 'Due Date', field_type: 'date', field_order: 2 }
			]
		},
		{
			name: 'Side Projects',
			template_type: 'task',
			icon: '💡',
			color: 'indigo',
			is_private: true,
			fields: [
				{
					name: 'Status',
					field_type: 'select',
					options: 'Planning\nIn Progress\nOn Hold\nCompleted',
					field_order: 0
				},
				{ name: 'Tech Stack', field_type: 'text', field_order: 1 }
			]
		},
		{
			name: 'Home Maintenance',
			template_type: 'chore',
			icon: '🏠',
			color: 'emerald',
			is_private: true,
			fields: [
				{
					name: 'Room',
					field_type: 'select',
					options: 'Kitchen\nBathroom\nBedroom\nLiving Room\nGarage\nYard',
					field_order: 0
				},
				{ name: 'Last Done', field_type: 'date', field_order: 1 }
			]
		},
		{
			name: 'Meal Planning',
			template_type: 'chore',
			icon: '🍳',
			color: 'orange',
			is_private: false,
			fields: [
				{ name: 'Cuisine', field_type: 'text', field_order: 0 },
				{ name: 'Prep Time (minutes)', field_type: 'number', field_order: 1 },
				{ name: 'Servings', field_type: 'number', field_order: 2 }
			]
		},
		{
			name: 'Fitness Goals',
			template_type: 'habit',
			icon: '💪',
			color: 'purple',
			is_private: true,
			fields: [
				{
					name: 'Exercise Type',
					field_type: 'select',
					options: 'Cardio\nStrength\nFlexibility\nSports',
					field_order: 0
				},
				{ name: 'Duration (minutes)', field_type: 'number', field_order: 1 }
			]
		},
		{
			name: 'Hydration',
			template_type: 'habit',
			icon: '💧',
			color: 'cyan',
			is_private: true,
			fields: [
				{ name: 'Target Glasses', field_type: 'number', field_order: 0 },
				{
					name: 'Time of Day',
					field_type: 'select',
					options: 'Morning\nAfternoon\nEvening',
					field_order: 1
				}
			]
		},
		{
			name: 'Reading List',
			template_type: 'task',
			icon: '📚',
			color: 'rose',
			is_private: true,
			fields: [
				{ name: 'Author', field_type: 'text', field_order: 0 },
				{ name: 'Pages', field_type: 'number', field_order: 1 },
				{
					name: 'Genre',
					field_type: 'select',
					options: 'Fiction\nNon-fiction\nTechnical\nBiography',
					field_order: 2
				}
			]
		},
		{
			name: 'Language Learning',
			template_type: 'habit',
			icon: '🗣️',
			color: 'pink',
			is_private: true,
			fields: [
				{ name: 'Language', field_type: 'text', field_order: 0 },
				{ name: 'Daily Minutes', field_type: 'number', field_order: 1 },
				{ name: 'Resource', field_type: 'text', field_order: 2 }
			]
		},
		{
			name: 'Bad Habits to Break',
			template_type: 'habit',
			icon: '⚠️',
			color: 'red',
			is_private: true,
			fields: [
				{
					name: 'Type',
					field_type: 'select',
					options: 'Caffeine\nAlcohol\nWeed\nSmoking\nSugar\nScreen Time',
					field_order: 0
				},
				{ name: 'Amount/Duration', field_type: 'text', field_order: 1 },
				{ name: 'Trigger/Context', field_type: 'text', field_order: 2 }
			]
		},
		{
			name: 'Daily Wellness',
			template_type: 'habit',
			icon: '🌞',
			color: 'amber',
			is_private: true,
			fields: [
				{
					name: 'Activity',
					field_type: 'select',
					options: 'Going Outside\nStretching\nEarly Wake Up\nMeditation\nDeep Breathing',
					field_order: 0
				},
				{ name: 'Duration (minutes)', field_type: 'number', field_order: 1 },
				{ name: 'Time of Day', field_type: 'text', field_order: 2 }
			]
		},
		{
			name: 'Administrative Tasks',
			template_type: 'task',
			icon: '📋',
			color: 'slate',
			is_private: true,
			fields: [
				{
					name: 'Task Type',
					field_type: 'select',
					options: 'Visa/Passport\nDentist/Medical\nInsurance\nTaxes\nRenewals\nMeetings',
					field_order: 0
				},
				{ name: 'Deadline', field_type: 'date', field_order: 1 },
				{ name: 'Documents Needed', field_type: 'text', field_order: 2 }
			]
		},
		{
			name: 'Health Checkups',
			template_type: 'chore',
			icon: '🏥',
			color: 'teal',
			is_private: true,
			fields: [
				{
					name: 'Type',
					field_type: 'select',
					options: 'Dentist\nEye Doctor\nGeneral Checkup\nSpecialist\nVaccinations',
					field_order: 0
				},
				{ name: 'Last Visit', field_type: 'date', field_order: 1 },
				{ name: 'Next Due', field_type: 'date', field_order: 2 }
			]
		}
	];

	console.log(`Seeding ${categories.length} categories for user ${userId}...`);

	const insertCategory = db.prepare(
		`INSERT INTO categories (user_id, name, template_type, icon, color, is_private)
		VALUES (?, ?, ?, ?, ?, ?)`
	);

	const insertField = db.prepare(
		`INSERT INTO fields (category_id, name, field_type, options, field_order)
		VALUES (?, ?, ?, ?, ?)`
	);

	db.transaction(() => {
		for (const category of categories) {
			const result = insertCategory.run(
				userId,
				category.name,
				category.template_type,
				category.icon,
				category.color,
				category.is_private ? 1 : 0
			);

			const categoryId = Number(result.lastInsertRowid);
			console.log(`  ✓ Created: ${category.name}`);

			for (const field of category.fields) {
				insertField.run(
					categoryId,
					field.name,
					field.field_type,
					field.options || null,
					field.field_order
				);
			}
		}
	})();

	db.close();
	console.log('\n✅ Seeded successfully!');
	process.exit(0);
} catch (error) {
	console.error('\n❌ Error:', error);
	process.exit(1);
}
