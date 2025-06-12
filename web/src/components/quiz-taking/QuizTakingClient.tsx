'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Quiz, Question, QuestionOption } from '@prisma/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { QuizStartScreen } from './QuizStartScreen';
import { QuestionDisplay } from './QuestionDisplay';
import { QuizResults } from './QuizResults';
import { submitQuizResponse } from '@/lib/actions/quiz-response';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface QuizTakingClientProps {
  quiz: Quiz & {
    questions: (Question & {
      options: QuestionOption[];
    })[];
    team: {
      name: string;
    } | null;
  };
  isPublic?: boolean;
  requiresPassword?: boolean;
}

export function QuizTakingClient({
  quiz,
  isPublic = false,
  requiresPassword = false,
}: QuizTakingClientProps) {
  const t = useTranslations('QuizTaking');
  const router = useRouter();
  const [isStarted, setIsStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [passwordVerified, setPasswordVerified] = useState(!requiresPassword);
  const [participantInfo, setParticipantInfo] = useState<{
    name?: string;
    email?: string;
  }>({});

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  const handleStart = (info?: { name?: string; email?: string }) => {
    if (info) {
      setParticipantInfo(info);
    }
    setIsStarted(true);
    setStartTime(new Date());
  };

  const handlePasswordVerified = () => {
    setPasswordVerified(true);
  };

  const handleAnswer = (answer: any) => {
    setAnswers({
      ...answers,
      [currentQuestion.id]: answer,
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!startTime) return;

    setIsSubmitting(true);
    try {
      const endTime = new Date();
      const duration = Math.floor(
        (endTime.getTime() - startTime.getTime()) / 1000
      );

      const response = await submitQuizResponse({
        quizId: quiz.id,
        answers: Object.entries(answers).map(([questionId, answer]) => ({
          questionId,
          answer,
        })),
        duration,
        isAnonymous: isPublic,
        participantName: participantInfo.name,
        participantEmail: participantInfo.email,
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to submit quiz');
      }

      setResults(response.data);
      setShowResults(true);
    } catch (error) {
      console.error('Failed to submit quiz:', error);
      toast.error(t('submitError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showResults && results) {
    return <QuizResults quiz={quiz} results={results} isPublic={isPublic} />;
  }

  if (!isStarted || !passwordVerified) {
    return (
      <QuizStartScreen
        quiz={quiz}
        onStart={handleStart}
        requiresPassword={requiresPassword}
        onPasswordVerified={handlePasswordVerified}
        isPublic={isPublic}
      />
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-4 py-8">
      <Card className="p-6">
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold">{quiz.title}</h1>
            <span className="text-muted-foreground text-sm">
              {t('questionCounter', {
                current: currentQuestionIndex + 1,
                total: quiz.questions.length,
              })}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <QuestionDisplay
          question={currentQuestion}
          answer={answers[currentQuestion.id]}
          onAnswer={handleAnswer}
        />

        <div className="mt-6 flex justify-between">
          <Button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            variant="outline"
          >
            {t('previous')}
          </Button>

          {currentQuestionIndex === quiz.questions.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !answers[currentQuestion.id]}
            >
              {isSubmitting ? t('submitting') : t('submit')}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!answers[currentQuestion.id]}
            >
              {t('next')}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
