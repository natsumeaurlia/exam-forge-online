'use client';

import { Badge } from '@/components/ui/badge';
import type { Tag } from '@/types/quiz';

interface TemplateCardTagsProps {
  tags: Tag[];
}

export function TemplateCardTags({ tags }: TemplateCardTagsProps) {
  if (!tags || tags.length === 0) {
    return <div />;
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {tags.slice(0, 3).map(tag => (
        <Badge
          key={tag.id}
          variant="outline"
          className="h-5 text-xs"
          style={{
            borderColor: tag.color || undefined,
            color: tag.color || undefined,
          }}
        >
          {tag.name}
        </Badge>
      ))}
      {tags.length > 3 && (
        <Badge variant="outline" className="h-5 text-xs">
          +{tags.length - 3}
        </Badge>
      )}
    </div>
  );
}
