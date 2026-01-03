# Ticket 011: Templates

**ID:** ticket-011  
**Scope:** `categories` or `ticket-011`  
**Phase:** 1 (MVP)  
**Dependencies:** ticket-006

## Description

Implement category template system with pre-built templates for Tasks, Chores, and Habits.

## Tasks

- [ ] Verify templates table seeded (from ticket-002)
- [ ] Create Zod schema for applying templates
- [ ] Create API endpoint to list templates
- [ ] Create API endpoint to apply template
- [ ] Create template picker UI
- [ ] Create template card component
- [ ] Allow custom name when applying template
- [ ] Copy field definitions from template to category
- [ ] Add unit tests (co-located)
- [ ] Add E2E test for template application

## Built-in Templates

**1. Tasks:**

- Template type: `task`
- Icon: ✓
- Color: #3b82f6
- Fields: Title (text), Description (text)

**2. Chores:**

- Template type: `chore`
- Icon: 🧹
- Color: #10b981
- Fields: Chore Name (text), Notes (text)

**3. Habits:**

- Template type: `habit`
- Icon: 📈
- Color: #8b5cf6
- Fields: Habit Name (text), Goal (text), Is Good Habit (boolean)

## API Endpoints

- `GET /api/templates` - List all templates
- `GET /api/templates?type=task` - Filter by type
- `POST /api/templates/:id/apply` - Create category from template

## Acceptance Criteria

- ✅ Users can view available templates
- ✅ Templates grouped by type
- ✅ Template cards show icon, name, description
- ✅ Can preview template fields before applying
- ✅ User can customize category name when applying
- ✅ Applying template creates category with all fields
- ✅ Field order preserved from template
- ✅ Success toast after application
- ✅ Redirects to new category after creation
- ✅ All operations validated with Zod

## Technical Notes

**Zod schema:**

```typescript
export const applyTemplateSchema = z.object({
	name: z.string().min(1).max(100)
});
```

**Template application logic:**

```typescript
async function applyTemplate(templateId: number, categoryName: string, userId: number) {
	const template = await db.getTemplate(templateId);
	const config = JSON.parse(template.category_config);

	// Create category
	const category = await db.createCategory({
		user_id: userId,
		name: categoryName,
		template_type: template.template_type,
		icon: config.icon,
		color: config.color,
		is_private: true
	});

	// Create fields from template
	for (const field of config.fields) {
		await db.createField({
			category_id: category.id,
			name: field.name,
			field_type: field.field_type,
			options: field.options,
			field_order: field.field_order
		});
	}

	return category;
}
```

## Testing

- ✅ Unit test: Template config parses correctly
- ✅ Unit test: Apply creates category + fields
- ✅ Unit test: Field order preserved
- ✅ Unit test: Custom name applied
- ✅ E2E test: Apply Tasks template
- ✅ E2E test: Apply Chores template
- ✅ E2E test: Apply Habits template

## Accessibility

- ✅ Template cards keyboard accessible
- ✅ Template descriptions clear
- ✅ Name input properly labeled
- ✅ Preview modal accessible

## Performance

- ✅ Templates cached (rarely change)
- ✅ Template application in transaction
- ✅ No N+1 queries
