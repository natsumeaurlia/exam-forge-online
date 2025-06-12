'use client';

import { Quiz } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

interface QuizResultsProps {
  quiz: Quiz;
  results: {
    id: string;
    score: number;
    totalPoints: number;
    percentage: number;
    duration: number;
    correctAnswers: number;
    totalQuestions: number;
    passingScore?: number;
    passed?: boolean;
    answers?: Array<{
      questionId: string;
      isCorrect: boolean;
      points: number;
    }>;
  };
  isPublic?: boolean;
}

export function QuizResults({
  quiz,
  results,
  isPublic = false,
}: QuizResultsProps) {
  const t = useTranslations('QuizTaking');
  const router = useRouter();

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto max-w-2xl p-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-3xl">
            {results.passed ? t('congratulations') : t('quizCompleted')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="bg-primary/10 mb-4 inline-flex h-24 w-24 items-center justify-center rounded-full">
              {results.passed ? (
                <Trophy className="text-primary h-12 w-12" />
              ) : (
                <CheckCircle className="text-primary h-12 w-12" />
              )}
            </div>
            <h2 className="mb-2 text-5xl font-bold">{results.percentage}%</h2>
            <p className="text-muted-foreground text-xl">
              {t('scoreDisplay', {
                score: results.score,
                total: results.totalPoints,
              })}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">
                      {t('correctAnswers')}
                    </p>
                    <p className="text-2xl font-bold">
                      {results.correctAnswers}/{results.totalQuestions}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">
                      {t('timeTaken')}
                    </p>
                    <p className="text-2xl font-bold">
                      {formatDuration(results.duration)}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            {results.passingScore && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">
                        {t('status')}
                      </p>
                      <p className="text-2xl font-bold">
                        {results.passed ? t('passed') : t('failed')}
                      </p>
                    </div>
                    {results.passed ? (
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    ) : (
                      <XCircle className="h-8 w-8 text-red-500" />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {quiz.showCorrectAnswers && results.answers && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('answerReview')}</h3>
              <div className="space-y-2">
                {results.answers.map((answer, index) => (
                  <div
                    key={answer.questionId}
                    className="bg-muted/50 flex items-center justify-between rounded-md p-3"
                  >
                    <span className="font-medium">
                      {t('question')} {index + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-sm">
                        {answer.points} {t('points')}
                      </span>
                      {answer.isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center gap-4 pt-4">
            {quiz.allowRetake && (
              <Button onClick={() => router.refresh()} variant="outline">
                {t('retakeQuiz')}
              </Button>
            )}
            <Button
              onClick={() => {
                if (isPublic) {
                  router.push('/');
                } else {
                  router.push('/dashboard');
                }
              }}
            >
              {isPublic ? t('backToHome') : t('backToDashboard')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
