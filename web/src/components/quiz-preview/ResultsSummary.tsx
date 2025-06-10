'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Trophy, RotateCcw } from 'lucide-react';
import { useQuizPreviewStore } from '@/stores/useQuizPreviewStore';
import type { Quiz } from '@/types/quiz';
import type { Question, QuestionOption } from '@prisma/client';

interface ResultsSummaryProps {
  quiz: Quiz & {
    questions: (Question & {
      options: QuestionOption[];
    })[];
  };
  answers: Record<string, any>;
}

export function ResultsSummary({ quiz, answers }: ResultsSummaryProps) {
  const t = useTranslations('quiz.preview');
  const { resetPreview } = useQuizPreviewStore();

  const results = useMemo(() => {
    let correctCount = 0;
    let totalPoints = 0;
    let earnedPoints = 0;

    const questionResults = quiz.questions.map(question => {
      const userAnswer = answers[question.id];
      let isCorrect = false;

      totalPoints += question.points || 1;

      if (quiz.scoringType === 'AUTO') {
        switch (question.type) {
          case 'TRUE_FALSE':
            isCorrect = userAnswer === question.correctAnswer;
            break;
          case 'MULTIPLE_CHOICE':
            isCorrect = userAnswer === question.correctAnswer;
            break;
          case 'CHECKBOX':
            const correctOptions = question.options
              ?.filter(opt => opt.isCorrect)
              .map(opt => opt.id);
            isCorrect =
              Array.isArray(userAnswer) &&
              userAnswer.length === correctOptions?.length &&
              userAnswer.every((id: string) => correctOptions?.includes(id));
            break;
          default:
            isCorrect = false;
        }
      }

      if (isCorrect) {
        correctCount++;
        earnedPoints += question.points || 1;
      }

      return {
        question,
        userAnswer,
        isCorrect,
      };
    });

    const percentage = Math.round((earnedPoints / totalPoints) * 100);
    const isPassed = percentage >= quiz.passingScore;

    return {
      questionResults,
      correctCount,
      totalQuestions: quiz.questions.length,
      percentage,
      isPassed,
      earnedPoints,
      totalPoints,
    };
  }, [quiz, answers]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {results.isPassed ? (
              <>
                <Trophy className="h-6 w-6 text-green-600" />
                {t('results.passed')}
              </>
            ) : (
              <>
                <XCircle className="h-6 w-6 text-red-600" />
                {t('results.failed')}
              </>
            )}
          </CardTitle>
          <CardDescription>{t('results.previewNote')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="text-center">
              <p className="text-3xl font-bold">{results.percentage}%</p>
              <p className="text-muted-foreground">{t('results.score')}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">
                {results.correctCount}/{results.totalQuestions}
              </p>
              <p className="text-muted-foreground">
                {t('results.correctAnswers')}
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{quiz.passingScore}%</p>
              <p className="text-muted-foreground">
                {t('results.passingScore')}
              </p>
            </div>
          </div>

          <Progress
            value={results.percentage}
            className={`h-4 ${
              results.isPassed ? 'bg-green-100' : 'bg-red-100'
            }`}
          />
        </CardContent>
      </Card>

      {quiz.scoringType === 'AUTO' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('results.breakdown')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.questionResults.map((result, index) => (
                <div
                  key={result.question.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                >
                  <div className="flex items-center gap-3">
                    {result.isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-medium">
                      {t('question')} {index + 1}
                    </span>
                  </div>
                  <Badge variant={result.isCorrect ? 'default' : 'destructive'}>
                    {result.isCorrect ? t('correct') : t('incorrect')}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center">
        <Button onClick={resetPreview} size="lg">
          <RotateCcw className="mr-2 h-4 w-4" />
          {t('results.tryAgain')}
        </Button>
      </div>
    </div>
  );
}
