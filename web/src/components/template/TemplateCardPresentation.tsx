'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TemplateCardActions } from './ui/TemplateCardActions';
import { TemplateCardStats } from './ui/TemplateCardStats';
import { TemplateCardTags } from './ui/TemplateCardTags';
import { formatQuizDate } from '@/lib/utils/quiz';
import type { Tag } from '@/types/quiz';

interface TemplateCardPresentationProps {
  title: string;
  description?: string | null;
  category?: string | null;
  isPublic: boolean;
  usageCount: number;
  tags: Tag[];
  updatedAt: Date | string;
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  };
  thumbnail?: string | null;
  onPreview: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onCreateQuiz: () => void;
  onDelete: () => void;
}

export function TemplateCardPresentation({
  title,
  description,
  category,
  isPublic,
  usageCount,
  tags,
  updatedAt,
  createdBy,
  thumbnail,
  onPreview,
  onEdit,
  onDuplicate,
  onCreateQuiz,
  onDelete,
}: TemplateCardPresentationProps) {
  const t = useTranslations('templateManagement');

  return (
    <Card
      className="group cursor-pointer transition-shadow hover:shadow-md"
      data-testid="template-card"
      onClick={onPreview}
    >
      <CardHeader className="pb-3">
        {/* Thumbnail */}
        {thumbnail && (
          <div className="bg-muted mb-3 aspect-video w-full overflow-hidden rounded-md">
            <Image
              src={thumbnail}
              alt={title}
              width={400}
              height={225}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-1">
            <h3 className="line-clamp-2 leading-none font-semibold tracking-tight">
              {title}
            </h3>
            {description && (
              <p className="text-muted-foreground line-clamp-2 text-sm">
                {description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isPublic && (
              <Badge variant="secondary" className="text-xs">
                {t('cardPresentation.public')}
              </Badge>
            )}
            <TemplateCardActions
              onPreview={onPreview}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onCreateQuiz={onCreateQuiz}
              onDelete={onDelete}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <TemplateCardStats
          category={category}
          usageCount={usageCount}
          createdBy={createdBy}
        />
      </CardContent>

      <CardFooter className="flex items-center justify-between pt-3">
        <TemplateCardTags tags={tags} />
        <div className="text-muted-foreground text-xs">
          {t('cardPresentation.updated')}: {formatQuizDate(updatedAt)}
        </div>
      </CardFooter>
    </Card>
  );
}
