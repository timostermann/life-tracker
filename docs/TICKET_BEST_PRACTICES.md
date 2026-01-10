# Ticket Implementation Best Practices

Lessons learned from ticket-006 to improve efficiency and quality on future tickets.

## Planning Phase

### Before Starting Implementation

1. **Review Dependencies**
   - Check which previous tickets need to be completed
   - Verify reusable patterns exist (composables, utilities)
   - Identify what can be copied/adapted vs built from scratch

2. **Design Data Flow**
   - Backend: Schema → Queries → API
   - Frontend: Load data → Components → Composables → API calls
   - Think about reusable patterns early

3. **Identify Reusable Patterns**
   - Can existing composables be used? (useCrudDialogs, API utilities)
   - Are there similar components to reference?
   - What utilities already exist?

## Implementation Phase

### Backend First Approach (Recommended)

**Order of implementation:**

1. Schemas (Zod validation)
2. Database queries with tests
3. API endpoints
4. Frontend components
5. Page integration
6. E2E tests

**Benefits:**

- Backend can be tested independently
- Frontend knows exact API shape
- Easier to debug issues
- Better git commit organization

### Component Organization

**Split components early:**

- If main component will be >150 lines, plan sub-components from start
- Extract logic to composables immediately
- Don't wait until "refactoring phase"

**Pattern for large forms:**

```
ComponentForm/
  ComponentForm.svelte          ← 50-80 lines (orchestration)
  ComponentBasicInfo.svelte     ← 100-120 lines (section 1)
  ComponentAdvancedSection.svelte ← 100-120 lines (section 2)
  useComponentFormState.svelte.ts ← 150 lines (state logic)
  index.ts
```

### Testing Strategy

**Write tests alongside code, not after:**

- Backend: Test each query function as you write it
- Frontend: Test composables immediately
- E2E: Write after UI is functional

**Test coverage target:** 100% for new/modified files

- Run coverage frequently: `npm run test:unit -- --coverage`
- Don't let untested code accumulate

## Common Pitfalls & Solutions

### 1. Empty Edit Forms

**Problem:** Using `$derived.by(() => useComposable(props))` creates new state on every prop change.

**Solution:**

```typescript
// ✅ GOOD
const state = useComposable();

$effect(() => {
	if (initialData) {
		state.loadData(initialData);
	}
});
```

### 2. Dialog Backgrounds Missing

**Problem:** Forgot to add theme color variables.

**Solution:** Always check `layout.css` has OKLCH color variables:

```css
@theme {
	--color-background: oklch(100% 0 0);
	--color-foreground: oklch(9.61% 0.021 285.82);
	/* ... other semantic colors */
}
```

### 3. Dynamic Tailwind Classes Don't Work

**Problem:** Using template literals `` `bg-${color}-500` ``

**Solution:** Create explicit class mapping utility early:

```typescript
const COLOR_CLASSES = {
	blue: { bg: { '500': 'bg-blue-500' } }
};
```

### 4. Type Casts Everywhere

**Problem:** Using `as Type` without runtime validation.

**Solution:** Create type guards:

```typescript
export function isType(value: unknown): value is Type {
	return /* validation logic */;
}
```

### 5. Boilerplate Explosion

**Problem:** Copy-pasting similar logic across features.

**Solution:** Extract to composables/utilities immediately:

- Dialog state → `useCrudDialogs`
- API calls → Generic utilities
- Form validation → Reusable schemas

## Git Best Practices

### Commit Organization for Review

**Good structure (5-7 commits):**

1. `feat(XXX): add backend infrastructure` - schemas, queries, API
2. `feat(XXX): add UI components and page` - all frontend
3. `test(XXX): add comprehensive test suite` - all tests
4. `feat(XXX): add theme/styling improvements` - visual polish
5. `chore(XXX): improve tooling` - lint, format, config
6. `docs(XXX): add documentation` - ticket docs, AGENTS.md

**Why this structure works:**

- ✅ Each commit is self-contained and reviewable
- ✅ Logical flow: backend → frontend → tests → polish → docs
- ✅ Easy to understand scope of changes
- ✅ Good for changelog/release notes

**Avoid:**

- ❌ 30+ commits showing every iteration
- ❌ Single giant commit with everything
- ❌ Commits like "fix bug" or "wip"

### Commit Message Quality

**Good commit messages explain WHY:**

```
feat(006): add comprehensive theme system with WCAG AA compliance

Add complete theme with light/dark mode support. Uses OKLCH color format
for Tailwind v4 compatibility. Includes getContrastTextColor utility to
ensure proper contrast ratios for accessibility.

Fixes transparent dialog backgrounds by providing semantic color variables
that Tailwind utilities depend on.
```

**Bad commit messages:**

```
feat: add colors
fix: update dialog
```

## Quality Checklist

### Before Saying "Done"

- [ ] All tests pass (no flaky tests)
- [ ] 100% coverage for touched files
- [ ] Linting passes (prettier + eslint + svelte-check)
- [ ] Build succeeds
- [ ] No console errors/warnings in browser
- [ ] Documentation updated (ticket MD, AGENTS.md if needed)
- [ ] Git history is clean and reviewable
- [ ] Accessibility verified (keyboard nav, ARIA, contrast)

### Pre-existing Issues

**Don't block on pre-existing failures:**

- If tests timeout due to WAL mode issues → skip with note
- If linting flags pre-existing files → exclude and note
- Focus on YOUR changes being high quality

## Efficiency Tips

### Leverage Existing Patterns

**Before writing new code, check:**

1. Can I copy from a similar component? (e.g., TaskForm → CategoryForm)
2. Does a utility already exist? (check `src/lib/utils/`)
3. Can I reuse a composable? (check `src/lib/composables/`)

**Example time savings:**

- With `useCrudDialogs`: 48% less boilerplate
- With API utilities: Consistent error handling for free
- With color utility: No need to build class generator

### Parallel Work

**When stuck on one part:**

- Work on tests while thinking about implementation
- Write documentation while code is fresh
- Create E2E tests for happy path first

### Use AI Effectively

**Good AI prompts:**

- "Create a composable similar to useCategoryActions but for tasks"
- "Add tests for this function achieving 100% coverage"
- "Review this code for shadcn-svelte best practices"

**Avoid:**

- Vague requests leading to wrong patterns
- Letting AI make architectural decisions without review
- Accepting code without understanding it

## Communication

### When to Ask for Help

**Ask early if:**

- Architectural decision affects multiple features
- Pattern seems overcomplicated
- Test strategy unclear
- Performance concerns

**Don't ask if:**

- Similar pattern exists in codebase (copy and adapt)
- Issue is clearly documented in AGENTS.md
- Solution is a Google search away

### Documentation Updates

**Always update these:**

- Ticket MD: Mark completed, add stats
- AGENTS.md: Add new patterns or gotchas
- README: If new commands/scripts added

**When to create new docs:**

- New major pattern introduced (like useCrudDialogs)
- Complex domain logic needs explanation
- Setup process changed

## Future Ticket Predictions

### Ticket-007 (Sharing) Prep

**Reusable from ticket-006:**

- Category queries (reference pattern)
- Permission validation pattern
- Toast notifications
- Test patterns

**New challenges:**

- Multi-user scenarios in tests
- Permission UI components
- Share modal/dialog

### Ticket-008 (Tasks) Prep

**Reusable from ticket-006:**

- `useCrudDialogs` composable (direct reuse!)
- API utilities (direct reuse!)
- Form splitting pattern
- Color picker component
- Test patterns (100% coverage approach)

**New challenges:**

- More complex form (priority, dates, assignment)
- Recurring task logic
- Due date calculations

### General Pattern

**Each ticket should:**

1. Reuse 40-60% from previous tickets
2. Add 20-30% new domain logic
3. Polish 10-20% (accessibility, UX)

## Success Metrics

**Healthy ticket velocity:**

- Backend: 1-2 days
- Frontend: 1-2 days
- Tests: 0.5-1 day (if done alongside)
- Polish/docs: 0.5 day

**Total: 3-5 days for a ticket like 006**

**Warning signs:**

- Taking >1 week → probably overcomplicated
- Tons of debugging → missing patterns/utilities
- Low test coverage → tests not written alongside code
- Messy git history → not planning commits

## Resources

- [AGENTS.md](../AGENTS.md) - Technical guidelines
- [Svelte 5 Docs](https://svelte.dev/docs) via MCP server
- [shadcn-svelte](https://shadcn-svelte.com) - Component docs
- [Tailwind CSS v4](https://tailwindcss.com/docs) - Styling reference
