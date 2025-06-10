'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, FileText, Target } from 'lucide-react';
import type { Quiz, Tag } from '@/types/quiz';

interface QuizStartScreenProps {
  quiz: Quiz & {
    questions?: { id: string }[];
    tags?: Tag[];
  };
  onStart: () => void;
}

export function QuizStartScreen({ quiz, onStart }: QuizStartScreenProps) {
  const t = useTranslations('quiz.preview');

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl">{quiz.title}</CardTitle>
        <CardDescription className="mt-2 text-base">
          {quiz.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">{t('questions')}</p>
              <p className="font-semibold">{quiz.questions?.length || 0}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2">
              <Target className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">
                {t('passingScore')}
              </p>
              <p className="font-semibold">{quiz.passingScore}%</p>
            </div>
          </div>

          {quiz.timeLimit && (
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-100 p-2">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">
                  {t('timeLimit')}
                </p>
                <p className="font-semibold">
                  {quiz.timeLimit} {t('minutes')}
                </p>
              </div>
            </div>
          )}
        </div>

        {quiz.tags && quiz.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-sm">{t('tags')}:</span>
            {quiz.tags.map(tag => (
              <Badge key={tag.id} variant="secondary">
                {tag.name}
              </Badge>
            ))}
          </div>
        )}

        <div className="pt-4">
          <Button onClick={onStart} className="w-full" size="lg">
            {t('startQuiz')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
