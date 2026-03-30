import { z } from 'zod';

/** Max length for API token labels (matches validation on create). */
export const API_TOKEN_NAME_MAX_LENGTH = 128;

export const createApiTokenSchema = z.object({
	name: z.string().min(1, 'Name is required').max(API_TOKEN_NAME_MAX_LENGTH, 'Name is too long')
});

export type CreateApiTokenInput = z.infer<typeof createApiTokenSchema>;
