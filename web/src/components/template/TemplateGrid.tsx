import { TemplateCardContainer } from './TemplateCardContainer';
import type { TemplateListItem } from '@/types/template';

interface TemplateGridProps {
  templates: TemplateListItem[];
  lng: string;
}

export function TemplateGrid({ templates, lng }: TemplateGridProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {templates.map(template => (
        <TemplateCardContainer
          key={template.id}
          template={{ ...template, lng }}
          lng={lng}
        />
      ))}
    </div>
  );
}
