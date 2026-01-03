# Ticket 006: Categories CRUD

**ID:** ticket-006  
**Scope:** `categories` or `ticket-006`  
**Phase:** 1 (MVP)  
**Dependencies:** ticket-002, ticket-003, ticket-005

## Description

Implement full CRUD operations for categories including API endpoints with Zod validation and UI with shadcn components.

## Tasks

- [ ] Create Zod schemas for category operations
- [ ] Create API endpoints (GET, POST, PUT, DELETE)
- [ ] Create categories list page (`/categories`)
- [ ] Create category form component (create/edit)
- [ ] Create category card component
- [ ] Add delete confirmation dialog
- [ ] Implement template_type selection (task/chore/habit)
- [ ] Add icon picker component
- [ ] Add color picker component
- [ ] Add validation with error toasts
- [ ] Add loading states
- [ ] Add unit tests for API endpoints (co-located)
- [ ] Add unit tests for components (co-located)
- [ ] Add E2E test for category creation

## API Endpoints

- `GET /api/categories` - List user's categories (+ shared)
- `GET /api/categories/:id` - Get category with fields
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category (+ items)

## Acceptance Criteria

- ✅ Users can view all their categories
- ✅ Users can create categories with template_type
- ✅ Users can select icon (emoji picker)
- ✅ Users can select color (color picker)
- ✅ Users can edit existing categories
- ✅ Users can delete categories with confirmation
- ✅ Deleting shows confirmation dialog
- ✅ Only owner can modify their categories
- ✅ Validation errors shown via toast
- ✅ Loading states visible during requests
- ✅ Success toasts on create/update/delete
- ✅ All operations properly validated with Zod

## Technical Notes

**Zod schemas:**

```typescript
export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  template_type: z.enum(["task", "chore", "habit"]),
  icon: z.string().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i)
    .optional(),
  fields: z.array(fieldSchema),
});
```

**API response with toast:**

```typescript
return json(
  {
    category,
    toast: "success",
    message: "Category created successfully",
  },
  { status: 201 }
);
```

## Testing

- ✅ Unit test: Zod validates category data
- ✅ Unit test: API creates category
- ✅ Unit test: API enforces ownership
- ✅ Unit test: Form validates input
- ✅ E2E test: Complete category creation flow
- ✅ E2E test: Delete with confirmation

## Accessibility

- ✅ Form labels properly associated
- ✅ Error messages announced
- ✅ Delete confirmation keyboard accessible
- ✅ Focus management on modal open/close
- ✅ Icon picker keyboard navigable

## Performance

- ✅ Categories list paginated if > 50
- ✅ Optimistic UI updates (show immediately)
- ✅ Debounced search/filter
