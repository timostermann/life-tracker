# Ticket 001: Project Setup

**ID:** ticket-001  
**Scope:** `setup` or `ticket-001`  
**Phase:** 1 (MVP)  
**Dependencies:** None

## Description

Initialize the Life Tracker project with SvelteKit, TypeScript, Tailwind CSS, shadcn-svelte, Zod, Histoire, and all development tooling (Husky, lint-staged, commitlint, Prettier, ESLint).

## Tasks

- [ ] Initialize SvelteKit project with TypeScript
- [ ] Configure Tailwind CSS v4
- [ ] Install and configure shadcn-svelte
- [ ] Set up Zod for validation
- [ ] Set up ESLint with flat config
- [ ] Configure Prettier with Tailwind plugin
- [ ] Set up Husky git hooks
- [ ] Configure lint-staged (with co-located tests)
- [ ] Set up commitlint (allow ticket IDs as scopes)
- [ ] Configure commit-and-tag-version for releases
- [ ] Install svelte-sonner for toasts
- [ ] Install Histoire for component stories
- [ ] Create `.gitignore`, `.prettierignore`, `.eslintignore`
- [ ] Initialize git repository
- [ ] Create `package.json` with all scripts
- [ ] Set Node 24 requirement in engines field
- [ ] Create project structure (`lib/`, `routes/`, etc.)

## Acceptance Criteria

- ✅ Project builds successfully (`npm run build`)
- ✅ Linting works (`npm run lint`)
- ✅ Pre-commit hooks run on commit
- ✅ Commit messages validated (conventional + ticket IDs)
- ✅ TypeScript has no errors
- ✅ shadcn-svelte components importable
- ✅ Zod installed and importable
- ✅ Histoire runs (`npm run story:dev`)
- ✅ Toasts render correctly (test with svelte-sonner)
- ✅ README.md with setup instructions

## Technical Notes

**Node & npm:**

- Node 24+ (current LTS)
- npm 11+

**Commitlint scopes:**

```typescript
['setup', 'db', 'auth', 'categories', 'items', 'habits', 'ui', 'docs', 'api', 'pwa',
 'ticket-001', 'ticket-002', 'ticket-003', ...] // allow ticket IDs
```

**Lint-staged:**

```javascript
{
  '**/*.{js,ts,svelte}': ['prettier --write', 'eslint --fix'],
  '**/*.{json,yml,css}': ['prettier --write'],
  '**/*.{ts,svelte}': ['vitest related --run'] // co-located tests
}
```

**shadcn-svelte init:**

```bash
npx shadcn-svelte@latest init
```

**Project structure:**

```
src/
├── lib/
│   ├── components/    # shadcn + custom
│   │   └── ui/       # shadcn components
│   ├── schemas/      # Zod schemas
│   ├── server/       # Server utilities
│   └── utils/        # Shared utilities
└── routes/
    ├── api/          # API endpoints
    └── +page.svelte  # Pages
```

## Testing

- ✅ Run `npm run build` successfully
- ✅ Run `npm run lint` with no errors
- ✅ Make test commit, verify hooks run
- ✅ Test commitlint with: `feat(ticket-001): test commit`
- ✅ Run `npm run story:dev`, verify Histoire opens
- ✅ Import and render a toast notification

## Accessibility

N/A (infrastructure setup)

## Performance

N/A (infrastructure setup)
