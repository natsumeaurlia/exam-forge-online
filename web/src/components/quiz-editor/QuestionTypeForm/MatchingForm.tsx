'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, X, Trash2, Shuffle } from 'lucide-react';

interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

interface MatchingFormProps {
  question: {
    text: string;
    pairs?: MatchingPair[];
    points: number;
    hint?: string;
    explanation?: string;
  };
  isAutoGrading: boolean;
  onChange: (updates: Partial<MatchingFormProps['question']>) => void;
}

export function MatchingForm({
  question,
  isAutoGrading,
  onChange,
}: MatchingFormProps) {
  const t = useTranslations('quizManagement.editor.questionTypes.matching');

  const pairs = question.pairs || [
    { id: '1', left: '', right: '' },
    { id: '2', left: '', right: '' },
    { id: '3', left: '', right: '' },
  ];

  const addPair = () => {
    const newPair: MatchingPair = {
      id: Date.now().toString(),
      left: '',
      right: '',
    };
    onChange({ pairs: [...pairs, newPair] });
  };

  const updatePair = (
    index: number,
    field: 'left' | 'right',
    value: string
  ) => {
    const updatedPairs = [...pairs];
    updatedPairs[index] = { ...updatedPairs[index], [field]: value };
    onChange({ pairs: updatedPairs });
  };

  const deletePair = (index: number) => {
    const updatedPairs = pairs.filter((_, i) => i !== index);
    onChange({ pairs: updatedPairs });
  };

  const shufflePairs = () => {
    const leftItems = pairs.map(p => p.left);
    const rightItems = [...pairs.map(p => p.right)];

    // Fisher-Yates shuffle for right items
    for (let i = rightItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rightItems[i], rightItems[j]] = [rightItems[j], rightItems[i]];
    }

    const shuffledPairs = pairs.map((pair, index) => ({
      ...pair,
      right: rightItems[index],
    }));

    onChange({ pairs: shuffledPairs });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="question-text">{t('questionText')}</Label>
        <Textarea
          id="question-text"
          value={question.text}
          onChange={e => onChange({ text: e.target.value })}
          placeholder={t('questionPlaceholder')}
          className="mt-1"
          rows={3}
        />
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="mb-4 flex items-center justify-between">
            <Label>{t('matchingPairs')}</Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={shufflePairs}
                className="flex items-center gap-2"
              >
                <Shuffle className="h-4 w-4" />
                {t('shuffleRight')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={addPair}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {t('addPair')}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {/* ヘッダー */}
            <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-600">
              <div className="col-span-5">{t('leftColumn')}</div>
              <div className="col-span-1 text-center">↔</div>
              <div className="col-span-5">{t('rightColumn')}</div>
              <div className="col-span-1"></div>
            </div>

            {/* ペアの入力 */}
            {pairs.map((pair, index) => (
              <div
                key={pair.id}
                className="grid grid-cols-12 items-center gap-2"
              >
                <div className="col-span-5">
                  <Input
                    value={pair.left}
                    onChange={e => updatePair(index, 'left', e.target.value)}
                    placeholder={t('leftPlaceholder')}
                  />
                </div>
                <div className="col-span-1 text-center text-gray-400">
                  <span className="text-lg">⟷</span>
                </div>
                <div className="col-span-5">
                  <Input
                    value={pair.right}
                    onChange={e => updatePair(index, 'right', e.target.value)}
                    placeholder={t('rightPlaceholder')}
                  />
                </div>
                <div className="col-span-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deletePair(index)}
                    disabled={pairs.length <= 2}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-3 text-sm text-gray-500">{t('matchingHint')}</p>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Label htmlFor="points">{t('points')}</Label>
          <Input
            id="points"
            type="number"
            value={question.points}
            onChange={e => onChange({ points: parseInt(e.target.value) || 0 })}
            className="mt-1 w-24"
            min={0}
          />
        </div>
      </div>

      {/* ヒントセクション */}
      <div>
        {question.hint !== undefined ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="hint">{t('hint')}</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange({ hint: undefined })}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              id="hint"
              value={question.hint || ''}
              onChange={e => onChange({ hint: e.target.value })}
              placeholder={t('hintPlaceholder')}
              rows={2}
            />
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange({ hint: '' })}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t('addHint')}
          </Button>
        )}
      </div>

      {/* 解説セクション */}
      <div>
        {question.explanation !== undefined ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="explanation">{t('explanation')}</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange({ explanation: undefined })}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              id="explanation"
              value={question.explanation || ''}
              onChange={e => onChange({ explanation: e.target.value })}
              placeholder={t('explanationPlaceholder')}
              rows={3}
            />
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange({ explanation: '' })}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t('addExplanation')}
          </Button>
        )}
      </div>
    </div>
  );
}
