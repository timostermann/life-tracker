# Ticket 018: Map Zod Errors from Server to Form Components

**ID:** ticket-018  
**Scope:** `forms` or `ticket-018`  
**Phase:** 1 (MVP)  
**Dependencies:** ticket-006, ticket-008, ticket-009

## Description

Currently, when server-side Zod validation fails, errors are only displayed as toast notifications. Users cannot see which specific form fields have validation errors, making it difficult to fix issues. This ticket implements a system to map Zod validation errors from API responses to the corresponding form components, displaying field-level error messages inline.

## Problem Statement

**Current behavior:**

- Server returns Zod errors in format: `{ error: 'Invalid input', issues: parsed.error.flatten(), toast: 'error', message: 'Please check your input and try again' }`
- Forms only show client-side validation errors
- Server errors appear as generic toast messages
- Users cannot identify which fields need correction

**Desired behavior:**

- Server validation errors map to specific form fields
- Field-level errors display inline below the corresponding input
- Nested field paths (e.g., `values.123`, `recurring_config.frequency`) map correctly
- Form-level errors display at the top of the form
- Both client-side and server-side errors coexist seamlessly

## Tasks

- [ ] Create utility function to parse Zod error structure from API responses
- [ ] Create error mapping utility for nested field paths
- [ ] Update form state composables to accept server errors
- [ ] Update API utilities to extract and return error details
- [ ] Update ChoreForm to handle server errors
- [ ] Update TaskForm to handle server errors
- [ ] Update CategoryForm to handle server errors
- [ ] Handle nested field paths (`values.{fieldId}`, `recurring_config.frequency`, etc.)
- [ ] Handle form-level errors (display at top of form)
- [ ] Clear server errors when user modifies fields
- [ ] Add unit tests for error mapping utilities
- [ ] Add unit tests for form state error handling
- [ ] Add E2E tests for server error display

## Technical Implementation

### 1. Error Structure

Zod's `error.flatten()` returns:

```typescript
{
  fieldErrors: Record<string, string[]>,  // e.g., { "values.123": ["Required"], "recurring_config.frequency": ["Invalid"] }
  formErrors: string[]                    // e.g., ["Chores must have a recurring schedule"]
}
```

### 2. Field Path Mapping

**Field paths to map:**

- `values.{fieldId}` → Form field with ID `fieldId` (e.g., `values.5` → field ID 5)
- `recurring_config.frequency` → RecurringConfigDialog frequency field
- `recurring_config.interval` → RecurringConfigDialog interval field
- `assigned_to_user_id` → AssigneeSelector
- `priority` → Priority selector (TaskForm)
- `deadline` → Deadline input (TaskForm)
- `time_estimate` → Time estimate input (TaskForm)
- `name` → Category name input (CategoryForm)
- `fields.{index}.name` → Category field name (CategoryForm)
- `fields.{index}.field_type` → Category field type (CategoryForm)

### 3. Error Mapping Utility

Create `src/lib/utils/zodErrorMapper.ts`:

```typescript
/**
 * Maps Zod flattened error structure to form field errors
 *
 * @param issues - Zod error.flatten() result
 * @param fieldPathMap - Map of Zod field paths to form field keys
 * @returns Record of form field keys to error messages
 *
 * @example
 * const issues = {
 *   fieldErrors: { "values.5": ["Required"], "recurring_config.frequency": ["Invalid"] },
 *   formErrors: []
 * };
 * const fieldPathMap = {
 *   "values.5": "5",  // Map values.5 to field ID "5"
 *   "recurring_config.frequency": "recurring_config.frequency"
 * };
 * mapZodErrorsToFormFields(issues, fieldPathMap);
 * // Returns: { "5": "Required", "recurring_config.frequency": "Invalid" }
 */
export function mapZodErrorsToFormFields(
	issues: { fieldErrors: Record<string, string[]>; formErrors: string[] },
	fieldPathMap: Record<string, string>
): { fieldErrors: Record<string, string>; formErrors: string[] } {
	const fieldErrors: Record<string, string> = {};

	for (const [zodPath, messages] of Object.entries(issues.fieldErrors)) {
		const formKey = fieldPathMap[zodPath] ?? zodPath;
		// Take first error message (Zod returns array)
		fieldErrors[formKey] = messages[0] ?? 'Invalid value';
	}

	return {
		fieldErrors,
		formErrors: issues.formErrors
	};
}

/**
 * Creates field path map for dynamic field values
 * Maps "values.{fieldId}" paths to form field keys
 */
export function createFieldValuePathMap(fieldIds: number[]): Record<string, string> {
	const map: Record<string, string> = {};
	for (const fieldId of fieldIds) {
		map[`values.${fieldId}`] = fieldId.toString();
	}
	return map;
}

/**
 * Standard field path mappings for common form fields
 */
export const STANDARD_FIELD_PATHS: Record<string, string> = {
	assigned_to_user_id: 'assigned_to_user_id',
	'recurring_config.frequency': 'recurring_config.frequency',
	'recurring_config.interval': 'recurring_config.interval',
	priority: 'priority',
	deadline: 'deadline',
	time_estimate: 'time_estimate',
	name: 'name'
};
```

### 4. Update API Utilities

Update `src/lib/utils/api.ts` to extract error details:

```typescript
type ApiErrorResponse = {
	error: string;
	issues?: {
		fieldErrors: Record<string, string[]>;
		formErrors: string[];
	};
	message?: string;
	toast?: string;
};

export async function apiRequest<T = unknown>(
	url: string,
	options: RequestInit & { successMessage?: string; errorMessage?: string } = {}
): Promise<{
	success: boolean;
	data?: T;
	error?: string;
	issues?: ApiErrorResponse['issues'];
}> {
	try {
		const response = await fetch(url, options);
		const result = await response.json();

		if (!response.ok) {
			const errorMsg = options.errorMessage || result.message || 'Request failed';
			toast.error(errorMsg);
			return {
				success: false,
				error: errorMsg,
				issues: result.issues // Extract Zod error structure
			};
		}

		if (options.successMessage) {
			toast.success(result.message || options.successMessage);
		}

		return { success: true, data: result };
	} catch (error) {
		const errorMsg = options.errorMessage || 'An error occurred. Please try again.';
		toast.error(errorMsg);
		console.error(`API request error (${url}):`, error);
		return { success: false, error: errorMsg };
	}
}
```

### 5. Update Form State Composables

Add `setServerErrors` method to form state composables:

**Example for `useChoreFormState`:**

```typescript
function setServerErrors(issues: { fieldErrors: Record<string, string[]>; formErrors: string[] }) {
	const fieldPathMap = {
		...STANDARD_FIELD_PATHS,
		...createFieldValuePathMap(fieldsReactive.map((f) => f.id))
	};

	const mapped = mapZodErrorsToFormFields(issues, fieldPathMap);

	// Merge with existing errors (don't overwrite client-side validation)
	errors = { ...errors, ...mapped.fieldErrors };

	// Store form-level errors separately if needed
	if (mapped.formErrors.length > 0) {
		errors._form = mapped.formErrors[0];
	}
}

// Clear errors when field value changes
function setFieldValue(fieldId: string, value: string) {
	fieldValues[fieldId] = value;
	// Clear error for this field when user modifies it
	if (errors[fieldId]) {
		const newErrors = { ...errors };
		delete newErrors[fieldId];
		errors = newErrors;
	}
}
```

### 6. Update Form Components

Update form submission handlers to pass errors to state:

**Example for ChoreForm:**

```svelte
<script lang="ts">
	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		if (!state.validate()) {
			return;
		}

		state.loading = true;
		try {
			const formData = state.getFormData();
			const result = await onSubmit(formData);

			// If onSubmit returns error details, map them
			if (result && 'issues' in result && result.issues) {
				state.setServerErrors(result.issues);
			}
		} catch (error) {
			// Handle unexpected errors
			console.error('Form submission error:', error);
		} finally {
			state.loading = false;
		}
	}
</script>

<!-- Display form-level errors -->
{#if state.errors._form}
	<div class="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
		{state.errors._form}
	</div>
{/if}
```

### 7. Update Action Composables

Update `useChoreActions`, `useTaskActions`, etc. to return error details:

```typescript
async function handleCreate(formData: ChoreFormData) {
	const result = await createResource(`/api/categories/${getCategoryId()}/items`, formData, {
		successMessage: 'Chore created successfully',
		errorMessage: 'Failed to create chore'
	});

	if (result.success) {
		dialogs.closeCreate();
		return { success: true };
	}

	// Return error details for form to handle
	return {
		success: false,
		issues: result.issues // Pass through Zod error structure
	};
}
```

## Acceptance Criteria

- ✅ Server validation errors map to correct form fields
- ✅ Field-level errors display inline below inputs
- ✅ Form-level errors display at top of form
- ✅ Nested field paths (`values.{id}`, `recurring_config.*`) map correctly
- ✅ Errors clear when user modifies the field
- ✅ Client-side and server-side errors coexist
- ✅ Works for ChoreForm, TaskForm, and CategoryForm
- ✅ Error messages are user-friendly (not raw Zod messages)
- ✅ All error mapping utilities have unit tests
- ✅ E2E tests verify error display in forms

## Testing

### Unit Tests

**`src/lib/utils/zodErrorMapper.spec.ts`:**

- Test field path mapping for standard fields
- Test dynamic field value mapping (`values.{id}`)
- Test nested object mapping (`recurring_config.frequency`)
- Test form-level error extraction
- Test error message selection (first message from array)

**Form state composables:**

- Test `setServerErrors` method
- Test error clearing on field modification
- Test error merging (client + server)

### E2E Tests

**`e2e/forms-server-errors.spec.ts`:**

- Submit form with invalid data
- Verify field-level errors display
- Verify form-level errors display
- Verify errors clear on field modification
- Verify multiple field errors display simultaneously

## Technical Notes

### Error Message Formatting

Zod error messages may be technical. Consider creating a mapping utility for user-friendly messages:

```typescript
const USER_FRIENDLY_MESSAGES: Record<string, string> = {
	Required: 'This field is required',
	'Invalid enum value': 'Please select a valid option',
	'Expected number, received string': 'Please enter a valid number'
	// ... more mappings
};

function formatErrorMessage(zodMessage: string): string {
	return USER_FRIENDLY_MESSAGES[zodMessage] ?? zodMessage;
}
```

### Nested Object Handling

For nested objects like `recurring_config`, handle both:

- `recurring_config.frequency` → Show error on frequency selector
- `recurring_config` → Show error on RecurringConfigDialog component

### Field ID Mapping

Dynamic fields use numeric IDs in the database but string keys in form state:

- Database: `field_id = 5`
- Form state: `fieldValues["5"]`
- Zod path: `values.5`
- Form error key: `"5"`

Ensure consistent string conversion throughout the mapping chain.

## Performance Considerations

- Error mapping is synchronous and lightweight
- No performance impact expected
- Consider memoizing field path maps if forms have many fields

## Accessibility

- Error messages associated with inputs via `aria-describedby`
- Form-level errors announced to screen readers
- Error styling uses sufficient color contrast
- Focus management: focus first error field after submission

## Future Enhancements

- [ ] Real-time validation (validate on blur, not just submit)
- [ ] Error message localization (i18n)
- [ ] Custom error message overrides per field
- [ ] Error summary at top of form with links to fields
- [ ] Visual indicators (red borders) on error fields
