import { useState, useEffect, useCallback } from 'react';

interface UseQuizTakingProps {
  totalQuestions: number;
  timeLimit?: number | null;
  onTimeUp?: () => void;
}

export function useQuizTaking({
  totalQuestions,
  timeLimit,
  onTimeUp,
}: UseQuizTakingProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);

  // Timer effect
  useEffect(() => {
    if (!startTime || !timeLimit) return;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime.getTime();
      const remaining = Math.max(0, timeLimit * 60 * 1000 - elapsed);

      setRemainingTime(remaining);

      if (remaining === 0 && onTimeUp) {
        onTimeUp();
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime, timeLimit, onTimeUp]);

  const start = useCallback(() => {
    setStartTime(new Date());
    if (timeLimit) {
      setRemainingTime(timeLimit * 60 * 1000);
    }
  }, [timeLimit]);

  const setAnswer = useCallback((questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }));
  }, []);

  const goToQuestion = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalQuestions) {
        setCurrentQuestionIndex(index);
      }
    },
    [totalQuestions]
  );

  const goNext = useCallback(() => {
    goToQuestion(currentQuestionIndex + 1);
  }, [currentQuestionIndex, goToQuestion]);

  const goPrevious = useCallback(() => {
    goToQuestion(currentQuestionIndex - 1);
  }, [currentQuestionIndex, goToQuestion]);

  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const progress =
    totalQuestions > 0
      ? ((currentQuestionIndex + 1) / totalQuestions) * 100
      : 0;

  const getTimeSpent = useCallback(() => {
    if (!startTime) return 0;
    return Math.floor((Date.now() - startTime.getTime()) / 1000);
  }, [startTime]);

  const getRemainingMinutes = useCallback(() => {
    if (!remainingTime) return null;
    return Math.floor(remainingTime / 60000);
  }, [remainingTime]);

  return {
    currentQuestionIndex,
    answers,
    startTime,
    remainingTime,
    isFirstQuestion,
    isLastQuestion,
    progress,
    start,
    setAnswer,
    goToQuestion,
    goNext,
    goPrevious,
    getTimeSpent,
    getRemainingMinutes,
  };
}
