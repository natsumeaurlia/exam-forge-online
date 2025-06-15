'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Clock, Award } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { getQuizResponse } from '@/lib/actions/quiz-response';
import { QuizAnswer } from '@/types/quiz-answers';
import type { Quiz } from '@prisma/client';

interface QuizResultsProps {
  quiz: Quiz;
  responseId: string;
  answers: Record<string, { questionId: string; answer: QuizAnswer }>;
  timeSpent: number;
  lng: string;
}

interface QuizResponseData {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  passed: boolean;
  certificateUrl?: string;
}

export function QuizResults({
  quiz,
  responseId,
  answers,
  timeSpent,
  lng,
}: QuizResultsProps) {
  const t = useTranslations('quiz.results');
  const [responseData, setResponseData] = useState<QuizResponseData | null>(
    null
  );

  const { execute: executeGetQuizResponse, isExecuting } = useAction(
    getQuizResponse,
    {
      onSuccess: ({ data }) => {
        if (data && 'data' in data && data.data) {
          setResponseData(data.data);
        }
      },
      onError: ({ error }) => {
        console.error('Failed to fetch results:', error);
      },
    }
  );

  useEffect(() => {
    executeGetQuizResponse({ responseId });
  }, [responseId, executeGetQuizResponse]);

  if (isExecuting) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Card className="p-8 text-center">
          <p>{t('loadingResults')}</p>
        </Card>
      </div>
    );
  }

  if (!responseData) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Card className="p-8 text-center">
          <p>{t('errorLoadingResults')}</p>
        </Card>
      </div>
    );
  }

  const scorePercentage =
    (responseData.score / responseData.totalQuestions) * 100;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Card className="p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold">{t('quizCompleted')}</h1>
          <p className="text-gray-600">{quiz.title}</p>
        </div>

        {/* Score Display */}
        <div className="mb-8">
          <div className="mb-4 text-center">
            <div className="mb-4 inline-flex h-32 w-32 items-center justify-center rounded-full bg-gray-100">
              {responseData.passed ? (
                <CheckCircle className="h-16 w-16 text-green-500" />
              ) : (
                <XCircle className="h-16 w-16 text-red-500" />
              )}
            </div>
            <h2 className="mb-2 text-4xl font-bold">
              {scorePercentage.toFixed(0)}%
            </h2>
            <p className="text-lg text-gray-600">
              {t('scoreText', {
                correct: responseData.correctAnswers,
                total: responseData.totalQuestions,
              })}
            </p>
          </div>
          <Progress value={scorePercentage} className="h-3" />
        </div>

        {/* Pass/Fail Status */}
        {quiz.passingScore && (
          <div
            className={`mb-6 rounded-lg p-4 ${
              responseData.passed
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            <p className="font-semibold">
              {responseData.passed ? t('passed') : t('failed')}
            </p>
            <p className="text-sm">
              {t('passingScore', { score: quiz.passingScore })}
            </p>
          </div>
        )}

        {/* Additional Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-4">
            <Clock className="h-8 w-8 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">{t('timeSpent')}</p>
              <p className="font-semibold">
                {Math.floor(timeSpent / 60)}:
                {(timeSpent % 60).toString().padStart(2, '0')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-4">
            <Award className="h-8 w-8 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">{t('accuracy')}</p>
              <p className="font-semibold">{scorePercentage.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* Certificate */}
        {responseData.passed && responseData.certificateUrl && (
          <div className="mb-8 rounded-lg bg-blue-50 p-4">
            <p className="mb-2 font-semibold">{t('certificateEarned')}</p>
            <Button asChild>
              <a href={responseData.certificateUrl} download>
                {t('downloadCertificate')}
              </a>
            </Button>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-center gap-4">
          {quiz.showAnswersAfterSubmit && (
            <Button variant="outline" asChild>
              <a href={`/${lng}/quiz/${quiz.id}/review/${responseId}`}>
                {t('reviewAnswers')}
              </a>
            </Button>
          )}
          {quiz.allowMultipleAttempts && (
            <Button onClick={() => window.location.reload()}>
              {t('retakeQuiz')}
            </Button>
          )}
          <Button variant="outline" asChild>
            <a href={`/${lng}`}>{t('backToHome')}</a>
          </Button>
        </div>
      </Card>
    </div>
  );
}
