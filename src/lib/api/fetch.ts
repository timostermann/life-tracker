import { toast } from '$lib/utils/toast';
import { isUnauthorizedApi } from '$lib/api/isUnauthorizedApi';
import { messageFromBody } from '$lib/api/messageFromBody';
import { readBody } from '$lib/api/readBody';
import { urlFromInput } from '$lib/api/urlFromInput';

export class ApiError extends Error {
	status: number;
	url: string;
	body: unknown;

	constructor(args: { status: number; url: string; message: string; body: unknown }) {
		super(args.message);
		this.name = 'ApiError';
		this.status = args.status;
		this.url = args.url;
		this.body = args.body;
	}
}

export type FetchOptions = {
	/**
	 * Show a toast when the request fails (non-2xx) or throws (network error).
	 * Default: true
	 */
	toastOnError?: boolean;
	/**
	 * Show a toast specifically for 401 responses on `/api/*` (excluding `/api/auth/*`).
	 * Default: true
	 */
	toastUnauthorized?: boolean;
};

/**
 * Fetch wrapper that centralizes API error handling + toasts.
 *
 * - On non-OK response: throws ApiError and (optionally) shows a toast.
 * - On network error: rethrows and (optionally) shows a toast.
 */
export async function fetch<T>(
	input: RequestInfo | URL,
	init?: RequestInit,
	options?: FetchOptions
): Promise<T> {
	const toastOnError = options?.toastOnError ?? true;
	const toastUnauthorized = options?.toastUnauthorized ?? true;
	const url = urlFromInput(input);

	let res: Response;
	try {
		res = await globalThis.fetch(input, init);
	} catch (err) {
		if (toastOnError) {
			toast.error('Network error. Please try again.');
		}
		throw err;
	}

	const body = await readBody(res);

	if (res.ok) return body as T;

	const unauthorized = isUnauthorizedApi(url, res.status);
	const msg = unauthorized
		? 'Unauthorized. Please log in.'
		: messageFromBody(body, `Request failed (${res.status})`);

	const shouldToast = toastOnError && (!unauthorized || toastUnauthorized);
	if (shouldToast) {
		toast.error(msg);
	}

	throw new ApiError({ status: res.status, url: url?.toString() ?? '', message: msg, body });
}
