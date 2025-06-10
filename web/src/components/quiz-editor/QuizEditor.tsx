'use client';

import React, { useState } from 'react';
import { QuizEditorHeader } from './QuizEditorHeader';
import { QuizMetadataForm } from './QuizMetadataForm';
import { QuestionTypeToolbar } from './QuestionTypeToolbar';
import { QuestionList } from './QuestionList';
import { QuizSettingsPanel } from './QuizSettingsPanel';
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
import { Settings, Crown } from 'lucide-react';

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
  const [showSettings, setShowSettings] = useState(false);
  const [showProFeatures, setShowProFeatures] = useState(false);
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

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-4xl space-y-6">
            <QuizMetadataForm />
            {hasPaidPlan && <QuizEditorProFeatures lng={lng} />}
            <QuestionTypeToolbar />
            <QuestionList />
          </div>
        </div>

        {showSettings && (
          <div className="w-80 border-l bg-gray-50 p-6">
            <QuizSettingsPanel />
          </div>
        )}
      </div>

      <div className="fixed right-6 bottom-6">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="rounded-full bg-blue-600 p-3 text-white shadow-lg hover:bg-blue-700"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
