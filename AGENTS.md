You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.

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

**When to use what:**

- `$state()`: For mutable state that changes over time
- `$derived()`: For computed values based on other state (pure computations)
- `$effect()`: For side effects and synchronizing external state to internal state
  - Example: `$effect(() => { if (props.value) localState = props.value })`
  - Use when you need to sync props to mutable state in forms

**Common pattern for form components:**

```svelte
<script lang="ts">
	type Props = { initialData?: Data };
	let { initialData }: Props = $props();

	let localState = $state('default');

	// Sync props to local state
	$effect(() => {
		if (initialData) {
			localState = initialData.value;
		}
	});
</script>
```

**IMPORTANT - Composables with props:**

```svelte
<script lang="ts">
	type Props = { initialData?: Data };
	let { initialData }: Props = $props();

	// ❌ BAD - Creates new state on every prop change, $effect won't run properly
	const state = $derived.by(() => useFormState(initialData));

	// ✅ GOOD - Create once, then load data via method when props change
	const state = useFormState();

	$effect(() => {
		if (initialData) {
			state.loadData(initialData);
		}
	});
</script>
```

### Component Organization

**Folder structure:**

```
src/lib/components/
  ComponentName/               ← PascalCase folder
    ComponentName.svelte       ← PascalCase file
    ComponentSubPart.svelte    ← Split large components
    useComponentState.svelte.ts ← Extract logic to composables
    ComponentName.spec.ts      ← Co-located tests
    index.ts                   ← Barrel export
```

**When to split components:**

- Main file > 150 lines: Extract sub-components
- Also extract if it makes the component easier to read and maintain even if it's <150 lines already
- Complex logic: Extract to `use*.svelte.ts` composable
- Reusable logic: Move to `src/lib/composables/`

### shadcn-svelte Component Usage

**Important API patterns:**

```svelte
<!-- Select component -->
<Select.Root type="single" bind:value={myValue}>
	<Select.Trigger>...</Select.Trigger>
	<Select.Content>
		<Select.Item value="option1">Option 1</Select.Item>
	</Select.Content>
</Select.Root>

<!-- Tabs component -->
<Tabs.Root value={activeTab}>
	<Tabs.List>
		<Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="tab1">Content</Tabs.Content>
</Tabs.Root>

<!-- Dialog with bindable open state -->
<Dialog.Dialog bind:open={isOpen}>
	<Dialog.Content>...</Dialog.Content>
</Dialog.Dialog>
```

**Common mistakes to avoid:**

- ❌ `<Select.Value />` doesn't exist - use content directly in `<Select.Trigger>`
- ❌ `selected` prop doesn't exist - use `value` or `bind:value`
- ❌ Importing from `'$lib/components/ui/button'` - use PascalCase `'$lib/components/ui/Button'`

### Database Patterns

**Query organization:**

```typescript
// src/lib/server/db/queries/resource.ts
import { parseRow, buildSqlUpdates } from './utils';
import { resourceSchema } from './types';

export function getResourceById(id: number, db = getDb()) {
	const row = db.prepare('SELECT * FROM resources WHERE id = ?').get(id);
	if (!row) return null;
	return parseRow(resourceSchema, row); // Type-safe parsing, no "as unknown"
}

export function updateResource(id: number, input: UpdateInput, db = getDb()) {
	const { updates, values } = buildSqlUpdates(input); // Dynamic updates
	db.prepare(`UPDATE resources SET ${updates.join(', ')} WHERE id = ?`).run(...values, id);
	return getResourceById(id, db);
}
```

**Key patterns:**

- Always accept `db` parameter with default `getDb()` for testability
- Use `parseRow()` / `parseOptionalRow()` - no type casts needed
- Use `buildSqlUpdates()` for dynamic UPDATE queries
- Return parsed types, not raw database rows
- Use transactions for multi-step operations

### Type Safety & Validation

**Prefer type guards over type casts:**

```typescript
// ❌ Bad: Type cast without validation
const color = data.color as TailwindColorName;

// ✅ Good: Runtime type guard
import { isTailwindColorName } from '$lib/utils/colors';
const color = isTailwindColorName(data.color) ? data.color : undefined;

// Creating type guards
export function isTailwindColorName(value: unknown): value is TailwindColorName {
	return typeof value === 'string' && VALID_COLOR_NAMES.has(value);
}
```

**When type casts ARE acceptable:**

```typescript
// ✅ Narrowing to specific union after truthiness check
v && onTemplateTypeChange(v as 'task' | 'chore' | 'habit');

// ✅ TypeScript can't infer specific literals from broader type
const templateType = validated.template_type as 'task' | 'chore' | 'habit';
```

**When to avoid type casts:**

```typescript
// ❌ After truthiness check, TypeScript already knows v is string
v && callback(v as string); // Redundant

// ❌ better-sqlite3 already returns unknown, parseRow accepts unknown
db.prepare('...').get() as unknown; // Redundant

// ❌ Suppressing errors without validation
category.color as TailwindColorName; // Use type guard instead
```

### Testing Requirements

**Test coverage expectations:**

- **100% coverage** for all new/modified files
- Co-locate tests with source files
- Use descriptive test names

**Test patterns:**

```typescript
// Composables
describe('useFeatureState', () => {
	it('should initialize with default values', () => {
		const state = useFeatureState();
		expect(state.value).toBe('default');
	});
});

// Database queries (use in-memory DB)
describe('getResourceById', () => {
	let db: Database;

	beforeEach(() => {
		db = new Database(':memory:');
		// Run migrations, seed data
	});

	afterEach(() => {
		db.close();
	});

	it('returns resource when found', () => {
		const resource = getResourceById(1, db);
		expect(resource).toBeDefined();
	});
});

// API utilities
describe('createResource', () => {
	it('handles successful creation', async () => {
		global.fetch = vi
			.fn()
			.mockResolvedValue(new Response(JSON.stringify({ data: {} }), { status: 201 }));

		const result = await createResource('/api/test', { name: 'Test' });
		expect(result.success).toBe(true);
	});
});
```

### Tailwind CSS v4 Considerations

**Dynamic classes MUST be explicit:**

```typescript
// ❌ BAD - won't work with JIT
const className = `bg-${color}-500`;

// ✅ GOOD - explicit mapping
const COLOR_CLASSES = {
	blue: { bg: { '500': 'bg-blue-500' } },
	red: { bg: { '500': 'bg-red-500' } }
};
```

**Theme color variables (OKLCH format required):**

```css
/* layout.css */
@theme {
	/* ✅ GOOD - OKLCH format works directly */
	--color-background: oklch(100% 0 0);
	--color-foreground: oklch(9.61% 0.021 285.82);
}

body {
	/* Direct use without wrapper */
	background-color: var(--color-background);
}

/* ❌ BAD - HSL format requires wrapper that Tailwind v4 doesn't support */
@theme {
	--color-background: 0 0% 100%; /* Won't work with bg-background utility */
}
```

**Tailwind config:**

- Uses `@source` directive in CSS files
- Classes must be discoverable by content scanner
- Use `cn()` utility for conditional class merging
- Semantic color utilities (bg-background, text-foreground) require OKLCH variables

### Code Quality Standards

**Type safety:**

- No `any` types (use `unknown` if needed, then narrow)
- No `as unknown as Type` casts - use proper parsing
- Export types from utilities for reuse
- Use strict TypeScript checking

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
- TypeScript interfaces/types: PascalCase

### Git Conventions

**Commit messages:**
Follow conventional commits with scope:

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
// Reusable dialog state management
export function useCrudDialogs<T>() {
  let createDialogOpen = $state(false);
  let editDialogOpen = $state(false);
  let deleteDialogOpen = $state(false);
  let selectedItem = $state<T | null>(null);

  return {
    createDialogOpen: { get value() { return createDialogOpen; }, ... },
    openCreate: () => { createDialogOpen = true },
    openEdit: (item: T) => { selectedItem = item; editDialogOpen = true },
    // ... more methods
  };
}
```

**API utilities:**

```typescript
// Centralized API handling with toast + invalidation
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

**Common issues:**

1. **Case-sensitivity errors**: macOS is case-insensitive but TypeScript isn't
   - Solution: Always use consistent PascalCase for components
2. **Svelte 5 reactivity**: State doesn't update
   - Check: Using `$state()` and reassignment (not mutation)
   - Check: `$effect()` dependencies are tracked correctly
   - **Empty edit forms**: Don't use `$derived.by(() => useComposable(props))` - create composable once, then use explicit `loadData()` method
3. **shadcn-svelte errors**: Component API mismatch
   - Always check component's actual props in source files
   - Not all React patterns apply to Svelte version
4. **Build errors with Tailwind classes**: Classes not generated
   - Ensure classes are explicit strings, not template literals
   - Check `@source` directive includes your files
5. **Dialog backgrounds missing**: Add OKLCH color variables in CSS
   - Tailwind v4 requires `--color-background: oklch(...)` format
   - Can't use HSL format with `hsl()` wrapper
   - Add both light and dark theme variables

### Pre-commit Checklist

Before committing:

- [ ] Run `npm run lint` - Prettier + ESLint + svelte-check
- [ ] Run `npm run test:unit -- --run` - All tests pass
- [ ] Run `npm run build` - Production build succeeds
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
