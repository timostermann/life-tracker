# Ticket 016: Internationalization (i18n) Implementation

**ID:** ticket-016  
**Scope:** `i18n` or `ticket-016`  
**Phase:** 2 (Post-MVP Enhancement)  
**Dependencies:** ticket-006, ticket-008, ticket-009, ticket-010, ticket-012

## Description

Extract all hardcoded text strings from components, pages, and server-side code into structured JSON translation files and implement a comprehensive i18n solution using `svelte-i18n`. Support multiple languages with runtime language switching, proper formatting for dates/numbers, and maintain type safety for translation keys.

## Context

Currently, all user-facing text is hardcoded directly in Svelte components, API responses, and validation error messages. This makes the application English-only and difficult to maintain for multilingual support. An i18n solution will:

- Enable multiple language support without code changes
- Centralize all text content for easier maintenance
- Provide type-safe translation keys
- Support proper formatting for dates, numbers, and pluralization
- Allow user preference persistence for language selection

## Tasks

### Backend Infrastructure

- [ ] Install and configure `svelte-i18n` package
- [ ] Create translation file structure (`src/lib/i18n/locales/`)
- [ ] Set up i18n initialization and configuration
- [ ] Create TypeScript types for translation keys
- [ ] Add language preference to user session/cookies

### Translation Extraction

- [ ] Extract all UI text from components (buttons, labels, headings)
- [ ] Extract form validation messages and error text
- [ ] Extract dialog titles, descriptions, and confirmation messages
- [ ] Extract toast notification messages
- [ ] Extract API error messages and server responses
- [ ] Extract date/time formatting strings
- [ ] Extract placeholder text and ARIA labels

### Translation Files

- [ ] Create `en.json` (English - default/source language)
- [ ] Create `de.json` (German - example second language)
- [ ] Organize translations by feature/module
- [ ] Add support for pluralization rules
- [ ] Add support for interpolation (dynamic values)

### Component Updates

- [ ] Update all shadcn-svelte component usage with translations
- [ ] Update CategoryForm and related components
- [ ] Update CategoryList and CategoryCard
- [ ] Update TaskForm, ChoreForm, HabitForm components
- [ ] Update Dashboard page
- [ ] Update authentication pages (login/register)
- [ ] Update error pages (404, 500)
- [ ] Update navigation and layout components

### Language Switcher

- [ ] Create LanguageSwitcher component
- [ ] Add language selector to app layout/navigation
- [ ] Implement language persistence (cookies/localStorage)
- [ ] Handle SSR language detection (Accept-Language header)
- [ ] Update page `<html lang>` attribute dynamically

### Formatting & Utilities

- [ ] Configure date formatting per locale (using `$d` from svelte-i18n)
- [ ] Configure number formatting per locale (using `$n` from svelte-i18n)
- [ ] Create helper functions for dynamic translation keys
- [ ] Add support for RTL languages (future-proofing)

### Testing

- [ ] Unit tests for i18n utilities and helpers
- [ ] Tests for translation key type safety
- [ ] Tests for language switching functionality
- [ ] Tests for pluralization and interpolation
- [ ] Visual regression tests for text overflow/layout
- [ ] E2E tests for language switcher across pages

### Documentation

- [ ] Document translation file structure and conventions
- [ ] Create contributor guide for adding new translations
- [ ] Document how to add new language support
- [ ] Add examples for common translation patterns
- [ ] Update AGENTS.md with i18n best practices

## Acceptance Criteria

- ✅ `svelte-i18n` installed and configured
- ✅ All hardcoded UI text extracted to JSON files
- ✅ Zero hardcoded English strings remain in components
- ✅ Language switcher component in app navigation
- ✅ User language preference persists across sessions
- ✅ All pages render in selected language
- ✅ Form validation errors translated
- ✅ Toast notifications translated
- ✅ API error messages translated
- ✅ Dates and numbers formatted per locale
- ✅ TypeScript type safety for translation keys
- ✅ At least 2 languages fully supported (English + German)
- ✅ SSR works correctly with language detection
- ✅ All tests pass with 100% coverage
- ✅ No layout breaking due to longer translations
- ✅ ARIA labels and accessibility text translated

## Technical Notes

### Installation

```bash
npm install svelte-i18n
```

### File Structure

```
src/lib/i18n/
├── index.ts                    # i18n initialization
├── types.ts                    # TypeScript types for keys
├── locales/
│   ├── en.json                 # English translations
│   ├── de.json                 # German translations
│   └── index.ts                # Locale imports
└── helpers.ts                  # Utility functions
```

### Configuration (`src/lib/i18n/index.ts`)

```typescript
import { browser } from '$app/environment';
import { init, register, locale, waitLocale } from 'svelte-i18n';

const defaultLocale = 'en';

register('en', () => import('./locales/en.json'));
register('de', () => import('./locales/de.json'));

init({
	fallbackLocale: defaultLocale,
	initialLocale: browser ? window.navigator.language : defaultLocale
});

export { locale, waitLocale };
```

### Translation File Structure (`locales/en.json`)

```json
{
	"common": {
		"actions": {
			"create": "Create",
			"edit": "Edit",
			"delete": "Delete",
			"cancel": "Cancel",
			"save": "Save",
			"close": "Close",
			"confirm": "Confirm"
		},
		"labels": {
			"name": "Name",
			"description": "Description",
			"color": "Color",
			"icon": "Icon"
		}
	},
	"categories": {
		"title": "Categories",
		"subtitle": "Manage your task, chore, and habit categories",
		"new": "New Category",
		"empty": "No categories yet",
		"emptyHint": "Create your first category to get started",
		"create": {
			"title": "Create Category",
			"description": "Create a new category for tasks, chores, or habits",
			"success": "Category created successfully",
			"error": "Failed to create category"
		},
		"edit": {
			"title": "Edit Category",
			"description": "Update your category settings and fields",
			"success": "Category updated successfully",
			"error": "Failed to update category"
		},
		"delete": {
			"title": "Delete Category",
			"message": "Are you sure you want to delete \"{name}\"?",
			"warning": "This action cannot be undone.",
			"success": "Category deleted successfully",
			"error": "Failed to delete category"
		},
		"tabs": {
			"owned": "My Categories",
			"shared": "Shared with me"
		},
		"templateTypes": {
			"tasks": "Tasks",
			"chores": "Chores",
			"habits": "Habits"
		}
	},
	"validation": {
		"required": "{field} is required",
		"minLength": "{field} must be at least {min} characters",
		"maxLength": "{field} must be at most {max} characters",
		"invalid": "{field} is invalid"
	}
}
```

### Usage in Components

**Before (hardcoded):**

```svelte
<h1 class="text-3xl font-bold">Categories</h1>
<p class="mt-2 text-muted-foreground">Manage your task, chore, and habit categories</p>
<Button onclick={actions.openCreate}>
	<Plus class="mr-2 h-4 w-4" />
	New Category
</Button>
```

**After (i18n):**

```svelte
<script>
	import { _ } from 'svelte-i18n';
</script>

<h1 class="text-3xl font-bold">{$_('categories.title')}</h1>
<p class="mt-2 text-muted-foreground">{$_('categories.subtitle')}</p>
<Button onclick={actions.openCreate}>
	<Plus class="mr-2 h-4 w-4" />
	{$_('categories.new')}
</Button>
```

### Interpolation Example

```json
{
	"items": {
		"count": "{count, plural, =0 {No items} =1 {1 item} other {# items}}"
	}
}
```

```svelte
{$_('items.count', { values: { count: items.length } })}
```

### Date/Number Formatting

```svelte
<script>
	import { _, date, number } from 'svelte-i18n';
</script>

<!-- Date formatting -->
<p>{$date(new Date(), { format: 'short' })}</p>

<!-- Number formatting -->
<p>{$number(1234.56, { style: 'currency', currency: 'USD' })}</p>
```

### Type Safety for Translation Keys

Create a TypeScript type from translation keys:

```typescript
// src/lib/i18n/types.ts
import type en from './locales/en.json';

type TranslationKeys = keyof typeof en;
type NestedKeyOf<ObjectType extends object> = {
	[Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
		? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
		: `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationKey = NestedKeyOf<typeof en>;

// Helper function with type safety
export function t(key: TranslationKey, values?: Record<string, unknown>): string {
	// Implementation using svelte-i18n
}
```

### Language Switcher Component

```svelte
<!-- src/lib/components/LanguageSwitcher/LanguageSwitcher.svelte -->
<script lang="ts">
	import { locale, locales } from 'svelte-i18n';
	import * as Select from '$lib/components/ui/Select';

	const availableLocales = [
		{ value: 'en', label: 'English' },
		{ value: 'de', label: 'Deutsch' }
	];

	function handleChange(value: string) {
		locale.set(value);
		// Persist to cookie
		document.cookie = `locale=${value}; path=/; max-age=31536000`;
	}
</script>

<Select.Root value={$locale} onchange={handleChange}>
	<Select.Trigger>
		<Select.Value placeholder="Select language" />
	</Select.Trigger>
	<Select.Content>
		{#each availableLocales as lang}
			<Select.Item value={lang.value}>{lang.label}</Select.Item>
		{/each}
	</Select.Content>
</Select.Root>
```

### SSR Language Detection

```typescript
// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';
import { locale } from 'svelte-i18n';

export const handle: Handle = async ({ event, resolve }) => {
	// Check cookie first
	const lang = event.cookies.get('locale');

	if (lang) {
		locale.set(lang);
	} else {
		// Fall back to Accept-Language header
		const acceptLanguage = event.request.headers.get('accept-language');
		const preferredLang = acceptLanguage?.split(',')[0]?.split('-')[0] || 'en';
		locale.set(preferredLang);
	}

	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', lang || 'en')
	});
};
```

## Translation Coverage Checklist

### Components to Translate

- [ ] **CategoryForm** - labels, buttons, placeholders, errors
- [ ] **CategoryList** - empty state, buttons, labels
- [ ] **CategoryCard** - labels, actions
- [ ] **DeleteCategoryDialog** - title, message, buttons
- [ ] **TaskForm** - all fields, buttons, validation
- [ ] **TaskList** - filters, empty state, actions
- [ ] **ChoreForm** - all fields, buttons, validation
- [ ] **HabitForm** - all fields, buttons, validation
- [ ] **Dashboard** - headings, sections, empty states
- [ ] **Navigation** - menu items, tooltips
- [ ] **AuthForms** - login, register, forgot password
- [ ] **ErrorPages** - 404, 500, generic errors

### Features to Translate

- [ ] Form validation messages (Zod schemas)
- [ ] Toast notifications (success, error, info)
- [ ] API error responses
- [ ] Loading states ("Loading...", "Saving...")
- [ ] Empty states ("No items yet", "Create your first...")
- [ ] Confirmation dialogs
- [ ] Accessibility labels (aria-label, aria-describedby)
- [ ] Meta tags (page titles, descriptions)

## Testing Strategy

### Unit Tests

```typescript
// src/lib/i18n/helpers.spec.ts
import { describe, it, expect } from 'vitest';
import { getTranslation } from './helpers';

describe('i18n helpers', () => {
	it('should get translation by key', () => {
		const translation = getTranslation('common.actions.create');
		expect(translation).toBe('Create');
	});

	it('should interpolate values', () => {
		const translation = getTranslation('validation.required', { field: 'Name' });
		expect(translation).toBe('Name is required');
	});

	it('should handle pluralization', () => {
		expect(getTranslation('items.count', { count: 0 })).toBe('No items');
		expect(getTranslation('items.count', { count: 1 })).toBe('1 item');
		expect(getTranslation('items.count', { count: 5 })).toBe('5 items');
	});
});
```

### Component Tests

```typescript
// Test that component renders with translations
import { render } from '@testing-library/svelte';
import { init } from 'svelte-i18n';
import CategoryList from './CategoryList.svelte';

beforeEach(async () => {
	await init({ fallbackLocale: 'en', initialLocale: 'en' });
});

it('should render in English', () => {
	const { getByText } = render(CategoryList, { props: { categories: [] } });
	expect(getByText('No categories yet')).toBeInTheDocument();
});

it('should render in German', async () => {
	await locale.set('de');
	const { getByText } = render(CategoryList, { props: { categories: [] } });
	expect(getByText('Noch keine Kategorien')).toBeInTheDocument();
});
```

### E2E Tests

```typescript
// tests/e2e/i18n.spec.ts
import { test, expect } from '@playwright/test';

test('should switch language', async ({ page }) => {
	await page.goto('/categories');

	// Default English
	await expect(page.locator('h1')).toHaveText('Categories');

	// Switch to German
	await page.locator('[data-testid="language-switcher"]').click();
	await page.locator('[data-value="de"]').click();

	// Check German translation
	await expect(page.locator('h1')).toHaveText('Kategorien');

	// Check persistence
	await page.reload();
	await expect(page.locator('h1')).toHaveText('Kategorien');
});
```

## Migration Strategy

### Phase 1: Infrastructure Setup

1. Install svelte-i18n
2. Create file structure
3. Set up configuration
4. Create English translation file (extract all current text)

### Phase 2: Extract by Feature

1. Categories pages and components
2. Tasks pages and components
3. Chores pages and components
4. Habits pages and components
5. Dashboard
6. Authentication
7. Common UI (navigation, errors)

### Phase 3: Add Second Language

1. Create German translation file
2. Translate all keys
3. Test for completeness

### Phase 4: Polish & Testing

1. Add language switcher
2. Implement persistence
3. Test SSR
4. Fix layout issues
5. Complete test coverage

## Common Patterns

### Dynamic Keys

```svelte
<script>
	const key = `categories.templateTypes.${templateType}`;
</script>

{$_(key)}
```

### Plural with Count Display

```json
{
	"categories.owned": "My Categories ({count})"
}
```

```svelte
{$_('categories.tabs.owned', { values: { count: ownedCategories.length } })}
```

### Error Messages from Server

```typescript
// API handler
return json({ error: 'validation.required', field: 'name' }, { status: 400 });
```

```svelte
<!-- Client component -->
<script>
	const errorMessage = $_('validation.required', {
		values: { field: $_('common.labels.name') }
	});
</script>
```

## Accessibility Considerations

- Translate all ARIA labels
- Translate screen reader text
- Update `lang` attribute on `<html>` tag
- Ensure proper RTL support for future languages
- Test with screen readers in multiple languages

## Performance Considerations

- Lazy load translation files per route if needed
- Cache translation files with proper headers
- Consider bundle size impact of multiple languages
- Use code splitting for locale files

## Resources

- [svelte-i18n Documentation](https://github.com/kaisermann/svelte-i18n)
- [Internationalization API (Intl)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)
- [CLDR Pluralization Rules](https://cldr.unicode.org/index/cldr-spec/plural-rules)
- [W3C Internationalization Best Practices](https://www.w3.org/International/quicktips/)

## Success Metrics

- Zero hardcoded English strings in codebase
- 100% translation coverage for English and German
- Language switcher accessible from all pages
- No layout breaking with longer German translations
- All tests passing with i18n enabled
- Page load time impact < 50ms
- Type-safe translation keys prevent typos

## Future Enhancements (Out of Scope)

- Additional languages (French, Spanish, etc.)
- Crowdsourced translation platform integration
- Automatic missing key detection in CI
- Translation management UI
- Regional variants (en-US vs en-GB)
- Number formatting preferences (separate from language)

## Notes

- Start with English as source language (already in codebase)
- German chosen as second language for testing (common European language)
- Keep translation keys descriptive and hierarchical
- Use nested objects for better organization
- Consider future RTL language support in layout design
- Don't translate proper nouns, brand names, or technical terms
- Document any English-only content (like error codes)
