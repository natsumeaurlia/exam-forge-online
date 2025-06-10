'use client';

import { useTranslations } from 'next-intl';
import { useQuizPreviewStore } from '@/stores/useQuizPreviewStore';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Send, AlertCircle } from 'lucide-react';
import { Question, QuestionOption, QuestionMedia } from '@prisma/client';
import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface QuestionNavigationProps {
  currentIndex: number;
  totalQuestions: number;
  onComplete: () => void;
  questions: (Question & {
    options: QuestionOption[];
    media: QuestionMedia[];
  })[];
}

export function QuestionNavigation({
  currentIndex,
  totalQuestions,
  onComplete,
  questions,
}: QuestionNavigationProps) {
  const t = useTranslations('quiz.preview');
  const {
    goToPreviousQuestion,
    goToNextQuestion,
    navigateToQuestion,
    mockAnswers,
  } = useQuizPreviewStore();
  const [showRequiredAlert, setShowRequiredAlert] = useState(false);

  const isFirstQuestion = currentIndex === 0;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  const currentQuestion = questions[currentIndex];
  const hasAnswer =
    mockAnswers[currentQuestion.id] !== undefined &&
    mockAnswers[currentQuestion.id] !== null &&
    mockAnswers[currentQuestion.id] !== '';

  const handleNext = () => {
    if (currentQuestion.isRequired && !hasAnswer) {
      setShowRequiredAlert(true);
      setTimeout(() => setShowRequiredAlert(false), 3000);
      return;
    }
    goToNextQuestion(totalQuestions);
  };

  const handleComplete = () => {
    // Check all required questions
    const unansweredRequired = questions.filter(
      (q, index) =>
        q.isRequired && (!mockAnswers[q.id] || mockAnswers[q.id] === '')
    );

    if (unansweredRequired.length > 0) {
      setShowRequiredAlert(true);
      setTimeout(() => setShowRequiredAlert(false), 5000);
      return;
    }

    onComplete();
  };

  return (
    <div className="space-y-4">
      {showRequiredAlert && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t('requiredQuestion')}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <Button
          variant="outline"
          onClick={goToPreviousQuestion}
          disabled={isFirstQuestion}
          className="w-full sm:w-auto"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          {t('previous')}
        </Button>

        <div className="flex flex-wrap justify-center gap-1">
          {Array.from({ length: totalQuestions }, (_, i) => {
            const question = questions[i];
            const hasAnswered =
              mockAnswers[question.id] !== undefined &&
              mockAnswers[question.id] !== null &&
              mockAnswers[question.id] !== '';
            const isRequired = question.isRequired ?? false;

            return (
              <Button
                key={i}
                variant={i === currentIndex ? 'default' : 'outline'}
                size="sm"
                onClick={() => navigateToQuestion(i)}
                className={`relative h-8 w-8 p-0 ${
                  isRequired && !hasAnswered
                    ? 'ring-2 ring-red-500 ring-offset-1'
                    : ''
                }`}
              >
                {i + 1}
                {isRequired && !hasAnswered && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
                )}
              </Button>
            );
          })}
        </div>

        {!isLastQuestion ? (
          <Button onClick={handleNext} className="w-full sm:w-auto">
            {t('next')}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleComplete}
            variant="default"
            className="w-full bg-green-600 hover:bg-green-700 sm:w-auto"
          >
            <Send className="mr-2 h-4 w-4" />
            {t('submit')}
          </Button>
        )}
      </div>
    </div>
  );
}
