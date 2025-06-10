'use client';

import { useState } from 'react';
import { useQuizPreviewStore } from '@/stores/useQuizPreviewStore';
import { QuizPreviewHeader } from './QuizPreviewHeader';
import { QuizStartScreen } from './QuizStartScreen';
import { ParticipantForm } from './ParticipantForm';
import { QuestionDisplay } from './QuestionDisplay';
import { QuestionNavigation } from './QuestionNavigation';
import { ResultsSummary } from './ResultsSummary';
import { PreviewControls } from './PreviewControls';
import type { Quiz } from '@/types/quiz';
import type { Question, QuestionOption, QuestionMedia } from '@prisma/client';

interface QuizPreviewClientProps {
  quiz: Quiz & {
    questions: (Question & {
      options: QuestionOption[];
      media: QuestionMedia[];
    })[];
  };
  lng: string;
}

export function QuizPreviewClient({ quiz, lng }: QuizPreviewClientProps) {
  const {
    isStarted,
    isCompleted,
    currentQuestionIndex,
    deviceMode,
    participantInfo,
  } = useQuizPreviewStore();

  const [showParticipantForm, setShowParticipantForm] = useState(false);

  const handleStartQuiz = () => {
    // For now, we'll skip participant form and go directly to quiz
    // You can add logic to check if participant info is required based on quiz settings
    useQuizPreviewStore.getState().startQuiz();
  };

  const handleParticipantSubmit = () => {
    setShowParticipantForm(false);
    useQuizPreviewStore.getState().startQuiz();
  };

  const currentQuestion = quiz.questions[currentQuestionIndex];

  return (
    <div className="relative">
      <QuizPreviewHeader quizId={quiz.id} lng={lng} />

      <div
        className={`${deviceMode === 'mobile' ? 'mx-auto max-w-sm px-4' : 'container mx-auto px-4'} py-8`}
      >
        {!isStarted && !showParticipantForm && (
          <QuizStartScreen quiz={quiz} onStart={handleStartQuiz} />
        )}

        {!isStarted && showParticipantForm && (
          <ParticipantForm onSubmit={handleParticipantSubmit} />
        )}

        {isStarted && !isCompleted && currentQuestion && (
          <div className="space-y-6">
            <QuestionDisplay
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={quiz.questions.length}
              timeLimit={quiz.timeLimit || undefined}
            />
            <QuestionNavigation
              currentIndex={currentQuestionIndex}
              totalQuestions={quiz.questions.length}
              onComplete={() => useQuizPreviewStore.getState().completeQuiz()}
              questions={quiz.questions}
            />
          </div>
        )}

        {isCompleted && (
          <ResultsSummary
            quiz={quiz}
            answers={useQuizPreviewStore.getState().mockAnswers}
          />
        )}
      </div>

      <PreviewControls />
    </div>
  );
}
