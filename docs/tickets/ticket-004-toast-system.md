# Ticket 004: Toast Notification System

**ID:** ticket-004  
**Scope:** `ui` or `ticket-004`  
**Phase:** 1 (MVP)  
**Dependencies:** ticket-001

## Description

Set up global toast notification system using svelte-sonner for consistent error handling and user feedback throughout the app.

## Tasks

- [x] Install and configure svelte-sonner
- [x] Create toast utilities in `src/lib/utils/toast.ts`
- [x] Add `<Toaster />` to root layout
- [x] Create typed toast functions (success, error, warning, info)
- [x] Create API error handling utility that shows toasts
- [x] Document toast usage patterns
- [x] Add unit tests for toast utilities
- [x] Test toast accessibility

## Acceptance Criteria

- ✅ svelte-sonner installed and configured
- ✅ Toaster component in root layout
- ✅ Toast functions typed and exportable
- ✅ API errors automatically show toasts
- ✅ Toast position configurable (currently `top-center` in `src/routes/+layout.svelte`)
- ✅ Toast duration appropriate (success: 3s, error: manual)
- ✅ Toasts accessible (screen reader announcements)
- ✅ Multiple toasts stack properly

## Technical Notes

**Toast utility (implemented):**

- `src/lib/utils/toast.ts` wraps `svelte-sonner` with typed helpers and defaults:
  - success/info: 3s
  - warning: 5s
  - error: manual (`Infinity`)
  - close button enabled by default

**API error handler (implemented):**

- `src/lib/api/fetch.ts` exports `fetch<T>(input, init?, options?)` which:
  - Shows an error toast on non-OK (unless disabled)
  - Special-cases 401 on `/api/*` excluding `/api/auth/*` as “Unauthorized. Please log in.”
  - Shows a network error toast on fetch failures (unless disabled)

## Testing

- ✅ Unit test: Toast defaults + overrides (`src/lib/utils/toast.spec.ts`)
- ✅ Unit test: API error handling + toast behavior (`src/lib/api/fetch.spec.ts`)
- ✅ Unit tests: helper modules (`src/lib/api/*.spec.ts`)
- ✅ Manual test: Multiple toasts stack
- ✅ Manual test: Screen reader announces toasts

## Accessibility

- ✅ Toasts have role="status" or role="alert"
- ✅ Screen reader announces messages
- ✅ Error toasts require manual dismissal
- ✅ Keyboard dismissible (Escape key)

## Performance

- ✅ Toasts don't block UI rendering
- ✅ Auto-dismiss prevents toast buildup
