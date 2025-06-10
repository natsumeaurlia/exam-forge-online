'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { useQuestionAnswer } from './hooks/useQuestionAnswer';
import { QuestionContentRenderer } from './QuestionContentRenderer';
import { QuestionMediaDisplay } from './QuestionMedia';
import { QuestionHint } from './QuestionHint';
import type { Question, QuestionOption, QuestionMedia } from '@prisma/client';

interface QuestionDisplayProps {
  question: Question & {
    options: QuestionOption[];
    media: QuestionMedia[];
  };
  questionNumber: number;
  totalQuestions: number;
  timeLimit?: number;
}

export function QuestionDisplay({
  question,
  questionNumber,
  totalQuestions,
  timeLimit,
}: QuestionDisplayProps) {
  const t = useTranslations('quiz.preview');
  const { currentAnswer, showHint, setShowHint, handleAnswerChange } =
    useQuestionAnswer(question.id);

  const progress = (questionNumber / totalQuestions) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {t('question')} {questionNumber} / {totalQuestions}
            </Badge>
            {(question.isRequired ?? false) && (
              <Badge variant="destructive" className="text-xs">
                {t('required', 'Required')}
              </Badge>
            )}
          </div>
          {timeLimit && (
            <div className="text-muted-foreground flex items-center">
              <Clock className="mr-1 h-4 w-4" />
              <span className="text-sm">{t('timeRemaining')}: --:--</span>
            </div>
          )}
        </div>
        <Progress value={progress} className="mb-4" />
        <CardTitle className="text-lg">{question.text}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <QuestionMediaDisplay media={question.media} />

        <QuestionContentRenderer
          question={question}
          currentAnswer={currentAnswer}
          onAnswerChange={handleAnswerChange}
        />

        <QuestionHint
          hint={question.hint}
          showHint={showHint}
          onToggleHint={() => setShowHint(true)}
        />
      </CardContent>
    </Card>
  );
}
