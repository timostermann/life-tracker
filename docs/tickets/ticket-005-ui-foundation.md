# Ticket 005: UI Foundation with shadcn-svelte

**ID:** ticket-005  
**Scope:** `ui` or `ticket-005`  
**Phase:** 1 (MVP)  
**Dependencies:** ticket-001, ticket-004

## Description

Set up shadcn-svelte components and Histoire for component development. Create base components and stories for core UI elements.

## Tasks

- [ ] Verify shadcn-svelte installed (from ticket-001)
- [ ] Install required shadcn components (Button, Input, Select, Dialog, Calendar, Card, Badge)
- [ ] Customize shadcn components for app theme
- [ ] Configure Histoire
- [ ] Create Histoire stories for all shadcn components
- [ ] Create custom app components (CategoryCard, ItemCard, etc.)
- [ ] Add unit tests for custom components (co-located)
- [ ] Document component usage patterns

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

- ✅ All shadcn components installed and working
- ✅ Components customized with app colors/theme
- ✅ Histoire runs (`npm run story:dev`)
- ✅ Each component has at least 2 stories (default + variant)
- ✅ Custom components created and tested
- ✅ All components fully typed
- ✅ Components accessible (keyboard nav, ARIA labels)
- ✅ Unit tests for custom component logic

## Technical Notes

**Histoire configuration:**

```typescript
// .histoire/config.ts
export default defineConfig({
	plugins: [SveltePlugin()],
	setupFile: '/src/histoire.setup.ts',
	tree: {
		groups: [
			{ title: 'shadcn-svelte', id: 'shadcn' },
			{ title: 'Custom', id: 'custom' }
		]
	}
});
```

**Story example:**

```svelte
<!-- CategoryCard.story.svelte -->
<script>
	import { Hst } from '@histoire/plugin-svelte';
	import CategoryCard from './CategoryCard.svelte';
</script>

<Hst.Story title="Custom/CategoryCard">
	<CategoryCard name="Household Chores" icon="🧹" color="#10b981" itemCount={5} />
</Hst.Story>
```

**Component structure:**

```
src/lib/components/
├── ui/              # shadcn components
│   ├── button/
│   ├── input/
│   └── ...
├── CategoryCard.svelte
├── CategoryCard.test.ts
├── CategoryCard.story.svelte
├── ItemCard.svelte
├── ItemCard.test.ts
└── ItemCard.story.svelte
```

## Testing

- ✅ Unit test: CategoryCard renders with props
- ✅ Unit test: PriorityBadge shows correct color
- ✅ Unit test: Component click handlers work
- ✅ Histoire: All stories render
- ✅ Histoire: Interactive controls work

## Accessibility

- ✅ All interactive elements keyboard accessible
- ✅ Focus visible on all controls
- ✅ ARIA labels on icon-only buttons
- ✅ Color contrast meets WCAG AA
- ✅ Screen reader tested with NVDA/VoiceOver

## Performance

- ✅ Components lazy-loaded where appropriate
- ✅ No unnecessary re-renders
- ✅ Histoire build optimized
