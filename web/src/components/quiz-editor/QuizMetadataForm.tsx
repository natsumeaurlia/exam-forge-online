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

export function QuizMetadataForm() {
  const { quiz, updateQuizMetadata } = useQuizEditorStore();
  const [tagInput, setTagInput] = useState('');
  const t = useTranslations('quizManagement.editor');

  if (!quiz) return null;

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
          <Label>{t('sharingSettings')}</Label>
          <div className="mt-2 space-y-2">
            <select
              value={quiz.sharingMode}
              onChange={e =>
                updateQuizMetadata({
                  sharingMode: e.target.value as 'URL' | 'PASSWORD',
                })
              }
              className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="URL">{t('urlSharing')}</option>
              <option value="PASSWORD">{t('passwordProtected')}</option>
            </select>
            {quiz.sharingMode === 'PASSWORD' && (
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
          <Label>{t('coverImage')}</Label>
          <div className="mt-2">
            {quiz.coverImage ? (
              <div className="relative">
                <Image
                  src={quiz.coverImage}
                  alt={t('coverImageAlt')}
                  width={800}
                  height={128}
                  className="h-32 w-full rounded-lg object-cover"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={() => updateQuizMetadata({ coverImage: null })}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button variant="outline" className="w-full" disabled>
                <Upload className="mr-2 h-4 w-4" />
                {t('uploadCoverImage')}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
