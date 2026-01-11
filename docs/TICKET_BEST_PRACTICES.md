# Ticket Implementation Best Practices

Lessons learned from ticket-006 to improve efficiency and quality on future tickets.

## Planning Phase

### Before Starting Implementation

1. **Review Dependencies** - Check which previous tickets need completion, identify reusable patterns
2. **Design Data Flow** - Backend: Schema → Queries → API. Frontend: Load → Components → API
3. **Identify Reusable Patterns** - Can existing composables/utilities be used?

## Implementation Phase

### Backend First Approach (Recommended)

**Order:**

1. Schemas (Zod validation)
2. Database queries with tests
3. API endpoints
4. Frontend components
5. Page integration
6. E2E tests

**Benefits:** Backend tested independently, frontend knows exact API shape, easier debugging, better git commit organization

### Component Organization

**Split components early:**

- If main component will be >150 lines, plan sub-components from start
- Extract logic to composables immediately

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

**Target:** 100% coverage for new/modified files. Run `npm run test:unit -- --coverage` frequently.

## Common Pitfalls & Solutions

1. **Empty edit forms** - Don't use `$derived.by(() => useComposable(props))`. Create composable once, then call `state.loadData(initialData)` in `$effect`.

2. **Dialog backgrounds missing** - Add OKLCH color variables to `layout.css`: `--color-background: oklch(100% 0 0);`

3. **Dynamic Tailwind classes don't work** - Use explicit class mapping, not template literals: `const COLOR_CLASSES = { blue: { bg: { '500': 'bg-blue-500' } } };`

4. **Type casts everywhere** - Use runtime type guards instead: `export function isType(value: unknown): value is Type { return /* validation */ }`

5. **Boilerplate explosion** - Extract to composables/utilities immediately: dialog state → `useCrudDialogs`, API calls → generic utilities

## Git Best Practices

### Commit Organization for Review

**Good structure (5-7 commits):**

1. `feat(XXX): add backend infrastructure` - schemas, queries, API
2. `feat(XXX): add UI components and page` - all frontend
3. `test(XXX): add comprehensive test suite` - all tests
4. `feat(XXX): add theme/styling improvements` - visual polish
5. `docs(XXX): add documentation` - ticket docs, updates

**Benefits:** Each commit self-contained, logical flow, easy to understand, good for changelog

**Avoid:** 30+ iteration commits, single giant commit, commits like "fix bug" or "wip"

### Commit Message Quality

**Good (explains WHY):**

```
feat(006): add comprehensive theme system with WCAG AA compliance

Add complete theme with light/dark mode support. Uses OKLCH color format
for Tailwind v4 compatibility. Includes getContrastTextColor utility to
ensure proper contrast ratios for accessibility.
```

**Bad:** `feat: add colors` or `fix: update dialog`

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

Don't block on pre-existing failures. If tests timeout due to WAL mode issues or linting flags pre-existing files, exclude and note. Focus on YOUR changes being high quality.

## Efficiency Tips

### Leverage Existing Patterns

**Before writing new code:**

1. Can I copy from a similar component? (e.g., TaskForm → CategoryForm)
2. Does a utility already exist? (check `src/lib/utils/`)
3. Can I reuse a composable? (check `src/lib/composables/`)

**Time savings:** With `useCrudDialogs` = 48% less boilerplate. With API utilities = consistent error handling for free.

### Parallel Work

When stuck: Work on tests while thinking about implementation, write docs while code is fresh, create E2E tests for happy path first.

### Use AI Effectively

**Good prompts:**

- "Create a composable similar to useCategoryActions but for tasks"
- "Add tests for this function achieving 100% coverage"
- "Review this code for shadcn-svelte best practices"

**Avoid:** Vague requests, letting AI make architectural decisions without review, accepting code without understanding it.

## Communication

### When to Ask for Help

**Ask early if:** Architectural decision affects multiple features, pattern seems overcomplicated, test strategy unclear, performance concerns.

**Don't ask if:** Similar pattern exists in codebase (copy and adapt), issue is documented in AGENTS.md, solution is a Google search away.

### Documentation Updates

**Always update:**

- Ticket MD: Mark completed, add stats
- AGENTS.md: Add new patterns or gotchas
- README: If new commands/scripts added

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
