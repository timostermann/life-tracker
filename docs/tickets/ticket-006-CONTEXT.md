# Context for Ticket-006: Categories CRUD Implementation

> **Generated:** 2026-01-09  
> **For:** Fresh chat window implementing ticket-006-categories-crud.md

## 🎯 Task Overview

Implement full CRUD operations for categories including:

- API endpoints with Zod validation (GET, POST, PUT, DELETE)
- Categories list page (`/categories`)
- Category form component (create/edit)
- Delete confirmation dialog
- Icon & color pickers
- Comprehensive tests (unit + E2E)

**Dependencies satisfied:** ✅ ticket-002 (DB), ✅ ticket-003 (Auth), ✅ ticket-005 (UI)

---

## 📁 Project Structure

```
life-tracker/
├── src/
│   ├── lib/
│   │   ├── components/          # UI components
│   │   │   ├── CategoryCard/    # Already exists (display only)
│   │   │   └── ui/              # shadcn-svelte components
│   │   ├── schemas/             # Zod schemas
│   │   │   ├── auth.ts          # loginSchema
│   │   │   ├── db.ts            # categorySchema, userSchema, etc.
│   │   │   └── index.ts         # Re-exports
│   │   ├── server/
│   │   │   ├── auth/            # Lucia auth utilities
│   │   │   ├── db/
│   │   │   │   ├── migrations/  # SQL migration files
│   │   │   │   └── queries/     # DB query functions
│   │   │   │       ├── categories.ts  # Category CRUD (partial)
│   │   │   │       ├── fields.ts
│   │   │   │       ├── types.ts
│   │   │   │       └── index.ts
│   │   │   └── logging.ts
│   │   └── utils/               # cn(), toast utilities, types
│   ├── routes/
│   │   ├── api/
│   │   │   ├── auth/            # Existing auth endpoints
│   │   │   └── health/          # Health check
│   │   ├── login/               # Login page
│   │   └── +page.svelte         # Home (placeholder)
│   └── hooks.server.ts          # Auth + route protection
├── docs/tickets/                # All ticket documentation
└── tests/                       # E2E Playwright tests
```

---

## 🗄️ Database Schema

### Categories Table

```sql
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    template_type TEXT NOT NULL CHECK(template_type IN ('task', 'chore', 'habit')),
    icon TEXT,                   -- Emoji or icon name
    color TEXT,                  -- Hex color (e.g., #10b981)
    is_private INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Indexes:** `user_id`, `template_type`, `is_private`

### Fields Table (Related)

```sql
CREATE TABLE fields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    field_type TEXT NOT NULL CHECK(field_type IN ('text', 'number', 'date', 'boolean', 'select')),
    options TEXT,                -- JSON for select options
    field_order INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);
```

---

## 📦 Existing DB Query Functions

**Location:** `src/lib/server/db/queries/categories.ts`

```typescript
// Already implemented:
export function createCategory(input: CreateCategoryInput, db?: Db): Category;
export function listCategoriesOwnedByUser(userId: number, db?: Db): Category[];
export function listCategoriesSharedWithUser(userId: number, db?: Db): SharedCategory[];
export function listCategoriesForUser(
	userId: number,
	db?: Db
): {
	owned: Category[];
	shared: SharedCategory[];
};

// YOU NEED TO ADD:
export function getCategoryById(categoryId: number, db?: Db): Category | null;
export function updateCategory(categoryId: number, input: UpdateCategoryInput, db?: Db): Category;
export function deleteCategory(categoryId: number, db?: Db): void;
```

**Type definitions** (from `src/lib/server/db/queries/types.ts`):

```typescript
export type CreateCategoryInput = {
	user_id: number;
	name: string;
	template_type: 'task' | 'chore' | 'habit';
	icon?: string | null;
	color?: string | null;
	is_private?: boolean;
};

// You'll need to add UpdateCategoryInput
```

---

## 🛡️ Authentication & Route Protection

### Current User Access

```typescript
// In any +page.server.ts or +server.ts
import type { PageServerLoad, RequestHandler } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user; // { id: number; username: string } | null
	if (!user) {
		throw redirect(303, '/login'); // Redundant if hooks.server.ts already protects
	}
	// Use user.id for queries
};
```

### API Route Protection

**All non-public routes are already protected** in `src/hooks.server.ts`:

- If `locals.user` is null and route is not public → redirect to `/login` or return 401 for API
- API routes starting with `/api/` that aren't `/api/auth/*` or `/api/health` require authentication

### Getting User in API Endpoints

```typescript
// src/routes/api/categories/+server.ts
export const POST: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const userId = user.id; // Use this for createCategory
	// ...
};
```

---

## 📝 Zod Schemas

### Existing (in `src/lib/schemas/db.ts`)

```typescript
import { z } from 'zod';

export const templateTypeSchema = z.enum(['task', 'chore', 'habit']);
export const fieldTypeSchema = z.enum(['text', 'number', 'date', 'boolean', 'select']);

export const categorySchema = z.object({
	id: z.number().int().positive(),
	user_id: z.number().int().positive(),
	name: z.string().min(1),
	template_type: templateTypeSchema,
	icon: z.string().nullable().optional(),
	color: z.string().nullable().optional(),
	is_private: z.union([z.boolean(), z.number().int().min(0).max(1)]).transform((v) => Boolean(v)),
	created_at: z.string().min(1),
	updated_at: z.string().min(1)
});
export type Category = z.infer<typeof categorySchema>;

export const fieldSchema = z.object({
	id: z.number().int().positive(),
	category_id: z.number().int().positive(),
	name: z.string().min(1),
	field_type: fieldTypeSchema,
	options: z.string().nullable().optional(),
	field_order: z.number().int(),
	created_at: z.string().min(1)
});
export type Field = z.infer<typeof fieldSchema>;
```

### YOU NEED TO ADD (create new file: `src/lib/schemas/categories.ts`)

```typescript
import { z } from 'zod';
import { templateTypeSchema, fieldTypeSchema } from './db';

// Field definition for category creation/update
export const categoryFieldSchema = z.object({
	name: z.string().min(1).max(100),
	field_type: fieldTypeSchema,
	options: z.string().optional(), // JSON string for select options
	field_order: z.number().int().default(0)
});

// Create category
export const createCategorySchema = z.object({
	name: z.string().min(1).max(100),
	template_type: templateTypeSchema,
	icon: z.string().optional(),
	color: z
		.string()
		.regex(/^#[0-9A-F]{6}$/i)
		.optional(),
	is_private: z.boolean().default(true),
	fields: z.array(categoryFieldSchema).default([])
});

// Update category (all fields optional)
export const updateCategorySchema = z.object({
	name: z.string().min(1).max(100).optional(),
	icon: z.string().optional(),
	color: z
		.string()
		.regex(/^#[0-9A-F]{6}$/i)
		.optional(),
	is_private: z.boolean().optional(),
	fields: z.array(categoryFieldSchema).optional()
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
```

**Don't forget to export from `src/lib/schemas/index.ts`:**

```typescript
export * from './categories';
```

---

## 🔌 API Endpoints Pattern

### Example: Existing Login Endpoint

**File:** `src/routes/api/auth/login/+server.ts`

```typescript
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { loginSchema } from '$lib/schemas';
import { getUserByUsername } from '$lib/server/db/queries';
import { lucia, setLuciaSessionCookie } from '$lib/server/auth';
import { verifyPassword } from '$lib/server/auth/password';
import { createLogger } from '$lib/server/logging';

const logger = createLogger('auth');

export const POST: RequestHandler = async ({ request, cookies }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	const parsed = loginSchema.safeParse(body);
	if (!parsed.success) {
		return json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 });
	}

	const { username, password } = parsed.data;
	const user = getUserByUsername(username);
	if (!user) {
		logger.info('login failed (unknown user)', { username });
		return json({ error: 'Invalid username or password' }, { status: 401 });
	}

	const ok = await verifyPassword(user.password_hash, password);
	if (!ok) {
		logger.info('login failed (bad password)', { username });
		return json({ error: 'Invalid username or password' }, { status: 401 });
	}

	const session = await lucia.createSession(String(user.id), {});
	setLuciaSessionCookie(cookies, session.id);
	logger.info('login success', { userId: user.id, username: user.username });

	return json({ ok: true });
};
```

### Pattern for Categories Endpoints

**Create:** `src/routes/api/categories/+server.ts`

```typescript
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createCategorySchema } from '$lib/schemas/categories';
import { createCategory, listCategoriesForUser } from '$lib/server/db/queries';

// GET /api/categories - List user's categories
export const GET: RequestHandler = async ({ locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const categories = listCategoriesForUser(user.id);
	return json({ categories });
};

// POST /api/categories - Create category
export const POST: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	const parsed = createCategorySchema.safeParse(body);
	if (!parsed.success) {
		return json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 });
	}

	const category = createCategory({
		user_id: user.id,
		...parsed.data
	});

	return json(
		{
			category,
			toast: 'success',
			message: 'Category created successfully'
		},
		{ status: 201 }
	);
};
```

**Update/Delete:** `src/routes/api/categories/[id]/+server.ts`

```typescript
export const GET: RequestHandler = async ({ params, locals }) => { ... }
export const PUT: RequestHandler = async ({ params, request, locals }) => { ... }
export const DELETE: RequestHandler = async ({ params, locals }) => { ... }
```

---

## 🎨 Available UI Components

All components are in `src/lib/components/ui/` and follow **Svelte 5** syntax.

### shadcn-svelte Components (Installed)

**Import pattern:**

```typescript
import { Button } from '$lib/components/ui/button';
import { Input } from '$lib/components/ui/input';
import { Label } from '$lib/components/ui/label';
import { Checkbox } from '$lib/components/ui/checkbox';
import { Textarea } from '$lib/components/ui/textarea';
import * as Dialog from '$lib/components/ui/dialog';
import * as Select from '$lib/components/ui/select';
import * as Card from '$lib/components/ui/card';
import { Badge } from '$lib/components/ui/badge';
import { Separator } from '$lib/components/ui/separator';
import * as Calendar from '$lib/components/ui/calendar';
```

**Dialog Example:**

```svelte
<Dialog.Dialog bind:open={isOpen}>
	<Dialog.Trigger asChild let:builder>
		<Button builders={[builder]}>Open Dialog</Button>
	</Dialog.Trigger>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Are you sure?</Dialog.Title>
			<Dialog.Description>This action cannot be undone.</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (isOpen = false)}>Cancel</Button>
			<Button variant="destructive" onclick={handleDelete}>Delete</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Dialog>
```

### Custom Components

**CategoryCard** (read-only display, already exists):

```svelte
<script>
	import { CategoryCard } from '$lib/components/CategoryCard';
</script>

<CategoryCard
	name="My Tasks"
	icon="📋"
	color="#3b82f6"
	itemCount={5}
	onclick={() => console.log('clicked')}
/>
```

**Other custom components:**

- `PriorityBadge` - Display priority levels
- `AssigneeAvatar` - Show user avatars
- `ItemCard` - Display items (tasks/chores/habits)

---

## 🎭 Svelte 5 Patterns (REQUIRED)

### Props Definition

```svelte
<script lang="ts">
	type Props = {
		name: string;
		count?: number; // Optional
	};

	let { name, count = 0 }: Props = $props();
</script>
```

### State Management

```svelte
<script lang="ts">
	let isOpen = $state(false);
	let items = $state<string[]>([]);
</script>
```

### Derived Values

```svelte
<script lang="ts">
	let count = $state(0);
	let doubled = $derived(count * 2);
</script>
```

### Event Handlers (lowercase!)

```svelte
<button onclick={() => count++}>Increment</button>
<input oninput={(e) => (name = e.currentTarget.value)} />
```

### Snippets (Svelte 5 replacement for slots)

```svelte
{#snippet header()}
	<h1>Title</h1>
{/snippet}

{@render header()}
```

---

## 🧪 Testing Patterns

### Unit Tests (Co-located `.spec.ts` files)

**Location:** Same folder as component (e.g., `CategoryCard/CategoryCard.svelte.spec.ts`)

**Pattern:**

```typescript
import { page } from 'vitest/browser';
import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import MyComponent from './MyComponent.svelte';

describe('MyComponent', () => {
	it('renders with correct props', async () => {
		render(MyComponent, {
			name: 'Test',
			count: 5
		});

		await expect.element(page.getByText('Test')).toBeInTheDocument();
		await expect.element(page.getByText('5')).toBeInTheDocument();
	});

	it('calls onclick when clicked', async () => {
		const onclick = vi.fn();
		render(MyComponent, { name: 'Test', onclick });

		await page.getByRole('button').click();
		expect(onclick).toHaveBeenCalledOnce();
	});
});
```

**Run tests:**

```bash
npm run test:unit          # Run all unit tests
npm run test:unit -- --run # Run once (CI mode)
npm test                   # Run unit + E2E tests
```

### E2E Tests (Playwright)

**Location:** `tests/` folder (e.g., `tests/categories.spec.ts`)

**Pattern:**

```typescript
import { test, expect } from '@playwright/test';

test('user can create a category', async ({ page }) => {
	// Login
	await page.goto('/login');
	await page.fill('input[name="username"]', 'tim');
	await page.fill('input[name="password"]', 'test123');
	await page.click('button[type="submit"]');

	// Navigate to categories
	await page.goto('/categories');

	// Create category
	await page.click('text=New Category');
	await page.fill('input[name="name"]', 'My Tasks');
	await page.selectOption('select[name="template_type"]', 'task');
	await page.click('button[type="submit"]');

	// Verify
	await expect(page.locator('text=My Tasks')).toBeVisible();
});
```

---

## 🍞 Toast Notifications

**Already configured** via `svelte-sonner` (ticket-004).

**Usage in API responses:**

```typescript
return json(
	{
		category,
		toast: 'success', // or 'error', 'info', 'warning'
		message: 'Category created successfully'
	},
	{ status: 201 }
);
```

**Client-side handling** (already set up in `hooks.client.ts`):

```typescript
import { toast } from 'svelte-sonner';

async function createCategory(data) {
	const res = await fetch('/api/categories', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	});

	const result = await res.json();

	if (result.toast && result.message) {
		toast[result.toast](result.message);
	}

	return result;
}
```

---

## 🚨 Code Quality Rules

### TypeScript

- **Use `type` instead of `interface`** (enforced by ESLint)
- **Use inline type imports:** `import { type MyType } from '...'`
- **All props must be typed**

### File Naming

- **Components:** PascalCase (e.g., `CategoryCard.svelte`)
- **Tests:** Co-located with `.spec.ts` suffix (e.g., `CategoryCard.svelte.spec.ts`)
- **API routes:** Use SvelteKit conventions (`+server.ts`, `+page.server.ts`)

### Export Patterns

**Component folders** use `export * from` or named exports:

```typescript
// src/lib/components/CategoryForm/index.ts
export * from './CategoryForm.svelte';
```

### Comments

- **Remove unnecessary comments** (e.g., "Get initials from name")
- Only keep comments that add value (e.g., explaining complex logic, workarounds)

### Formatting

```bash
npm run format  # Prettier + plugins (Tailwind, Svelte)
npm run lint    # ESLint
npm run check   # svelte-check (TypeScript)
```

---

## 📋 Implementation Checklist

### 1. Create Zod Schemas ✅

- [ ] Create `src/lib/schemas/categories.ts`
- [ ] Add `createCategorySchema`, `updateCategorySchema`
- [ ] Export from `src/lib/schemas/index.ts`
- [ ] Add unit tests for schemas

### 2. Extend DB Queries ✅

- [ ] Add `getCategoryById()` to `src/lib/server/db/queries/categories.ts`
- [ ] Add `updateCategory()`
- [ ] Add `deleteCategory()`
- [ ] Add `UpdateCategoryInput` type to `types.ts`
- [ ] Add unit tests for new query functions

### 3. Create API Endpoints ✅

- [ ] `GET /api/categories` - List categories
- [ ] `POST /api/categories` - Create category
- [ ] `GET /api/categories/[id]` - Get single category
- [ ] `PUT /api/categories/[id]` - Update category
- [ ] `DELETE /api/categories/[id]` - Delete category
- [ ] Add co-located `.spec.ts` for each endpoint
- [ ] Verify ownership checks (users can only modify their own categories)

### 4. Create UI Components ✅

- [ ] `CategoryForm.svelte` - Create/edit form (with icon/color pickers)
- [ ] `CategoryList.svelte` - Display categories grid
- [ ] `DeleteCategoryDialog.svelte` - Confirmation dialog
- [ ] Add unit tests for each component

### 5. Create Pages ✅

- [ ] `/categories` page (`src/routes/categories/+page.svelte`)
- [ ] Load categories via `+page.server.ts`
- [ ] Handle create/edit/delete actions

### 6. Add E2E Tests ✅

- [ ] Test category creation flow
- [ ] Test category editing
- [ ] Test category deletion with confirmation
- [ ] Test validation errors

### 7. Polish ✅

- [ ] Loading states during API calls
- [ ] Error handling with toast notifications
- [ ] Accessibility audit (keyboard nav, ARIA labels)
- [ ] Responsive design

---

## 🔑 Key Implementation Notes

### Ownership Validation

**Always verify the user owns the category before updating/deleting:**

```typescript
const category = getCategoryById(categoryId);
if (!category || category.user_id !== user.id) {
	return json({ error: 'Category not found' }, { status: 404 });
}
```

### Field Management

Categories can have dynamic fields. When creating/updating:

1. **Create category first**
2. **Then create/update fields** referencing `category_id`
3. Use transactions if implementing this in one go

### Icon Picker

Simple approach for MVP:

- Use a text input for emoji
- Or provide a predefined list of emojis in a Select

### Color Picker

Simple approach for MVP:

- Provide predefined colors (e.g., Tailwind colors)
- Or use `<input type="color" />`

### Template Type

**Cannot be changed after creation** (locked via DB schema logic). Only allow selection during creation.

---

## 🎯 Quick Start Commands

```bash
# Start dev server
npm run dev

# Run tests
npm run test:unit           # Unit tests only
npm run test:e2e            # E2E tests only
npm test                    # All tests

# Code quality
npm run check               # TypeScript check
npm run lint                # Lint
npm run format              # Format

# Database
docker compose up -d        # Start sqlite-web (optional, view DB at localhost:8080)
```

---

## 📚 Reference Files

**Read these for patterns:**

- `src/routes/api/auth/login/+server.ts` - API endpoint pattern
- `src/lib/components/CategoryCard/CategoryCard.svelte` - Component pattern
- `src/lib/components/CategoryCard/CategoryCard.svelte.spec.ts` - Test pattern
- `src/lib/server/db/queries/categories.ts` - DB query pattern
- `src/hooks.server.ts` - Auth protection logic

**Key documentation:**

- `docs/tickets/ticket-006-categories-crud.md` - Full ticket spec
- `docs/tickets/ticket-005-ui-foundation.md` - Component patterns
- `docs/tickets/ticket-002-db-schema.md` - Database schema
- `docs/tickets/ticket-003-auth.md` - Auth patterns

---

## ✨ Final Tips

1. **Start with API endpoints** - They're the foundation
2. **Use existing test patterns** - Look at `CategoryCard.svelte.spec.ts`
3. **Keep it simple for MVP** - Icon picker can just be emoji input
4. **Test as you go** - Don't wait until the end
5. **Use TypeScript strictly** - It'll save debugging time
6. **Follow Svelte 5 syntax** - No old `let:` bindings, use `$props()` and `$state()`

---

## 🚀 You're Ready!

All dependencies are in place. The project follows clear patterns. Start with the API endpoints, then build the UI. Test thoroughly. Good luck! 🎉
