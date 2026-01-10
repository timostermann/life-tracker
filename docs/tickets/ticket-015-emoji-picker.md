# Ticket 015: Emoji Picker Component

**ID:** ticket-015  
**Scope:** `ui` or `ticket-015`  
**Phase:** 2 (Post-MVP Enhancement)  
**Dependencies:** ticket-006  
**Status:** 🔜 **PENDING**

## Description

Replace the plain text emoji input field with an interactive emoji picker component similar to Slack's emoji picker. Currently, users must manually access their OS emoji picker (Control + Command + Space on Mac) to input emojis for categories, which is not intuitive and creates a poor user experience.

## Context

In ticket-006, we implemented categories CRUD with a simple text input field for emoji icons. While functional, this approach has significant UX issues:

- Users don't know how to access the OS emoji picker
- The emoji picker shortcut varies across operating systems (Mac, Windows, Linux)
- No visual feedback showing available emojis
- No search or categorization of emojis
- Mobile users have difficulty accessing system emoji keyboards in desktop web browsers

This ticket adds a proper emoji picker UI component that provides:

- Visual grid of emojis organized by category
- Search functionality
- Recent/frequently used emojis
- Consistent experience across all platforms
- Better discoverability and user experience

## Tasks

- [ ] Research and evaluate emoji picker libraries
  - [ ] `emoji-picker-element` (lightweight, web component)
  - [ ] `emoji-mart` (popular, feature-rich)
  - [ ] `picmo` (modern, customizable)
- [ ] Select best library based on criteria (bundle size, Svelte compatibility, features)
- [ ] Install chosen emoji picker library
- [ ] Create `EmojiPicker.svelte` wrapper component
- [ ] Replace text input in `CategoryBasicInfo.svelte` with emoji picker
- [ ] Add button trigger to open emoji picker popover
- [ ] Style emoji picker to match application theme (Tailwind CSS)
- [ ] Add "Clear emoji" functionality
- [ ] Implement keyboard navigation (Tab, Enter, Escape)
- [ ] Add unit tests for `EmojiPicker` component
- [ ] Update E2E tests for category creation/editing flows
- [ ] Update documentation with emoji picker usage

## Acceptance Criteria

- ✅ Users can click a button to open an emoji picker popover
- ✅ Emoji picker displays a grid of emojis organized by category
- ✅ Users can search emojis by name (e.g., "smile", "heart")
- ✅ Selected emoji appears in the category form
- ✅ Users can clear the selected emoji
- ✅ Emoji picker works consistently on Mac, Windows, and Linux
- ✅ Emoji picker is keyboard accessible (Tab, Enter, Escape)
- ✅ Recent/frequently used emojis are shown (if supported by library)
- ✅ Emoji picker matches application theme and design system
- ✅ Mobile-friendly touch interactions
- ✅ All existing category CRUD tests pass
- ✅ New unit tests cover emoji picker component
- ✅ E2E tests updated for new UI interaction

## Technical Implementation

### Component Architecture

**Location:** `src/lib/components/EmojiPicker/`

**Files to create:**

```
EmojiPicker/
├── EmojiPicker.svelte      # Main emoji picker component
├── EmojiPicker.spec.ts     # Unit tests
└── index.ts                # Exports
```

**Files to update:**

- `src/lib/components/CategoryForm/CategoryBasicInfo.svelte` - Replace emoji text input with EmojiPicker
- `tests/categories.spec.ts` - Update E2E tests for emoji selection

### Library Evaluation Criteria

1. **Bundle Size** - Should be <50kb gzipped to avoid bloating the app
2. **Svelte Compatibility** - Works well with Svelte 5 runes and SvelteKit
3. **Features** - Search, categories, recent emojis, skin tone support
4. **Accessibility** - Keyboard navigation, ARIA labels, screen reader support
5. **Customization** - Can be styled with Tailwind CSS
6. **Maintenance** - Actively maintained, good documentation
7. **License** - MIT or similar permissive license

### Recommended Libraries

#### Option 1: emoji-picker-element (Recommended)

**Pros:**

- Lightweight (~50kb gzipped)
- Native web component (works with any framework)
- Built-in search, categories, recent emojis
- Excellent accessibility (WCAG 2.1 AA compliant)
- Active maintenance by GitHub staff
- Supports IndexedDB for performance

**Cons:**

- Web component wrapper needed for Svelte
- Less customizable styling than alternatives

**Installation:**

```bash
npm install emoji-picker-element
```

**Usage Example:**

```svelte
<script lang="ts">
	import 'emoji-picker-element';
	import type { Picker } from 'emoji-picker-element';

	let { value = $bindable(''), onEmojiSelect } = $props<{
		value?: string;
		onEmojiSelect?: (emoji: string) => void;
	}>();

	let open = $state(false);
	let pickerElement: Picker;

	function handleEmojiClick(event: CustomEvent) {
		const emoji = event.detail.unicode;
		value = emoji;
		onEmojiSelect?.(emoji);
		open = false;
	}
</script>

{#if open}
	<div class="popover">
		<emoji-picker bind:this={pickerElement} on:emoji-click={handleEmojiClick}></emoji-picker>
	</div>
{/if}
```

#### Option 2: picmo

**Pros:**

- Modern TypeScript implementation
- Highly customizable
- Tree-shakeable
- Good documentation

**Cons:**

- Larger bundle size (~80kb gzipped)
- More complex API
- Manual DOM integration needed

#### Option 3: emoji-mart

**Pros:**

- Very popular (11k+ GitHub stars)
- Feature-rich
- React/Vue versions available

**Cons:**

- Large bundle size (100kb+ gzipped)
- Primarily React-focused
- Heavier than needed for our use case

### UI/UX Design

**Trigger Button:**

```svelte
<Button
	type="button"
	variant="outline"
	size="lg"
	class="h-16 w-16 p-0 text-3xl"
	onclick={() => (open = true)}
>
	{value || '😊'}
</Button>
```

**Popover Layout:**

- Position: Below trigger button, aligned left
- Width: 320px (mobile-friendly)
- Max height: 400px with scroll
- Categories: Smileys, Animals, Food, Activities, Travel, Objects, Symbols, Flags
- Search: Top bar with placeholder "Search emojis..."
- Recent: First row if available

**Clear Button:**

```svelte
{#if value}
	<Button
		type="button"
		variant="ghost"
		size="sm"
		onclick={() => {
			value = '';
		}}
	>
		Clear
	</Button>
{/if}
```

### Integration with CategoryForm

**Current Implementation (CategoryBasicInfo.svelte):**

```svelte
<div class="space-y-2">
	<Label for="icon">Icon (optional)</Label>
	<Input id="icon" type="text" placeholder="😊" bind:value={state.icon} />
</div>
```

**New Implementation:**

```svelte
<script>
	import { EmojiPicker } from '$lib/components/EmojiPicker';
</script>

<div class="space-y-2">
	<Label for="icon">Icon (optional)</Label>
	<div class="flex items-center gap-2">
		<EmojiPicker
			bind:value={state.icon}
			onEmojiSelect={(emoji) => {
				state.icon = emoji;
			}}
		/>
		{#if state.icon}
			<Button
				type="button"
				variant="ghost"
				size="sm"
				onclick={() => {
					state.icon = '';
				}}
			>
				Clear
			</Button>
		{/if}
	</div>
</div>
```

## Testing Strategy

### Unit Tests (EmojiPicker.spec.ts)

- Renders trigger button with default emoji
- Opens popover when trigger clicked
- Displays selected emoji on trigger button
- Calls `onEmojiSelect` callback when emoji selected
- Closes popover after emoji selection
- Clear button removes selected emoji
- Keyboard navigation works (Tab, Enter, Escape)
- Accessible with screen readers (ARIA labels)

### E2E Tests (categories.spec.ts updates)

- Create category with emoji picker (click button, select emoji)
- Edit category and change emoji via picker
- Create category without selecting emoji (optional field)
- Clear selected emoji using clear button
- Search for emoji and select from results (if supported)

## Accessibility

- ✅ Emoji picker has proper ARIA labels and roles
- ✅ Keyboard navigation (Tab through categories, Enter to select, Escape to close)
- ✅ Screen reader announces selected emoji
- ✅ Focus management (returns to trigger after selection)
- ✅ High contrast mode support
- ✅ Touch targets are 44x44px minimum (mobile friendly)

## Performance

- ✅ Lazy load emoji picker (only when opened)
- ✅ Use IndexedDB for emoji data caching (if using emoji-picker-element)
- ✅ Debounce search input (300ms)
- ✅ Virtual scrolling for large emoji lists (if available)
- ✅ Bundle size impact <50kb gzipped

## Known Limitations / Future Improvements

1. **Skin tone support** - Defer to post-MVP if library supports it
2. **Custom emoji upload** - Not needed for MVP
3. **Emoji animations** - Static emojis only for MVP
4. **Emoji autocomplete in text** - Could add `:emoji:` syntax later
5. **Multi-emoji selection** - Single emoji only for categories

## Lessons Learned

(To be filled after implementation)

## Files to Create

### Components

- `src/lib/components/EmojiPicker/EmojiPicker.svelte`
- `src/lib/components/EmojiPicker/EmojiPicker.spec.ts`
- `src/lib/components/EmojiPicker/index.ts`

### Tests

- Update `tests/categories.spec.ts`

## Dependencies

- **To be added:** `emoji-picker-element` (recommended) or alternative library
- **Already installed:** `lucide-svelte` (for clear button icon if needed)

## Related Tickets

- **Depends on:** ticket-006 (Categories CRUD - implemented the emoji text input)
- **Enhances:** Category creation/editing user experience
- **Future:** Could be reused for user profile avatars, reaction emojis, etc.

## Resources

- [emoji-picker-element](https://github.com/nolanlawson/emoji-picker-element)
- [picmo](https://picmojs.com/)
- [emoji-mart](https://github.com/missive/emoji-mart)
- [Slack Emoji Picker UX](https://slack.com/help/articles/202931348-Use-emoji-and-reactions) (inspiration)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## Success Metrics

- ✅ User feedback: "Easier to add emojis to categories"
- ✅ Reduced support requests about emoji input
- ✅ Increased category creation completion rate
- ✅ Consistent emoji selection experience across platforms
- ✅ No significant performance degradation (<100ms to open picker)

## Notes

- Start with emoji-picker-element for MVP (best balance of features/size)
- Consider adding emoji picker to other components (user profiles, labels) in future tickets
- Ensure emoji rendering works in all browsers (use system fonts or emoji font CDN)
- Test on real devices (Mac, Windows, Android, iOS) before merging
