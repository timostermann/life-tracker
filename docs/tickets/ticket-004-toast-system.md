# Ticket 004: Toast Notification System

**ID:** ticket-004  
**Scope:** `ui` or `ticket-004`  
**Phase:** 1 (MVP)  
**Dependencies:** ticket-001

## Description

Set up global toast notification system using svelte-sonner for consistent error handling and user feedback throughout the app.

## Tasks

- [ ] Install and configure svelte-sonner
- [ ] Create toast utilities in `src/lib/utils/toast.ts`
- [ ] Add `<Toaster />` to root layout
- [ ] Create typed toast functions (success, error, warning, info)
- [ ] Create API error handling utility that shows toasts
- [ ] Document toast usage patterns
- [ ] Add unit tests for toast utilities
- [ ] Test toast accessibility

## Acceptance Criteria

- ✅ svelte-sonner installed and configured
- ✅ Toaster component in root layout
- ✅ Toast functions typed and exportable
- ✅ API errors automatically show toasts
- ✅ Toast position configurable
- ✅ Toast duration appropriate (success: 3s, error: manual)
- ✅ Toasts accessible (screen reader announcements)
- ✅ Multiple toasts stack properly

## Technical Notes

**Toast utility:**

```typescript
// src/lib/utils/toast.ts
import { toast as sonnerToast } from 'svelte-sonner';

export const toast = {
	success: (message: string) => sonnerToast.success(message, { duration: 3000 }),
	error: (message: string) => sonnerToast.error(message, { duration: Infinity }),
	warning: (message: string) => sonnerToast.warning(message, { duration: 5000 }),
	info: (message: string) => sonnerToast.info(message, { duration: 3000 })
};
```

**API error handler:**

```typescript
export async function apiCall<T>(fn: () => Promise<Response>): Promise<T> {
	try {
		const response = await fn();
		const data = await response.json();

		if (!response.ok) {
			toast.error(data.error || 'Something went wrong');
			throw new Error(data.error);
		}

		if (data.toast === 'success') {
			toast.success(data.message || 'Success');
		}

		return data;
	} catch (error) {
		toast.error('Network error. Please try again.');
		throw error;
	}
}
```

## Testing

- ✅ Unit test: Each toast type renders
- ✅ Unit test: Toast duration correct
- ✅ Unit test: API error shows toast
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
