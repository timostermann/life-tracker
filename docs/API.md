# API Documentation

## Overview

RESTful API built with SvelteKit API routes. All endpoints use Zod validation and return JSON with toast-friendly error messages.

## Base URL

- **Development:** `http://localhost:5173/api`
- **Production:** `https://tracker.timostermann.io/api`

## Authentication

Session-based authentication using Lucia Auth with HTTP-only cookies.

### POST /api/auth/login

Login with username and password.

**Request (Zod Schema):**

```typescript
{
  username: z.string().min(1),
  password: z.string().min(1)
}
```

**Response (200):**

```json
{
	"user": {
		"id": 1,
		"username": "tim"
	}
}
```

**Response (401):**

```json
{
	"error": "Invalid username or password",
	"toast": "error"
}
```

---

### POST /api/auth/logout

Logout and destroy session.

**Response (200):**

```json
{
	"success": true
}
```

---

### GET /api/auth/me

Get current authenticated user.

**Response (200):**

```json
{
	"user": {
		"id": 1,
		"username": "tim"
	}
}
```

**Response (401):**

```json
{
	"error": "Not authenticated",
	"toast": "error"
}
```

---

## Users

### GET /api/users

Get list of all users (excluding current user) for sharing dropdowns.

**Response (200):**

```json
{
	"users": [
		{
			"id": 2,
			"username": "jule"
		}
	]
}
```

**Response (401):**

```json
{
	"error": "Unauthorized",
	"toast": "error"
}
```

---

## Categories

### GET /api/categories

Get all categories (owned + shared with user).

**Query Parameters:**

- `include_counts` (boolean): Include item counts

**Response (200):**

```json
{
  "categories": [
    {
      "id": 1,
      "name": "Household Chores",
      "template_type": "chore",
      "icon": "🧹",
      "color": "#10b981",
      "is_private": false,
      "is_shared": false,
      "is_owner": true,
      "item_count": 5,
      "created_at": "2026-01-01T10:00:00Z"
    },
    {
      "id": 2,
      "name": "Work Tasks",
      "template_type": "task",
      "is_shared": true,
      "permission": "edit",
      ...
    }
  ]
}
```

---

### GET /api/categories/:id

Get category with fields and access info.

**Response (200):**

```json
{
	"category": {
		"id": 1,
		"name": "Household Chores",
		"template_type": "chore",
		"icon": "🧹",
		"color": "#10b981",
		"is_private": false,
		"owner": {
			"id": 1,
			"username": "tim"
		},
		"shared_with": [
			{
				"user_id": 2,
				"username": "girlfriend",
				"permission": "edit"
			}
		],
		"fields": [
			{
				"id": 1,
				"name": "Chore Name",
				"field_type": "text",
				"field_order": 1
			}
		]
	}
}
```

---

### POST /api/categories

Create a new category.

**Request (Zod Schema):**

```typescript
{
  name: z.string().min(1).max(100),
  template_type: z.enum(['task', 'chore', 'habit']),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  fields: z.array(z.object({
    name: z.string().min(1),
    field_type: z.enum(['text', 'number', 'date', 'boolean', 'select']),
    options: z.string().optional(), // JSON array for select
    field_order: z.number().int()
  }))
}
```

**Response (201):**

```json
{
  "category": {...},
  "toast": "success"
}
```

---

### PUT /api/categories/:id

Update category.

**Response (200):**

```json
{
  "category": {...},
  "toast": "success"
}
```

---

### DELETE /api/categories/:id

Delete category and all items.

**Response (200):**

```json
{
	"success": true,
	"toast": "success"
}
```

---

### GET /api/categories/:id/shares

List all users who have access to this category (owner-only).

**Response (200):**

```json
{
	"shares": [
		{
			"user_id": 2,
			"username": "jule",
			"permission": "edit"
		}
	]
}
```

**Response (403):**

```json
{
	"error": "Forbidden",
	"toast": "error"
}
```

---

### POST /api/categories/:id/share

Share category with another user (owner-only).

**Request (Zod Schema):**

```typescript
{
  user_id: z.number().int().positive(),
  permission: z.enum(['view', 'edit'])
}
```

**Response (200):**

```json
{
	"toast": "success",
	"message": "Category shared with username"
}
```

**Response (400) - Already Shared:**

```json
{
	"error": "Already shared",
	"toast": "error",
	"message": "Category is already shared with this user"
}
```

**Note:** Sharing a category automatically sets `is_private` to `false`. This flag is NOT automatically reset when shares are revoked, allowing owners to maintain public categories without active shares.

---

### DELETE /api/categories/:id/share/:userId

Revoke user's access to category (owner-only).

**Response (200):**

```json
{
	"toast": "success",
	"message": "Access revoked"
}
```

---

## Items (Tasks/Chores/Habits)

### GET /api/categories/:categoryId/items

Get items for category.

**Query Parameters:**

- `limit` (number): Items per page. Default: 50
- `offset` (number): Pagination offset. Default: 0
- `include_archived` (boolean): Include archived items. Default: false

**Response (200):**

```json
{
	"items": [
		{
			"id": 1,
			"category_id": 1,
			"user_id": 1,
			"assigned_to": {
				"id": 2,
				"username": "girlfriend"
			},
			"priority": "high",
			"deadline": "2026-01-15T00:00:00Z",
			"time_estimate": 30,
			"is_archived": false,
			"completed_at": null,
			"recurring_config": {
				"frequency": "weekly",
				"interval": 1
			},
			"created_at": "2026-01-02T10:00:00Z",
			"values": {
				"1": "Clean kitchen",
				"2": "Deep clean"
			}
		}
	],
	"total": 5,
	"limit": 50,
	"offset": 0
}
```

---

### GET /api/items/:id

Get single item with full details.

**Response (200):**

```json
{
  "item": {...}
}
```

---

### POST /api/categories/:categoryId/items

Create item (task/chore/habit).

**Request (Zod Schema for Tasks):**

```typescript
{
  priority: z.enum(['urgent', 'high', 'medium', 'low']).optional(),
  deadline: z.string().datetime().optional(),
  time_estimate: z.number().int().positive().optional(),
  assigned_to_user_id: z.number().int().positive().optional(),
  recurring_config: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly']),
    interval: z.number().int().positive()
  }).optional(),
  values: z.record(z.string(), z.string()) // field_id -> value
}
```

**Request (Zod Schema for Chores):**

```typescript
{
  assigned_to_user_id: z.number().int().positive().optional(),
  recurring_config: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly']),
    interval: z.number().int().positive()
  }), // REQUIRED for chores
  values: z.record(z.string(), z.string()) // field_id -> value
}
```

**Note:** The endpoint automatically detects the category's `template_type` and validates using the appropriate schema. Chores require `recurring_config`, while tasks have it as optional.

**Response (201):**

```json
{
  "item": {...},
  "toast": "success"
}
```

---

### PUT /api/items/:id

Update item.

**Request:** Same schema as POST, but fields are optional. For chores, `recurring_config` is still required.

**Response (200):**

```json
{
  "item": {...},
  "toast": "success"
}
```

**Note:** The endpoint automatically detects the item's category `template_type` and validates using the appropriate schema. Chores cannot update `priority`, `deadline`, or `time_estimate` fields.

---

### POST /api/items/:id/complete

Mark item as complete. For recurring items, creates next occurrence.

**Response (200):**

```json
{
  "completed_item": {...},
  "next_item": {...}, // if recurring
  "toast": "success"
}
```

---

### DELETE /api/items/:id

Delete item.

**Response (200):**

```json
{
	"success": true,
	"toast": "success"
}
```

---

## Habit Entries

### GET /api/habits/:itemId/entries

Get habit entries with calculated stats.

**Query Parameters:**

- `from_date` (YYYY-MM-DD): Start date. Default: 30 days ago
- `to_date` (YYYY-MM-DD): End date. Default: today

**Response (200):**

```json
{
	"entries": [
		{
			"id": 1,
			"item_id": 1,
			"logged_date": "2026-01-03",
			"status": "done",
			"notes": "Morning run completed!",
			"created_at": "2026-01-03T08:00:00Z"
		}
	],
	"stats": {
		"current_streak": 5,
		"longest_streak": 12,
		"total_entries": 45,
		"completion_rate": 0.75,
		"last_7_days": 6
	}
}
```

---

### POST /api/habits/:itemId/entries

Log a habit entry for a specific date.

**Request (Zod Schema):**

```typescript
{
  logged_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['done', 'skipped', 'failed']),
  notes: z.string().max(500).optional()
}
```

**Response (201):**

```json
{
  "entry": {...},
  "updated_stats": {...},
  "toast": "success"
}
```

**Response (400) - Duplicate:**

```json
{
	"error": "Entry already exists for this date",
	"toast": "error"
}
```

---

### PUT /api/habits/:itemId/entries/:date

Update existing entry.

**Response (200):**

```json
{
  "entry": {...},
  "updated_stats": {...},
  "toast": "success"
}
```

---

### DELETE /api/habits/:itemId/entries/:date

Delete entry.

**Response (200):**

```json
{
	"success": true,
	"toast": "success"
}
```

---

## Templates

### GET /api/templates

Get all available templates.

**Query Parameters:**

- `type` (task|chore|habit): Filter by type

**Response (200):**

```json
{
  "templates": [
    {
      "id": 1,
      "name": "Tasks",
      "template_type": "task",
      "description": "Action items with priorities and deadlines",
      "icon": "✓",
      "is_system": true,
      "category_config": {
        "name": "Tasks",
        "icon": "✓",
        "color": "#3b82f6",
        "fields": [...]
      }
    }
  ]
}
```

---

### POST /api/templates/:id/apply

Create category from template.

**Request (Zod Schema):**

```typescript
{
	name: z.string().min(1).max(100);
}
```

**Response (201):**

```json
{
  "category": {...},
  "toast": "success"
}
```

---

## Dashboard

### GET /api/dashboard

Get dashboard data (overview, assigned items, due soon).

**Response (200):**

```json
{
  "categories": [...],
  "assigned_to_me": {
    "urgent": [...],
    "high": [...],
    "medium": [...],
    "low": [...]
  },
  "due_soon": [...], // items with deadline < 7 days
  "habits_today": [...] // habits not yet logged today
}
```

---

## Health Check

### GET /api/health

Health check for monitoring.

**Response (200):**

```json
{
	"status": "ok",
	"timestamp": "2026-01-03T16:00:00Z"
}
```

---

## Error Responses

All errors follow this format for toast notifications:

```json
{
	"error": "Human-readable error message",
	"toast": "error", // or "warning"
	"details": {
		"field_name": "Specific error"
	}
}
```

**HTTP Status Codes:**

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

## Zod Validation Examples

### Task Creation Schema

```typescript
import { z } from 'zod';

export const createTaskSchema = z.object({
	priority: z.enum(['urgent', 'high', 'medium', 'low']).optional(),
	deadline: z.string().datetime().optional(),
	time_estimate: z.number().int().min(1).optional(),
	assigned_to_user_id: z.number().int().positive().optional(),
	recurring_config: z
		.object({
			frequency: z.enum(['daily', 'weekly', 'monthly']),
			interval: z.number().int().min(1)
		})
		.optional(),
	values: z.record(z.string(), z.string())
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
```

### Habit Entry Schema

```typescript
export const habitEntrySchema = z.object({
	logged_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	status: z.enum(['done', 'skipped', 'failed']),
	notes: z.string().max(500).optional()
});
```

### Category Schema

```typescript
export const createCategorySchema = z.object({
	name: z.string().min(1).max(100),
	template_type: z.enum(['task', 'chore', 'habit']),
	icon: z.string().emoji().optional(),
	color: z
		.string()
		.regex(/^#[0-9A-F]{6}$/i)
		.optional(),
	fields: z.array(
		z.object({
			name: z.string().min(1).max(50),
			field_type: z.enum(['text', 'number', 'date', 'boolean', 'select']),
			options: z.string().optional(),
			field_order: z.number().int()
		})
	)
});
```

---

## Rate Limiting

Configured in Caddy:

- General API: 100 requests/minute per IP
- Auth endpoints: 10 requests/minute per IP

**Response (429):**

```json
{
	"error": "Too many requests. Please try again later.",
	"toast": "warning"
}
```

---

## Toast Message Format

The `toast` field indicates how to display the message:

- `"success"`: Green toast, auto-dismiss after 3s
- `"error"`: Red toast, requires manual dismiss
- `"warning"`: Orange toast, auto-dismiss after 5s
- `"info"`: Blue toast, auto-dismiss after 3s

Client should use svelte-sonner to display these appropriately.
