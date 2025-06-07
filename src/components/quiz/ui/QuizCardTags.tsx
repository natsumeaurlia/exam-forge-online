import { Badge } from '@/components/ui/badge';
import type { Tag } from '@/types/quiz';

interface QuizCardTagsProps {
  tags: Tag[];
}

export function QuizCardTags({ tags }: QuizCardTagsProps) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {tags.map(tag => (
        <Badge key={tag.id} variant="outline" className="text-xs">
          {tag.name}
        </Badge>
      ))}
    </div>
  );
}
