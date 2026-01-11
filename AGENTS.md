You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat.

### 2. get-documentation

Retrieves full documentation content for specific sections.
After calling list-sections, analyze the use_cases field and fetch ALL relevant sections.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
MUST use this tool whenever writing Svelte code. Keep calling until no issues returned.

### 4. playground-link

Generates a Svelte Playground link. Only call after user confirmation and NEVER for files written to their project.

---

## Codebase Guidelines

### Tech Stack

- **Framework**: SvelteKit with Svelte 5 (runes: `$state`, `$effect`, `$derived`)
- **Database**: SQLite with `better-sqlite3`
- **Styling**: Tailwind CSS v4 (with `@source` directive in CSS)
- **UI Components**: `shadcn-svelte` (NOT React - Svelte-native components)
- **Icons**: `lucide-svelte`
- **Validation**: Zod schemas
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Auth**: Lucia v3

### Svelte 5 Reactive Patterns

- `$state()`: For mutable state that changes over time
- `$derived()`: For computed values based on other state
- `$effect()`: For side effects and syncing external state to internal state

**Form pattern:**

```svelte
<script lang="ts">
	type Props = { initialData?: Data };
	let { initialData }: Props = $props();
	let localState = $state('default');

	$effect(() => {
		if (initialData) localState = initialData.value;
	});
</script>
```

**Composables with props:**

```svelte
// ❌ BAD - Creates new state on every prop change
const state = $derived.by(() => useFormState(initialData));

// ✅ GOOD - Create once, then load via method
const state = useFormState();
$effect(() => {
	if (initialData) state.loadData(initialData);
});
```

### Component Organization

**Folder structure:**

```
src/lib/components/
  ComponentName/               ← PascalCase folder
    ComponentName.svelte       ← PascalCase file
    ComponentSubPart.svelte    ← Split large components
    useComponentState.svelte.ts ← Extract logic
    ComponentName.spec.ts      ← Co-located tests
    index.ts                   ← Barrel export
```

**When to split:** Main file >150 lines OR complex logic worth extracting.

### shadcn-svelte Component Usage

**API patterns:**

```svelte
<Select.Root type="single" bind:value={myValue}>
	<Select.Trigger>...</Select.Trigger>
	<Select.Content>
		<Select.Item value="option1">Option 1</Select.Item>
	</Select.Content>
</Select.Root>

<Tabs.Root value={activeTab}>
	<Tabs.List>
		<Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="tab1">Content</Tabs.Content>
</Tabs.Root>

<Dialog.Dialog bind:open={isOpen}>
	<Dialog.Content>...</Dialog.Content>
</Dialog.Dialog>
```

**Common mistakes:**

- ❌ `<Select.Value />` doesn't exist - use content in `<Select.Trigger>`
- ❌ `selected` prop doesn't exist - use `value` or `bind:value`
- ❌ Lowercase imports - use PascalCase `'$lib/components/ui/Button'`

### Database Patterns

```typescript
// src/lib/server/db/queries/resource.ts
import { parseRow, buildSqlUpdates } from './utils';

export function getResourceById(id: number, db = getDb()) {
	const row = db.prepare('SELECT * FROM resources WHERE id = ?').get(id);
	if (!row) return null;
	return parseRow(resourceSchema, row);
}

export function updateResource(id: number, input: UpdateInput, db = getDb()) {
	const { updates, values } = buildSqlUpdates(input);
	db.prepare(`UPDATE resources SET ${updates.join(', ')} WHERE id = ?`).run(...values, id);
	return getResourceById(id, db);
}
```

**Key patterns:**

- Always accept `db` parameter with default `getDb()` for testability
- Use `parseRow()` / `parseOptionalRow()` - no type casts
- Use `buildSqlUpdates()` for dynamic UPDATE queries
- Return parsed types, not raw rows
- Use transactions for multi-step operations

### Type Safety & Validation

**Prefer type guards over casts:**

```typescript
// ❌ Bad
const color = data.color as TailwindColorName;

// ✅ Good
export function isTailwindColorName(value: unknown): value is TailwindColorName {
	return typeof value === 'string' && VALID_COLOR_NAMES.has(value);
}
const color = isTailwindColorName(data.color) ? data.color : undefined;
```

**When casts ARE acceptable:**

- Narrowing to specific union after truthiness check
- TypeScript can't infer specific literals from broader type

**Avoid casts when:**

- After truthiness check (TypeScript already knows type)
- `better-sqlite3` returns `unknown`, `parseRow` accepts `unknown`
- Suppressing errors without validation

### Testing Requirements

- **100% coverage** for all new/modified files
- Co-locate tests with source files
- Use descriptive test names

```typescript
// Composables
describe('useFeatureState', () => {
	it('should initialize with default values', () => {
		const state = useFeatureState();
		expect(state.value).toBe('default');
	});
});

// Database queries (in-memory DB)
describe('getResourceById', () => {
	let db: Database;
	beforeEach(() => {
		db = new Database(':memory:');
	});
	afterEach(() => {
		db.close();
	});

	it('returns resource when found', () => {
		const resource = getResourceById(1, db);
		expect(resource).toBeDefined();
	});
});
```

### Tailwind CSS v4 Considerations

**Dynamic classes MUST be explicit:**

```typescript
// ❌ BAD
const className = `bg-${color}-500`;

// ✅ GOOD
const COLOR_CLASSES = {
	blue: { bg: { '500': 'bg-blue-500' } },
	red: { bg: { '500': 'bg-red-500' } }
};
```

**Theme colors require OKLCH format:**

```css
@theme {
	/* ✅ GOOD */
	--color-background: oklch(100% 0 0);

	/* ❌ BAD - HSL doesn't work with Tailwind v4 */
	--color-background: 0 0% 100%;
}
```

**Config:**

- Uses `@source` directive in CSS files
- Classes must be explicit strings for content scanner
- Use `cn()` utility for conditional class merging

### Code Quality Standards

**Type safety:**

- No `any` types (use `unknown` if needed, then narrow)
- No `as unknown as Type` casts - use proper parsing
- Export types from utilities for reuse

**Code organization:**

- Extract reusable logic to composables (`src/lib/composables/`)
- Extract API patterns to utilities (`src/lib/utils/`)
- Keep components focused (Single Responsibility Principle)
- Use barrel exports (`index.ts`) for clean imports

**Naming conventions:**

- Components: PascalCase (folders AND files)
- Composables: `use*.svelte.ts` pattern
- Utils: camelCase
- Database tables: snake_case
- TypeScript types: PascalCase

### Git Conventions

**Commit messages (conventional commits):**

```
feat(scope): add new feature
fix(scope): resolve bug
refactor(scope): improve code structure
test(scope): add tests
docs(scope): update documentation
```

**Branch naming:**

- Feature: `feat/ticket-###-short-description`
- Fix: `fix/issue-###-short-description`

### Common Patterns

**CRUD operations composable:**

```typescript
export function useCrudDialogs<T>() {
  let createDialogOpen = $state(false);
  let editDialogOpen = $state(false);
  let deleteDialogOpen = $state(false);
  let selectedItem = $state<T | null>(null);

  return {
    createDialogOpen: { get value() { return createDialogOpen; }, ... },
    openCreate: () => { createDialogOpen = true },
    openEdit: (item: T) => { selectedItem = item; editDialogOpen = true },
  };
}
```

**API utilities:**

```typescript
export async function createResource<T>(endpoint: string, data: T) {
	const result = await apiRequest(endpoint, {
		method: 'POST',
		body: JSON.stringify(data)
	});

	if (result.success) {
		toast.success('Created successfully');
		await invalidateAll();
	}
	return result;
}
```

### Troubleshooting

1. **Case-sensitivity errors** - Always use consistent PascalCase for components
2. **Svelte 5 reactivity issues**
   - Use `$state()` with reassignment (not mutation)
   - Don't use `$derived.by(() => useComposable(props))` - create once, load via method
3. **shadcn-svelte API mismatch** - Check component source, not React patterns
4. **Tailwind classes not generated** - Ensure explicit strings, not template literals
5. **Dialog backgrounds missing** - Add OKLCH color variables (`--color-background`)

### Pre-commit Checklist

- [ ] `npm run lint` - Prettier + ESLint + svelte-check
- [ ] `npm run test:unit -- --run` - All tests pass
- [ ] `npm run build` - Production build succeeds
- [ ] Check coverage - 100% for touched files
- [ ] Update documentation if needed
- [ ] Conventional commit message with scope

### Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run preview          # Preview production build

# Testing
npm run test:unit        # Unit tests (watch mode)
npm run test:unit -- --run --coverage  # Coverage report
npm run test:e2e         # E2E tests

# Linting
npm run lint             # Prettier + ESLint + svelte-check
npm run format           # Auto-fix formatting

# Database
npm run db:migrate       # Run migrations
npm run db:seed          # Seed test data
```
