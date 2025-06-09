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
  const { isPro, isEnterprise } = useUserPlan();

  // Zustandストアを初期化
  React.useEffect(() => {
    initializeQuiz(quiz);
  }, [quiz, initializeQuiz]);

  const hasPaidPlan = isPro || isEnterprise;

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

        {showProFeatures && hasPaidPlan && (
          <div className="w-96 border-l bg-gradient-to-b from-blue-50 to-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <Crown className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Pro機能</h3>
            </div>
            <QuizEditorProFeatures lng={lng} showSidebar />
          </div>
        )}
      </div>

      <div className="fixed right-6 bottom-6 flex flex-col gap-3">
        {hasPaidPlan && (
          <button
            onClick={() => setShowProFeatures(!showProFeatures)}
            className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 p-3 text-white shadow-lg transition-all hover:from-blue-700 hover:to-purple-700"
          >
            <Crown className="h-5 w-5" />
          </button>
        )}
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
