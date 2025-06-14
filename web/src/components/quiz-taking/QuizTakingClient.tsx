'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QuizStartScreen } from './QuizStartScreen';
import { QuestionDisplay } from './QuestionDisplay';
import { QuizResults } from './QuizResults';
import { useEnhancedQuizTaking } from '@/hooks/use-enhanced-quiz-taking';
import { ErrorType } from '@/lib/utils/error-handling';
import type {
  Quiz,
  Question,
  QuestionOption,
  QuestionMedia,
} from '@prisma/client';

interface QuizWithRelations extends Quiz {
  questions: (Question & {
    options: QuestionOption[];
    media: QuestionMedia[];
  })[];
  team: {
    name: string;
  };
}

interface QuizTakingClientProps {
  quiz: QuizWithRelations;
  lng: string;
  requiresPassword: boolean;
}

interface Answer {
  questionId: string;
  answer: any;
  isCorrect?: boolean;
}

export function QuizTakingClient({
  quiz,
  lng,
  requiresPassword,
}: QuizTakingClientProps) {
  const t = useTranslations('quiz.taking');
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<
    'start' | 'questions' | 'results'
  >('start');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [responseId, setResponseId] = useState<string | null>(null);

  // Enhanced error handling and state management
  const {
    answers,
    participantInfo,
    error,
    isOnline,
    submitting,
    retryCount,
    autoSaveStatus,
    updateAnswer,
    updateParticipantInfo,
    enhancedSubmit,
    clearError,
    forceRetry,
  } = useEnhancedQuizTaking(quiz.id, responseId => {
    setResponseId(responseId);
    setCurrentStep('results');
  });

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  const handleSubmit = useCallback(async () => {
    if (submitting) return;

    const completedAt = new Date();
    setEndTime(completedAt);

    await enhancedSubmit({
      quizId: quiz.id,
      responses: Object.values(answers).map(a => ({
        questionId: a.questionId,
        answer: a.answer,
      })),
      participantName: participantInfo.name || undefined,
      participantEmail: participantInfo.email || undefined,
      startedAt: startTime!.toISOString(),
      completedAt: completedAt.toISOString(),
    });
  }, [
    submitting,
    enhancedSubmit,
    quiz.id,
    answers,
    participantInfo.name,
    participantInfo.email,
    startTime,
  ]);

  // Timer effect
  useEffect(() => {
    if (currentStep === 'questions' && startTime && quiz.timeLimit) {
      const timer = setInterval(() => {
        const elapsed = Date.now() - startTime.getTime();
        const remaining = quiz.timeLimit! * 60 * 1000 - elapsed;

        if (remaining <= 0) {
          handleSubmit();
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [currentStep, startTime, quiz.timeLimit, handleSubmit]);

  const handleStart = () => {
    if (requiresPassword && password !== quiz.password) {
      setPasswordError(true);
      return;
    }

    if (quiz.collectParticipantInfo) {
      if (!participantInfo.name || !participantInfo.email) {
        // Use enhanced error handling
        return;
      }
    }

    setCurrentStep('questions');
    setStartTime(new Date());
    clearError();
  };

  // Enhanced answer handling with auto-save
  const handleAnswer = useCallback(
    (answer: any) => {
      updateAnswer(currentQuestion.id, answer);
    },
    [currentQuestion.id, updateAnswer]
  );

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const isAnswered = (questionId: string) => {
    return answers[questionId] !== undefined;
  };

  const calculateTimeSpent = () => {
    if (!startTime || !endTime) return 0;
    return Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
  };

  if (currentStep === 'start') {
    return (
      <QuizStartScreen
        quiz={quiz}
        lng={lng}
        requiresPassword={requiresPassword}
        password={password}
        passwordError={passwordError}
        participantInfo={participantInfo}
        error={error}
        onPasswordChange={setPassword}
        onParticipantInfoChange={info => updateParticipantInfo(info)}
        onStart={handleStart}
      />
    );
  }

  if (currentStep === 'results' && responseId) {
    return (
      <QuizResults
        quiz={quiz}
        responseId={responseId}
        answers={answers}
        timeSpent={calculateTimeSpent()}
        lng={lng}
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Card className="p-6">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {t('questionProgress', {
                current: currentQuestionIndex + 1,
                total: quiz.questions.length,
              })}
            </span>
            {quiz.timeLimit && startTime && (
              <span className="text-sm text-gray-600">
                {t('timeRemaining', {
                  minutes: Math.max(
                    0,
                    Math.floor(
                      (quiz.timeLimit * 60 * 1000 -
                        (Date.now() - startTime.getTime())) /
                        60000
                    )
                  ),
                })}
              </span>
            )}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Display */}
        <QuestionDisplay
          question={currentQuestion}
          answer={answers[currentQuestion.id]?.answer}
          onAnswer={handleAnswer}
          lng={lng}
        />

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            {t('previous')}
          </Button>

          <span className="text-sm text-gray-600">
            {currentQuestionIndex + 1} / {quiz.questions.length}
          </span>

          {currentQuestionIndex < quiz.questions.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={
                !isAnswered(currentQuestion.id) && currentQuestion.isRequired
              }
            >
              {t('next')}
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={
                submitting ||
                (!isAnswered(currentQuestion.id) && currentQuestion.isRequired)
              }
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? t('submitting') : t('submit')}
            </Button>
          )}
        </div>

        {/* Enhanced Error Display */}
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription className="flex items-center justify-between">
              <div>
                <div className="font-medium">{error.userMessage}</div>
                {error.type === ErrorType.OFFLINE_ERROR && (
                  <div className="mt-1 text-sm text-orange-600">
                    オフライン状態 - 回答は自動保存されています
                  </div>
                )}
                {retryCount > 0 && (
                  <div className="mt-1 text-sm text-blue-600">
                    リトライ {retryCount}/3
                  </div>
                )}
              </div>
              {error.canRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={forceRetry}
                  disabled={submitting}
                >
                  {error.action === 'reload' ? 'リロード' : 'リトライ'}
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Auto-save Status */}
        {autoSaveStatus && (
          <Alert className="mt-4">
            <AlertDescription>
              {autoSaveStatus === 'saving' && '自動保存中...'}
              {autoSaveStatus === 'saved' && '回答を自動保存しました'}
              {autoSaveStatus === 'error' && '自動保存に失敗しました'}
            </AlertDescription>
          </Alert>
        )}

        {/* Online Status Indicator */}
        {!isOnline && (
          <Alert className="mt-4 border-orange-200 bg-orange-50">
            <AlertDescription className="text-orange-800">
              オフライン状態です。回答は自動保存され、オンライン復帰時に送信されます。
            </AlertDescription>
          </Alert>
        )}
      </Card>
    </div>
  );
}
