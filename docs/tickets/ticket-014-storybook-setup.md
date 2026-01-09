# Ticket 014: Storybook Setup with Svelte 5 Support

**ID:** ticket-014  
**Scope:** `storybook` or `ticket-014`  
**Phase:** 2 (Post-MVP Enhancement)  
**Dependencies:** ticket-005

## Description

Add Storybook 8.4+ with full Svelte 5 support for component development, documentation, and testing. Replace the removed Histoire setup with a production-ready component playground that supports Svelte 5 runes and provides a rich ecosystem of addons.

## Context

Histoire (alpha version) was removed due to incompatibility with Svelte 5. All components currently have comprehensive Vitest browser tests but lack an interactive component documentation tool. Storybook 8.4+ provides full Svelte 5 support including runes, Svelte CSF (Component Story Format), and a mature ecosystem.

## Tasks

- [ ] Install Storybook 8.4+ with Svelte 5 support
- [ ] Configure Storybook for SvelteKit and Tailwind CSS
- [ ] Migrate component documentation to Storybook stories
- [ ] Create stories for all shadcn-svelte components (14 components)
- [ ] Create stories for all custom components (4 components)
- [ ] Configure addons (a11y, interactions, viewport, docs)
- [ ] Set up proper component organization/categories
- [ ] Add documentation pages for component usage patterns
- [ ] Configure build and deployment (static export)

## Components Requiring Stories

**shadcn-svelte components (10):**

- Button, Input, Textarea
- Select, Checkbox, Label
- Dialog, Calendar, Card, Badge

**Custom components (4):**

- CategoryCard (displays category with icon, color, item count)
- ItemCard (displays task/chore/habit with checkbox, priority, due date)
- PriorityBadge (urgent/high/medium/low variants)
- AssigneeAvatar (user initials/image with sizes)

## Acceptance Criteria

- ✅ Storybook 8.4+ installed and running (`npm run storybook`)
- ✅ All 14 components have interactive stories
- ✅ Stories demonstrate all component variants and props
- ✅ Svelte 5 runes syntax used in stories (`$state`, `$derived`)
- ✅ Accessibility addon configured and passing
- ✅ Stories organized in logical categories (shadcn-svelte / Custom Components)
- ✅ Component documentation includes usage examples and prop tables
- ✅ Storybook builds successfully for deployment
- ✅ Dark mode support (if applicable)

## Technical Notes

### Installation

Use the official Storybook CLI with Svelte preset:

```bash
npx storybook@latest init
```

This will:

- Detect SvelteKit and install appropriate dependencies
- Create `.storybook/` configuration directory
- Add storybook scripts to `package.json`
- Install essential addons

### Required Configuration

**`.storybook/main.ts`:**

```typescript
import type { StorybookConfig } from '@storybook/svelte-vite';

const config: StorybookConfig = {
	stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|svelte)'],
	addons: [
		'@storybook/addon-links',
		'@storybook/addon-essentials',
		'@storybook/addon-interactions',
		'@storybook/addon-a11y',
		'@storybook/addon-svelte-csf'
	],
	framework: {
		name: '@storybook/svelte-vite',
		options: {}
	}
};

export default config;
```

**`.storybook/preview.ts`:**

```typescript
import type { Preview } from '@storybook/svelte';
import '../src/routes/layout.css'; // Import Tailwind styles

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/
			}
		}
	}
};

export default preview;
```

### Svelte Component Story Format (CSF)

Storybook 8.4+ supports writing stories in `.stories.svelte` files using Svelte 5 syntax:

```svelte
<!-- Button.stories.svelte -->
<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Button from './Button.svelte';

	const { Story } = defineMeta({
		component: Button,
		title: 'shadcn-svelte/Button',
		tags: ['autodocs'],
		argTypes: {
			variant: {
				control: 'select',
				options: ['default', 'destructive', 'outline', 'ghost', 'link']
			},
			size: {
				control: 'select',
				options: ['default', 'sm', 'lg', 'icon']
			}
		}
	});
</script>

<Story name="Default">
	<Button>Click me</Button>
</Story>

<Story name="Destructive" args={{ variant: 'destructive' }}>
	<Button variant="destructive">Delete</Button>
</Story>

<Story name="With Icon">
	<Button>
		<svg>...</svg>
		Click me
	</Button>
</Story>
```

### Interactive State with Svelte 5 Runes

```svelte
<!-- ItemCard.stories.svelte -->
<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ItemCard from './ItemCard.svelte';

	const { Story } = defineMeta({
		component: ItemCard,
		title: 'Custom Components/ItemCard',
		tags: ['autodocs']
	});
</script>

<script>
	let completed = $state(false);
</script>

<Story name="Interactive">
	<ItemCard
		title="Buy groceries"
		description="Milk, eggs, bread"
		priority="high"
		{completed}
		ontoggle={() => (completed = !completed)}
	/>
</Story>
```

### Essential Addons

1. **@storybook/addon-a11y** - Accessibility testing
2. **@storybook/addon-interactions** - User interaction testing
3. **@storybook/addon-viewport** - Responsive design testing
4. **@storybook/addon-docs** - Auto-generated documentation
5. **@storybook/addon-svelte-csf** - Svelte Component Story Format

### Story Organization

Organize stories in logical groups:

```
stories/
├── shadcn-svelte/
│   ├── Button.stories.svelte
│   ├── Input.stories.svelte
│   ├── Select.stories.svelte
│   ├── Dialog.stories.svelte
│   ├── Calendar.stories.svelte
│   ├── Card.stories.svelte
│   ├── Badge.stories.svelte
│   ├── Checkbox.stories.svelte
│   ├── Label.stories.svelte
│   └── Textarea.stories.svelte
└── Custom Components/
    ├── CategoryCard.stories.svelte
    ├── ItemCard.stories.svelte
    ├── PriorityBadge.stories.svelte
    └── AssigneeAvatar.stories.svelte
```

Or co-locate stories with components:

```
src/lib/components/
├── CategoryCard/
│   ├── CategoryCard.svelte
│   ├── CategoryCard.svelte.spec.ts
│   └── CategoryCard.stories.svelte  # Co-located story
```

## Testing Strategy

1. **Visual Testing:** Use Storybook to manually verify component appearance
2. **Interaction Testing:** Use `@storybook/addon-interactions` for user flows
3. **Accessibility Testing:** Use `@storybook/addon-a11y` for WCAG compliance
4. **Unit Tests:** Keep existing Vitest tests for logic verification

## Migration from Histoire

Since all components were previously documented with Histoire stories (now removed), the migration involves:

1. Convert Histoire story syntax to Storybook Svelte CSF
2. Maintain same component variants and examples
3. Enhance with Storybook-specific features (controls, actions, docs)

**Histoire syntax (removed):**

```svelte
<script lang="ts">
	import { Hst } from '@histoire/plugin-svelte';
	import MyComponent from './MyComponent.svelte';
</script>

<Hst.Story title="Components/MyComponent">
	<MyComponent prop="value" />
</Hst.Story>
```

**Storybook Svelte CSF syntax (new):**

```svelte
<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import MyComponent from './MyComponent.svelte';

	const { Story } = defineMeta({
		component: MyComponent,
		title: 'Components/MyComponent'
	});
</script>

<Story name="Default">
	<MyComponent prop="value" />
</Story>
```

## Resources

- [Storybook for Svelte 5](https://storybook.js.org/docs/svelte/get-started/install)
- [Storybook 8.4 Release Notes](https://storybook.js.org/blog/storybook-8-4)
- [Svelte Component Story Format](https://github.com/storybookjs/addon-svelte-csf)
- [Storybook Addons](https://storybook.js.org/addons)

## Success Metrics

- Component discovery time reduced (searchable storybook vs reading code)
- Faster component development (isolated testing environment)
- Better accessibility compliance (automated a11y checks)
- Improved team collaboration (shared component documentation)
- Design/dev alignment (visual reference for both teams)

## Notes

- Storybook has a larger bundle size than Histoire but provides more features
- Consider deploying Storybook to a static site (Netlify/Vercel) for team sharing
- Storybook can be used for visual regression testing with Chromatic addon
- All existing Vitest tests should remain - Storybook complements, not replaces them
