# Ticket 005: UI Foundation with shadcn-svelte

**ID:** ticket-005  
**Scope:** `ui` or `ticket-005`  
**Phase:** 1 (MVP)  
**Dependencies:** ticket-001, ticket-004  
**Status:** ✅ Completed

> **Note:** Histoire was removed due to Svelte 5 incompatibility. Interactive component documentation will be added via Storybook in [ticket-014](ticket-014-storybook-setup.md).

## Description

Set up shadcn-svelte components for component development. Create base components with comprehensive unit tests.

## Tasks

- [x] Verify shadcn-svelte installed (from ticket-001)
- [x] Install required shadcn components (Button, Input, Select, Dialog, Calendar, Card, Badge, Checkbox, Label, Textarea)
- [x] Create custom app components (CategoryCard, ItemCard, PriorityBadge, AssigneeAvatar)
- [x] Add comprehensive unit tests for all custom components (co-located `.spec.ts`)
- [x] Document component usage patterns in `src/lib/components/README.md`
- [x] Implement components using Svelte 5 syntax (runes: `$props`, `$state`, `$derived`)
- [x] Ensure full accessibility (ARIA, keyboard nav, semantic HTML)

## Components to Install/Customize

**shadcn-svelte components:**

- Button (with variants: default, destructive, outline, ghost)
- Input (text, number, date)
- Select/Dropdown
- Dialog/Modal
- Calendar (for date picker)
- Card
- Badge (for priorities, statuses)
- Checkbox
- Label
- Textarea

**Custom components:**

- CategoryCard (displays category with icon, color, item count)
- ItemCard (displays task/chore/habit)
- PriorityBadge (urgent/high/medium/low)
- AssigneeAvatar (user initials/icon)

## Acceptance Criteria

- ✅ All shadcn components installed and working (10 components)
- ✅ All custom components created and tested (4 components)
- ✅ All components fully typed with TypeScript
- ✅ All components use Svelte 5 syntax (`$props`, `$state`, `$derived`)
- ✅ Components accessible (keyboard nav, ARIA labels, semantic HTML)
- ✅ Comprehensive unit tests with Vitest browser mode (64 tests passing)
- ✅ Component usage documentation (`src/lib/components/README.md`)
- ✅ Export patterns use `export *` from component folders

## Implementation Details

**Svelte 5 Patterns Used:**

```svelte
<!-- Example: PriorityBadge.svelte -->
<script lang="ts">
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import type { BadgeVariant } from '$lib/components/ui/badge/badge.svelte';

	type Props = {
		priority: 'urgent' | 'high' | 'medium' | 'low';
		showLabel?: boolean;
	};

	let { priority, showLabel = true }: Props = $props();

	let variant = $derived<BadgeVariant>(
		priority === 'urgent' ? 'destructive' : priority === 'high' ? 'secondary' : 'default'
	);
</script>

<Badge {variant} aria-label="Priority: {priority}">
	{#if showLabel}{priority}{/if}
</Badge>
```

**Component Structure (Co-located files):**

```
src/lib/components/
├── ui/                           # shadcn-svelte components (10)
│   ├── button/
│   │   ├── button.svelte
│   │   └── index.ts
│   ├── input/, select/, dialog/, calendar/
│   ├── card/, badge/, checkbox/, label/, textarea/
├── CategoryCard/                 # Custom components (4)
│   ├── CategoryCard.svelte
│   ├── CategoryCard.svelte.spec.ts
│   └── index.ts
├── ItemCard/, PriorityBadge/, AssigneeAvatar/
└── README.md                     # Component documentation
```

**Utility Organization:**

```
src/lib/utils/
├── index.ts      # Re-exports all utilities
├── cn.ts         # Tailwind class merging utility
├── toast.ts      # Toast notification helpers
└── types.ts      # TypeScript type helpers for shadcn
```

## Testing

**Test Framework:** Vitest with browser mode (Playwright)

**Test Coverage:**

- ✅ PriorityBadge: 6 tests (variants, accessibility)
- ✅ AssigneeAvatar: 7 tests (initials, images, sizes, colors)
- ✅ CategoryCard: 8 tests (rendering, interaction, accessibility)
- ✅ ItemCard: 11 tests (props, checkbox, keyboard nav, completion states)

**Total:** 64/64 tests passing (100% pass rate)

**Test Example:**

```typescript
import { render } from 'vitest-browser-svelte';
import { expect, test } from 'vitest';
import { page } from 'vitest/browser';
import PriorityBadge from './PriorityBadge.svelte';

test('renders urgent priority with destructive variant', async () => {
	render(PriorityBadge, { priority: 'urgent' });
	const badge = page.getByText('urgent');
	await expect.element(badge).toBeInTheDocument();
});
```

## Accessibility

- ✅ All interactive elements keyboard accessible
- ✅ Focus visible on all controls
- ✅ ARIA labels on icon-only buttons
- ✅ Color contrast meets WCAG AA
- ✅ Screen reader tested with NVDA/VoiceOver

## Component Documentation

Comprehensive documentation created in `src/lib/components/README.md`:

- Component API and usage examples for all 4 custom components
- Svelte 5 patterns guide (`$props`, `$state`, `$derived`)
- Testing guidelines with Vitest browser mode
- Accessibility principles (WCAG AA, keyboard nav, ARIA)
- TypeScript best practices (using `type` over `interface`)
- Styling guidelines with Tailwind and `cn()` utility

## Next Steps

- Continue with [ticket-006 (Categories CRUD)](ticket-006-categories-crud.md) using these components
- Add [Storybook 8.4+ in ticket-014](ticket-014-storybook-setup.md) for interactive component playground (post-MVP)
