# E2E Test Setup

This directory contains end-to-end tests for the Life Tracker application using Playwright.

## Separate Test Database

The E2E tests use a **completely separate test database** (`.data/db.test.sqlite`) that is isolated from your development database (`.data/db.sqlite`).

### Why Separate Databases?

✅ **No interference** - Tests never touch your development data  
✅ **Clean slate** - Test database is recreated before each test run  
✅ **Debuggable** - Can inspect test database after failures  
✅ **Realistic** - Uses actual SQLite file, not in-memory  
✅ **Safe** - Can run tests while developing without conflicts

## Test Database Lifecycle

### 1. Global Setup (Before All Tests)

`global-setup.ts` runs once before all tests and:

1. Deletes any existing `.data/db.test.sqlite`
2. Creates a fresh test database
3. Runs all migrations
4. Seeds test users (`tim` and `jule`)
5. Waits for web server to be ready

### 2. Per-Test Cleanup (Before Each Test)

`fixtures.ts` runs before each test and:

1. Logs in as both test users
2. Fetches all categories
3. Deletes all categories (safe because it's the test database)
4. Gives each test a clean slate

### 3. Test Execution

Your test runs with:

- Clean database (no leftover data from previous tests)
- Seeded users (tim & jule)
- Fresh migrations applied

### 4. After Tests

The test database persists so you can:

- Inspect it after test failures
- Debug issues manually
- See what state the database ended in

### Usage

All E2E test files should import from `./fixtures.ts` instead of directly from `@playwright/test`:

```typescript
// ❌ Old way
import { test, expect } from '@playwright/test';

// ✅ New way
import { test, expect } from './fixtures';
```

This ensures automatic cleanup runs before your tests.

### Configuration

The Playwright config (`playwright.config.ts`) is configured to:

- Use an in-memory database (`:memory:`) for tests
- Reuse the existing server on local development
- Run tests in parallel (except in CI where workers = 1)
- Run the global setup before all tests

### Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- e2e/tasks.spec.ts

# Run with specific browser
npm run test:e2e -- --project=chromium

# Run in headed mode (see browser)
npm run test:e2e -- --headed

# Debug mode
npm run test:e2e -- --debug
```

### Troubleshooting

**Tests fail with "strict mode violation"**

- This typically means duplicate test data wasn't cleaned up
- The fixtures should handle this automatically
- If it persists, you can manually restart the dev server to get a fresh database

**Cleanup timeouts**

- The cleanup uses short timeouts (5 seconds) and catches errors
- Non-authenticated tests (like health checks) will skip cleanup gracefully

**Database not resetting between runs**

- The test database is completely recreated by global setup before each test suite run
- Individual tests clean up categories before they run (via fixtures)
- If you need to manually reset: delete `.data/db.test.sqlite` and re-run tests

### Best Practices

1. **Keep tests independent**: Don't assume data from previous tests exists
2. **Don't rely on specific IDs**: IDs will change as test data is created/deleted
3. **Use unique names per test**: Avoid naming conflicts between parallel tests
4. **Inspect test database after failures**: Check `.data/db.test.sqlite` to debug
5. **Migrations are automatic**: Global setup runs all migrations on test database

### Files

- `global-setup.ts` - Waits for server to be ready before tests start
- `fixtures.ts` - Extended test fixtures with automatic cleanup
- `*.spec.ts` - Individual test files

### Database Configuration

The E2E tests use a separate test database configured in `playwright.config.ts`:

```typescript
webServer: {
  env: {
    DATABASE_PATH: '.data/db.test.sqlite', // Separate test database
    AUTH_SEED_TIM_PASSWORD: 'tim',
    AUTH_SEED_JULE_PASSWORD: 'jule',
    AUTH_COOKIE_SECURE: 'false'
  }
}
```

This ensures:

- **Isolation** - Development database (`.data/db.sqlite`) is never touched
- **Clean state** - Test database is recreated on each test run
- **Debuggable** - Can inspect `.data/db.test.sqlite` after failures
- **Consistent** - Test users (`tim` and `jule`) are always available

### Database Files

```
.data/
├── db.sqlite       # Development database (never touched by tests)
└── db.test.sqlite  # Test database (recreated on each test run)
```

Both files are in `.gitignore` so they won't be committed.
