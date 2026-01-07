import { toast as sonnerToast } from 'svelte-sonner';

type SonnerToastFn = typeof sonnerToast.success;
type SonnerToastArgs = Parameters<SonnerToastFn>;
type SonnerToastOptions = SonnerToastArgs[1];

function withDefaults(
	options: SonnerToastOptions | undefined,
	defaults: SonnerToastOptions
): SonnerToastOptions {
	return { ...defaults, ...(options ?? {}) };
}

export const toast = {
	success(message: string, options?: SonnerToastOptions) {
		return sonnerToast.success(
			message,
			withDefaults(options, { duration: 3000, closeButton: true })
		);
	},

	info(message: string, options?: SonnerToastOptions) {
		return sonnerToast.info(message, withDefaults(options, { duration: 3000, closeButton: true }));
	},

	warning(message: string, options?: SonnerToastOptions) {
		return sonnerToast.warning(
			message,
			withDefaults(options, { duration: 5000, closeButton: true })
		);
	},

	error(message: string, options?: SonnerToastOptions) {
		return sonnerToast.error(
			message,
			withDefaults(options, { duration: Infinity, closeButton: true })
		);
	}
};
