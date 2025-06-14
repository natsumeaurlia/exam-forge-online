'use client';

import React from 'react';
import { QuizEditorHeader } from './QuizEditorHeader';
import { QuizMetadataForm } from './QuizMetadataForm';
import { QuestionTypeToolbar } from './QuestionTypeToolbar';
import { QuestionList } from './QuestionList';
import { QuizEditorProFeatures } from './QuizEditorProFeatures';
import { useQuizEditorStore } from '@/stores/useQuizEditorStore';
import { useUserPlan } from '@/components/providers/UserPlanProvider';
import type {
  Quiz,
  Question,
  Section,
  QuizTag,
  QuestionOption,
  Tag,
  QuestionMedia,
  MediaType,
} from '@prisma/client';

interface MediaItem extends QuestionMedia {
  type: MediaType;
}

interface QuizWithRelations extends Quiz {
  questions: (Question & {
    options: QuestionOption[];
    media?: MediaItem[];
  })[];
  sections: Section[];
  tags: (QuizTag & {
    tag: Tag;
  })[];
}

interface QuizEditorProps {
  quiz: QuizWithRelations;
  lng: string;
}

export function QuizEditor({ quiz, lng }: QuizEditorProps) {
  const { initializeQuiz } = useQuizEditorStore();
  const { isPro, isPremium } = useUserPlan();

  // Zustandストアを初期化
  React.useEffect(() => {
    initializeQuiz(quiz);
  }, [quiz, initializeQuiz]);

  const hasPaidPlan = isPro || isPremium;

  return (
    <div className="flex h-full flex-col">
      <QuizEditorHeader quizId={quiz.id} lng={lng} />

      {/* Main Content Layout */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-4xl space-y-6">
            <QuizMetadataForm />
            {hasPaidPlan && <QuizEditorProFeatures lng={lng} />}
            <QuestionTypeToolbar />
            <div className="space-y-4">
              <QuestionList />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
