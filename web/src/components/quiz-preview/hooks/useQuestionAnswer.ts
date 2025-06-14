import { useState, useEffect } from 'react';
import { useQuizPreviewStore } from '@/stores/useQuizPreviewStore';
import { QuizAnswer } from '@/types/quiz-answers';

export function useQuestionAnswer(questionId: string) {
  const { mockAnswers, submitAnswer } = useQuizPreviewStore();
  const [showHint, setShowHint] = useState(false);

  const currentAnswer = mockAnswers[questionId];

  useEffect(() => {
    setShowHint(false);
  }, [questionId]);

  const handleAnswerChange = (value: QuizAnswer) => {
    submitAnswer(questionId, value);
  };

  return {
    currentAnswer,
    showHint,
    setShowHint,
    handleAnswerChange,
  };
}
