# Toasts

This app uses [`svelte-sonner`](https://www.npmjs.com/package/svelte-sonner) for toast notifications, wrapped behind small utilities for consistency.

## Import paths

- Toast helpers: `\$lib/utils/toast`
- API helper (preferred): `\$lib/api/fetch`

## Toast helper

Use the shared `toast` wrapper instead of importing from `svelte-sonner` directly:

```ts
import { toast } from '$lib/utils/toast';

toast.success('Saved');
toast.info('Heads up');
toast.warning('Something looks off');
toast.error('Something went wrong');
```

Default behavior:

- `success` / `info`: 3s
- `warning`: 5s
- `error`: manual dismissal (`duration: Infinity`)
- close button enabled by default

## API helper (`fetch`)

Use `fetch` for API calls where you want standardized error handling + toasts:

```ts
import { fetch } from '$lib/api/fetch';

const data = await fetch<{ items: unknown[] }>('/api/items');
```

Behavior:

- On non-OK response: throws `ApiError` and shows an error toast (unless disabled).
- On 401 for `/api/*` (excluding `/api/auth/*`): shows `Unauthorized. Please log in.` (unless disabled).
- On network failure: shows `Network error. Please try again.` (unless disabled).

### Disabling automatic toasts (forms/auth)

For endpoints where the UI owns error presentation (e.g. login form), disable auto-toasts:

```ts
import { fetch } from '$lib/api/fetch';

await fetch('/api/auth/login', { method: 'POST' }, { toastOnError: false });
```
