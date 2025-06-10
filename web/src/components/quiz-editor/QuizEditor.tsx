'use client';

import React, { useState, useCallback } from 'react';
import { QuizEditorHeader } from './QuizEditorHeader';
import { QuizMetadataForm } from './QuizMetadataForm';
import { QuestionTypeToolbar } from './QuestionTypeToolbar';
import { QuestionList } from './QuestionList';
import { QuizSettingsPanel } from './QuizSettingsPanel';
import { QuizEditorProFeatures } from './QuizEditorProFeatures';
import { useQuizEditorStore } from '@/stores/useQuizEditorStore';
import { useUserPlan } from '@/components/providers/UserPlanProvider';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useAction } from 'next-safe-action/hooks';
import { saveQuizWithQuestions } from '@/lib/actions/quiz';
import { toast } from 'sonner';
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
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<Date | null>(null);
  const [autoSaveError, setAutoSaveError] = useState<string | null>(null);

  const {
    initializeQuiz,
    quiz: currentQuiz,
    questions,
    isDirty,
  } = useQuizEditorStore();
  const { isPro, isPremium } = useUserPlan();

  // Zustandストアを初期化
  React.useEffect(() => {
    initializeQuiz(quiz);
  }, [quiz, initializeQuiz]);

  // 自動保存アクション
  const { execute: executeSave, isExecuting: isSaving } = useAction(
    saveQuizWithQuestions,
    {
      onSuccess: () => {
        setLastAutoSaveTime(new Date());
        setAutoSaveError(null);
        useQuizEditorStore.setState({ isDirty: false });
      },
      onError: ({ error }) => {
        setAutoSaveError(error.serverError || '自動保存に失敗しました');
        console.error('Auto-save error:', error);
      },
    }
  );

  // 自動保存のコールバック
  const handleAutoSave = useCallback(async () => {
    if (!currentQuiz || !isDirty) return;

    const saveData = {
      id: currentQuiz.id,
      title: currentQuiz.title,
      description: currentQuiz.description || undefined,
      passingScore: currentQuiz.passingScore,
      coverImage: currentQuiz.coverImage || undefined,
      subdomain: currentQuiz.subdomain || undefined,
      timeLimit: currentQuiz.timeLimit || undefined,
      shuffleQuestions: currentQuiz.shuffleQuestions,
      shuffleOptions: currentQuiz.shuffleOptions,
      maxAttempts: currentQuiz.maxAttempts || undefined,
      questions: questions.map(q => ({
        id: q.id,
        type: q.type,
        text: q.text,
        points: q.points,
        hint: q.hint,
        explanation: q.explanation,
        correctAnswer: q.correctAnswer,
        isRequired: q.isRequired,
        order: q.order,
        options: q.options.map(opt => ({
          id: opt.id,
          text: opt.text,
          isCorrect: opt.isCorrect,
          order: opt.order,
        })),
        media:
          q.media?.map(m => ({
            id: m.id,
            url: m.url,
            type: m.type,
          })) || [],
      })),
    };

    executeSave(saveData as any);
  }, [currentQuiz, questions, isDirty, executeSave]);

  // 自動保存フック
  useAutoSave({
    data: { quiz: currentQuiz, questions },
    onSave: handleAutoSave,
    delay: 3000, // 3秒のデバウンス
    enabled: isDirty && !!currentQuiz,
    maxRetries: 3,
    onError: error => {
      toast.error('自動保存に失敗しました。手動で保存してください。');
      console.error('Auto-save error after retries:', error);
    },
  });

  const hasPaidPlan = isPro || isPremium;

  return (
    <div className="flex h-full flex-col">
      <QuizEditorHeader
        quizId={quiz.id}
        lng={lng}
        autoSaveTime={lastAutoSaveTime}
        isAutoSaving={isSaving}
        autoSaveError={autoSaveError}
      />

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

      {/* 自動保存エラー通知 */}
      {autoSaveError && (
        <div className="fixed right-6 bottom-20 max-w-sm rounded-lg bg-red-50 p-4 shadow-lg">
          <div className="flex items-start">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">
                自動保存エラー
              </h3>
              <p className="mt-1 text-sm text-red-700">{autoSaveError}</p>
            </div>
            <button
              onClick={() => setAutoSaveError(null)}
              className="ml-4 text-red-400 hover:text-red-500"
            >
              <span className="sr-only">閉じる</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

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
