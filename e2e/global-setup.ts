import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import type { FullConfig } from '@playwright/test';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Migration definitions
const migrations = [
	{ version: 1, filename: '001_initial_schema.sql' },
	{ version: 2, filename: '002_seed_templates.sql' },
	{ version: 3, filename: '003_lucia_auth.sql' },
	{ version: 4, filename: '004_seed_tasks.sql' },
	{ version: 5, filename: '005_seed_chores.sql' },
	{ version: 6, filename: '006_seed_habits.sql' }
];

/**
 * Run migrations directly by reading SQL files from disk.
 * Cannot use the migrate() function from src/lib/server/db/migrate.ts
 * because it uses import.meta.glob() which is a Vite-specific feature.
 */
function runMigrations(db: Database.Database) {
	const migrationsDir = path.join(projectRoot, 'src/lib/server/db/migrations');

	// Ensure schema_version table exists
	db.exec(`
		CREATE TABLE IF NOT EXISTS schema_version (
			version INTEGER PRIMARY KEY,
			applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
		);
	`);

	// Get already applied migrations
	const applied = new Set(
		db
			.prepare('SELECT version FROM schema_version ORDER BY version ASC')
			.all()
			.map((row: unknown) => (row as { version?: number })?.version)
	);

	// Apply pending migrations
	const pending = migrations.filter((m) => !applied.has(m.version));

	if (pending.length === 0) {
		console.log('  All migrations already applied');
		return;
	}

	console.log(`  Applying ${pending.length} migrations...`);

	db.transaction(() => {
		for (const migration of pending) {
			const sqlPath = path.join(migrationsDir, migration.filename);
			const sql = fs.readFileSync(sqlPath, 'utf-8');
			db.exec(sql);
			db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(migration.version);
			console.log(`  ✓ Applied migration ${migration.version}: ${migration.filename}`);
		}
	})();
}

/**
 * Global setup for E2E tests.
 * This runs once before all tests.
 *
 * 1. Cleans/recreates the test database
 * 2. Runs migrations
 * 3. Waits for web server to be ready (users seeded by server)
 */
async function globalSetup(config: FullConfig) {
	console.log('🧪 E2E Global Setup: Starting...');

	// Setup test database
	const dbPath = process.env.DATABASE_PATH || path.join(projectRoot, '.data/db.test.sqlite');
	const dbDir = path.dirname(dbPath);

	console.log(`📁 Test database: ${dbPath}`);

	// Ensure .data directory exists
	if (!fs.existsSync(dbDir)) {
		fs.mkdirSync(dbDir, { recursive: true });
	}

	// Remove existing test database for clean slate
	if (fs.existsSync(dbPath)) {
		fs.unlinkSync(dbPath);
		console.log('🗑️  Removed existing test database');
	}

	// Create fresh database
	const db = new Database(dbPath);
	db.pragma('foreign_keys = ON');

	// Use DELETE mode for tests (WAL causes disk I/O errors with preview server)
	db.pragma('journal_mode = DELETE');

	console.log('🔄 Running migrations...');
	runMigrations(db);

	// Close database properly
	db.close();
	console.log('✅ Test database ready');
	console.log('   (Test users will be seeded by server startup)');

	// Wait for webServer to be ready
	console.log('⏳ Waiting for web server...');
	const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:4173';
	const maxRetries = 30;
	const retryDelay = 1000;

	for (let i = 0; i < maxRetries; i++) {
		try {
			const response = await fetch(`${baseURL}/api/health`);
			if (response.ok) {
				console.log('✅ Web server is ready');
				return;
			}
		} catch {
			// Server not ready yet
		}

		if (i < maxRetries - 1) {
			await new Promise((resolve) => setTimeout(resolve, retryDelay));
		}
	}

	throw new Error('Server did not become ready in time');
}

export default globalSetup;
