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
          <div className="space-y-2">
            <Label htmlFor="timeLimit">{t('timeLimit')}</Label>
            <Input
              id="timeLimit"
              type="number"
              value={quiz.timeLimit || ''}
              onChange={e => {
                const value = e.target.value
                  ? parseInt(e.target.value, 10)
                  : null;
                updateQuizMetadata({ timeLimit: value });
              }}
              placeholder={t('timeLimitPlaceholder')}
              disabled
            />
            <p className="text-xs text-orange-500">{t('proPlanFeature')}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="shuffleQuestions">{t('shuffleQuestions')}</Label>
              <Switch
                id="shuffleQuestions"
                checked={quiz.shuffleQuestions}
                onCheckedChange={checked =>
                  updateQuizMetadata({ shuffleQuestions: checked })
                }
                disabled
              />
            </div>
            <p className="text-xs text-orange-500">{t('proPlanFeature')}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="shuffleOptions">{t('shuffleOptions')}</Label>
              <Switch
                id="shuffleOptions"
                checked={quiz.shuffleOptions}
                onCheckedChange={checked =>
                  updateQuizMetadata({ shuffleOptions: checked })
                }
                disabled
              />
            </div>
            <p className="text-xs text-orange-500">{t('proPlanFeature')}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxAttempts">{t('maxAttempts')}</Label>
            <Input
              id="maxAttempts"
              type="number"
              value={quiz.maxAttempts || ''}
              onChange={e => {
                const value = e.target.value
                  ? parseInt(e.target.value, 10)
                  : null;
                updateQuizMetadata({ maxAttempts: value });
              }}
              placeholder={t('maxAttemptsPlaceholder')}
              disabled
            />
            <p className="text-xs text-orange-500">{t('proPlanFeature')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
