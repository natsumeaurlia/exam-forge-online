'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, X } from 'lucide-react';
import { useQuizEditorStore } from '@/stores/useQuizEditorStore';
import { useTranslations } from 'next-intl';
import { ImageUpload } from './ImageUpload';
import { useUserPlan } from '@/components/providers/UserPlanProvider';

export function QuizMetadataForm() {
  const { quiz, updateQuizMetadata } = useQuizEditorStore();
  const [tagInput, setTagInput] = useState('');
  const t = useTranslations('quizManagement.editor');
  const { isPro, isEnterprise } = useUserPlan();

  if (!quiz) return null;

  const hasPaidPlan = isPro || isEnterprise;

  const handleDescriptionChange = (description: string) => {
    updateQuizMetadata({ description });
  };

  const handlePassingScoreChange = (value: string) => {
    const passingScore = parseInt(value, 10);
    if (!isNaN(passingScore) && passingScore >= 0 && passingScore <= 100) {
      updateQuizMetadata({ passingScore });
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim()) {
      // タグ追加のロジックを実装
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagId: string) => {
    // タグ削除のロジックを実装
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('basicInfo')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="description">{t('description')}</Label>
          <Textarea
            id="description"
            value={quiz.description || ''}
            onChange={e => handleDescriptionChange(e.target.value)}
            placeholder={t('descriptionPlaceholder')}
            rows={3}
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="passingScore">{t('passingScore')}</Label>
            <Input
              id="passingScore"
              type="number"
              value={quiz.passingScore}
              onChange={e => handlePassingScoreChange(e.target.value)}
              min="0"
              max="100"
              className="mt-1"
            />
          </div>

          <div>
            <Label>{t('scoringMode')}</Label>
            <div className="mt-1">
              <select
                value={quiz.scoringType}
                onChange={e =>
                  updateQuizMetadata({
                    scoringType: e.target.value as 'AUTO' | 'MANUAL',
                  })
                }
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="AUTO">{t('autoScoring')}</option>
                <option value="MANUAL">{t('manualScoring')}</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="timeLimit">{t('timeLimit')}</Label>
          <div className="mt-1 flex items-center gap-2">
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
              className="w-32"
              min="1"
            />
            <span className="text-sm text-gray-600">{t('minutes')}</span>
          </div>
        </div>

        <div>
          <Label>{t('passwordProtection')}</Label>
          <div className="mt-2 space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="passwordProtection"
                checked={quiz.isPasswordProtected}
                onChange={e => {
                  const isPasswordProtected = e.target.checked;
                  updateQuizMetadata({ 
                    isPasswordProtected,
                    sharingMode: isPasswordProtected ? 'PASSWORD' : 'URL',
                    password: isPasswordProtected ? quiz.password : null
                  });
                }}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="passwordProtection" className="text-sm font-medium">
                {t('enablePasswordProtection')}
              </label>
            </div>
            {quiz.isPasswordProtected && (
              <Input
                type="text"
                placeholder={t('passwordPlaceholder')}
                value={quiz.password || ''}
                onChange={e => updateQuizMetadata({ password: e.target.value })}
                className="mt-2"
              />
            )}
          </div>
        </div>

        <div>
          <Label>{t('tags')}</Label>
          <div className="mt-2 space-y-2">
            <div className="flex flex-wrap gap-2">
              {quiz.tags.map(quizTag => (
                <Badge
                  key={quizTag.tag.id}
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  {quizTag.tag.name}
                  <button
                    onClick={() => handleRemoveTag(quizTag.tag.id)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder={t('addTag')}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
              >
                {t('addTagButton')}
              </Button>
            </div>
          </div>
        </div>

        <div>
          <Label>
            {t('coverImage')}
            {!hasPaidPlan && (
              <span className="ml-2 text-xs text-orange-500">
                {t('proPlanFeature')}
              </span>
            )}
          </Label>
          {hasPaidPlan ? (
            <div className="mt-2">
              <ImageUpload
                value={quiz.coverImage || undefined}
                onChange={(url) => updateQuizMetadata({ coverImage: url || null })}
                helperText={t('coverImageHelperText')}
              />
            </div>
          ) : (
            <div className="mt-2">
              <Button variant="outline" className="w-full" disabled>
                <Upload className="mr-2 h-4 w-4" />
                {t('uploadCoverImage')}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
