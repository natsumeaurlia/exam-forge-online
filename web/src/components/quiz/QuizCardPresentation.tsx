'use client';

import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { QuizStatusBadge } from './ui/QuizStatusBadge';
import { QuizCardStats } from './ui/QuizCardStats';
import { QuizCardTags } from './ui/QuizCardTags';
import { QuizCardActions } from './ui/QuizCardActions';
import { formatQuizDate } from '@/lib/utils/quiz';
import type { Tag } from '@/types/quiz';

interface QuizCardPresentationProps {
  title: string;
  description?: string | null;
  status: string;
  questionsCount: number;
  responsesCount: number;
  tags: Tag[];
  updatedAt: Date | string;
  onPreview: () => void;
  onEdit: () => void;
  onShare: () => void;
  onCopy: () => void;
  onAnalytics: () => void;
  onDelete: () => void;
  onTakeQuiz: () => void;
}

export function QuizCardPresentation({
  title,
  description,
  status,
  questionsCount,
  responsesCount,
  tags,
  updatedAt,
  onPreview,
  onEdit,
  onShare,
  onCopy,
  onAnalytics,
  onDelete,
  onTakeQuiz,
}: QuizCardPresentationProps) {
  const t = useTranslations('quizManagement');

  return (
    <Card
      className="group transition-shadow hover:shadow-md"
      data-testid="quiz-card"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-1">
            <h3 className="leading-none font-semibold tracking-tight">
              {title}
            </h3>
            {description && (
              <p className="text-muted-foreground line-clamp-2 text-sm">
                {description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <QuizStatusBadge status={status} />
            <QuizCardActions
              onPreview={onPreview}
              onEdit={onEdit}
              onShare={onShare}
              onCopy={onCopy}
              onAnalytics={onAnalytics}
              onDelete={onDelete}
              onTakeQuiz={onTakeQuiz}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <QuizCardStats
          questionsCount={questionsCount}
          responsesCount={responsesCount}
        />
      </CardContent>
      <CardFooter className="flex items-center justify-between pt-3">
        <QuizCardTags tags={tags} />
        <div className="text-muted-foreground text-xs">
          {t('cardPresentation.updated')}: {formatQuizDate(updatedAt)}
        </div>
      </CardFooter>
    </Card>
  );
}
