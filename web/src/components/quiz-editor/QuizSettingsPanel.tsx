'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuizEditorStore } from '@/stores/useQuizEditorStore';
import { useTranslations } from 'next-intl';

export function QuizSettingsPanel() {
  const { quiz, updateQuizMetadata } = useQuizEditorStore();
  const t = useTranslations('quizManagement.editor');

  if (!quiz) return null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('settings')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">{t('settingsMovedToProTab')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
