'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, X, Trash2 } from 'lucide-react';

interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface MultipleChoiceFormProps {
  question: {
    text: string;
    options: Option[];
    correctAnswer: string;
    points: number;
    hint?: string;
    explanation?: string;
  };
  isAutoGrading: boolean;
  onChange: (
    updates: Partial<{
      text: string;
      options: Option[];
      correctAnswer: string;
      points: number;
      hint?: string;
      explanation?: string;
    }>
  ) => void;
}

export function MultipleChoiceForm({
  question,
  isAutoGrading,
  onChange,
}: MultipleChoiceFormProps) {
  const t = useTranslations('quizManagement.editor.questionTypes.singlechoice');

  const addOption = () => {
    const newOption: Option = {
      id: Date.now().toString(),
      text: '',
      isCorrect: false,
    };
    onChange({ options: [...question.options, newOption] });
  };

  const updateOption = (id: string, text: string) => {
    const updatedOptions = question.options.map(opt =>
      opt.id === id ? { ...opt, text } : opt
    );
    onChange({ options: updatedOptions });
  };

  const deleteOption = (id: string) => {
    const updatedOptions = question.options.filter(opt => opt.id !== id);
    onChange({ options: updatedOptions });
  };

  const setCorrectAnswer = (id: string) => {
    const updatedOptions = question.options.map(opt => ({
      ...opt,
      isCorrect: opt.id === id,
    }));
    onChange({ options: updatedOptions, correctAnswer: id });
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
          <div className="mb-3 flex items-center justify-between">
            <Label>{t('options')}</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={addOption}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {t('addOption')}
            </Button>
          </div>

          <div className="space-y-3">
            {question.options.map((option, index) => (
              <div key={option.id} className="flex items-center gap-3">
                {isAutoGrading && (
                  <RadioGroup
                    value={question.correctAnswer}
                    onValueChange={setCorrectAnswer}
                  >
                    <RadioGroupItem value={option.id} />
                  </RadioGroup>
                )}
                <Input
                  value={option.text}
                  onChange={e => updateOption(option.id, e.target.value)}
                  placeholder={`${t('option')} ${index + 1}`}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteOption(option.id)}
                  disabled={question.options.length <= 2}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
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
