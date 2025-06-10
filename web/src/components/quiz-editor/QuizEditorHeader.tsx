'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { updateQuiz } from '@/lib/actions/quiz';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, Save, Settings2, Loader2, Check } from 'lucide-react';
import { useQuizEditorStore } from '@/stores/useQuizEditorStore';
import { PublishSettingsModal } from './PublishSettingsModal';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface QuizEditorHeaderProps {
  quizId: string;
  lng: string;
  autoSaveTime?: Date | null;
  isAutoSaving?: boolean;
  autoSaveError?: string | null;
}

export function QuizEditorHeader({
  quizId,
  lng,
  autoSaveTime,
  isAutoSaving,
  autoSaveError,
}: QuizEditorHeaderProps) {
  const router = useRouter();
  const { quiz, isDirty, setSaving } = useQuizEditorStore();
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(quiz?.title || '');
  const t = useTranslations('quizManagement.editor.header');

  useEffect(() => {
    setTitle(quiz?.title || '');
  }, [quiz?.title]);

  const { execute: executeSave, isExecuting: isSaving } = useAction(
    updateQuiz,
    {
      onSuccess: () => {
        setLastSaved(new Date());
        setSaving(false);
        toast.success(t('saveSuccess'));
      },
      onError: ({ error }) => {
        setSaving(false);
        toast.error(error.serverError || t('saveError'));
      },
    }
  );

  const handleSave = () => {
    if (!quiz || !isDirty) return;

    setSaving(true);
    executeSave({
      id: quizId,
      title: quiz.title,
      description: quiz.description || undefined,
      passingScore: quiz.passingScore,
      coverImage: quiz.coverImage || undefined,
      subdomain: quiz.subdomain || undefined,
      timeLimit: quiz.timeLimit || undefined,
      shuffleQuestions: quiz.shuffleQuestions,
      shuffleOptions: quiz.shuffleOptions,
      maxAttempts: quiz.maxAttempts || undefined,
    });
  };

  const handleTitleSave = () => {
    if (title !== quiz?.title) {
      useQuizEditorStore.getState().updateQuizMetadata({ title });
    }
    setIsEditingTitle(false);
  };

  const handlePreview = () => {
    router.push(`/${lng}/dashboard/quizzes/${quizId}/preview`);
  };

  return (
    <>
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {isEditingTitle ? (
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleTitleSave();
                  }
                }}
                className="text-xl font-semibold"
                autoFocus
              />
            ) : (
              <h1
                onClick={() => setIsEditingTitle(true)}
                className="cursor-pointer text-xl font-semibold hover:text-gray-700"
              >
                {quiz?.title}
              </h1>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-500">
              {/* 手動保存状態 */}
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t('saving')}</span>
                </>
              ) : lastSaved ? (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  <span>
                    {lastSaved.toLocaleTimeString('ja-JP', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {t('savedAt')}
                  </span>
                </>
              ) : null}

              {/* 自動保存状態 */}
              {isAutoSaving && (
                <>
                  <span className="mx-2 text-gray-300">|</span>
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  <span className="text-blue-500">自動保存中...</span>
                </>
              )}

              {!isAutoSaving && autoSaveTime && !isSaving && (
                <>
                  <span className="mx-2 text-gray-300">|</span>
                  <Check className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-400">
                    自動保存済み{' '}
                    {autoSaveTime.toLocaleTimeString('ja-JP', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </>
              )}

              {autoSaveError && (
                <>
                  <span className="mx-2 text-gray-300">|</span>
                  <span className="text-red-500">自動保存エラー</span>
                </>
              )}

              {isDirty && !isAutoSaving && !isSaving && (
                <span className="text-orange-500">{t('unsavedChanges')}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handlePreview}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              {t('preview')}
            </Button>

            <Button
              variant="outline"
              onClick={() => setIsPublishModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Settings2 className="h-4 w-4" />
              {t('publishSettings')}
            </Button>

            <Button
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {t('save')}
            </Button>
          </div>
        </div>
      </div>

      <PublishSettingsModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        quizId={quizId}
      />
    </>
  );
}
