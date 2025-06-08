'use client';

import { useState } from 'react';
import { QuizEditorHeader } from './QuizEditorHeader';
import { QuizMetadataForm } from './QuizMetadataForm';
import { QuestionTypeToolbar } from './QuestionTypeToolbar';
import { QuestionList } from './QuestionList';
import { QuizSettingsPanel } from './QuizSettingsPanel';
import { useQuizEditorStore } from '@/stores/useQuizEditorStore';
import type { Quiz, Question, Section, QuizTag } from '@prisma/client';

interface QuizWithRelations extends Quiz {
  questions: (Question & {
    options: {
      id: string;
      text: string;
      order: number;
      isCorrect: boolean;
    }[];
  })[];
  sections: Section[];
  tags: (QuizTag & {
    tag: {
      id: string;
      name: string;
      color: string | null;
    };
  })[];
}

interface QuizEditorProps {
  quiz: QuizWithRelations;
  lng: string;
}

export function QuizEditor({ quiz, lng }: QuizEditorProps) {
  const [showSettings, setShowSettings] = useState(false);
  const { initializeQuiz } = useQuizEditorStore();

  // Zustandストアを初期化
  useState(() => {
    initializeQuiz(quiz);
  });

  return (
    <div className="flex h-full flex-col">
      <QuizEditorHeader quizId={quiz.id} lng={lng} />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-4xl space-y-6">
            <QuizMetadataForm />
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

      <button
        onClick={() => setShowSettings(!showSettings)}
        className="fixed right-6 bottom-6 rounded-full bg-blue-600 p-3 text-white shadow-lg hover:bg-blue-700"
      >
        設定
      </button>
    </div>
  );
}
