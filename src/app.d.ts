// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
		interface Locals {
			user: { id: number; username: string } | null;
			session: {
				id: string;
				userId: string | number;
				expiresAt: Date;
				fresh?: boolean;
			} | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
