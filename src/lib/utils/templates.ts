import type { Template } from '$lib/schemas';
import { templateConfigSchema, type TemplateConfig } from '$lib/schemas/templates';

export function parseTemplateConfig(configJson: string): TemplateConfig | null {
	try {
		const parsed = JSON.parse(configJson);
		const result = templateConfigSchema.safeParse(parsed);
		return result.success ? result.data : null;
	} catch {
		return null;
	}
}

export function getDefaultCategoryName(template: Template): string {
	const config = parseTemplateConfig(template.category_config);
	return config?.name || template.name;
}
