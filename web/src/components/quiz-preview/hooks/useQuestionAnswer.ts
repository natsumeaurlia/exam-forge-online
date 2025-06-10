import { useState, useEffect } from 'react';
import { useQuizPreviewStore } from '@/stores/useQuizPreviewStore';
import type {
  TrueFalseAnswer,
  MultipleChoiceAnswer,
  CheckboxAnswer,
  ShortAnswer,
} from '@/types/quiz-schemas';

export function useQuestionAnswer(questionId: string) {
  const { mockAnswers, submitAnswer } = useQuizPreviewStore();
  const [showHint, setShowHint] = useState(false);

  const currentAnswer = mockAnswers[questionId];

  useEffect(() => {
    setShowHint(false);
  }, [questionId]);

  const handleAnswerChange = (
    value: TrueFalseAnswer | MultipleChoiceAnswer | CheckboxAnswer | ShortAnswer
  ) => {
    submitAnswer(questionId, value);
  };

  return {
    currentAnswer,
    showHint,
    setShowHint,
    handleAnswerChange,
  };
}
