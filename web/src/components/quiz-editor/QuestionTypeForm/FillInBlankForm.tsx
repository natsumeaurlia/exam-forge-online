'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, X, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Blank {
  id: string;
  answer: string;
  alternativeAnswers?: string[];
}

interface FillInBlankFormProps {
  question: {
    text: string;
    blanks?: Blank[];
    points: number;
    hint?: string;
    explanation?: string;
  };
  isAutoGrading: boolean;
  onChange: (updates: Partial<FillInBlankFormProps['question']>) => void;
}

export function FillInBlankForm({
  question,
  isAutoGrading,
  onChange,
}: FillInBlankFormProps) {
  const t = useTranslations('quizManagement.editor.questionTypes.fillinblank');
  const [previewText, setPreviewText] = useState(question.text || '');

  const blanks = question.blanks || [];

  const updateText = (text: string) => {
    setPreviewText(text);
    onChange({ text });

    // 空欄の数を数える
    const blankMatches = text.match(/\[blank\]/g) || [];
    const newBlanks = [...blanks];

    // 空欄の数に合わせて調整
    while (newBlanks.length < blankMatches.length) {
      newBlanks.push({
        id: Date.now().toString() + newBlanks.length,
        answer: '',
        alternativeAnswers: [],
      });
    }
    while (newBlanks.length > blankMatches.length) {
      newBlanks.pop();
    }

    if (newBlanks.length !== blanks.length) {
      onChange({ blanks: newBlanks });
    }
  };

  const updateBlankAnswer = (index: number, answer: string) => {
    const updatedBlanks = [...blanks];
    updatedBlanks[index] = { ...updatedBlanks[index], answer };
    onChange({ blanks: updatedBlanks });
  };

  const addAlternativeAnswer = (index: number) => {
    const updatedBlanks = [...blanks];
    const alternatives = updatedBlanks[index].alternativeAnswers || [];
    updatedBlanks[index] = {
      ...updatedBlanks[index],
      alternativeAnswers: [...alternatives, ''],
    };
    onChange({ blanks: updatedBlanks });
  };

  const updateAlternativeAnswer = (
    blankIndex: number,
    altIndex: number,
    value: string
  ) => {
    const updatedBlanks = [...blanks];
    const alternatives = [
      ...(updatedBlanks[blankIndex].alternativeAnswers || []),
    ];
    alternatives[altIndex] = value;
    updatedBlanks[blankIndex] = {
      ...updatedBlanks[blankIndex],
      alternativeAnswers: alternatives,
    };
    onChange({ blanks: updatedBlanks });
  };

  const removeAlternativeAnswer = (blankIndex: number, altIndex: number) => {
    const updatedBlanks = [...blanks];
    const alternatives = [
      ...(updatedBlanks[blankIndex].alternativeAnswers || []),
    ];
    alternatives.splice(altIndex, 1);
    updatedBlanks[blankIndex] = {
      ...updatedBlanks[blankIndex],
      alternativeAnswers: alternatives,
    };
    onChange({ blanks: updatedBlanks });
  };

  const renderPreview = () => {
    let parts = previewText.split('[blank]');
    return (
      <div className="rounded-lg bg-gray-50 p-4">
        <Label className="mb-2 text-sm">{t('preview')}</Label>
        <div className="text-base">
          {parts.map((part, index) => (
            <span key={index}>
              {part}
              {index < parts.length - 1 && (
                <span className="mx-1 inline-block min-w-[80px] rounded border-2 border-dashed border-gray-400 bg-white px-3 py-1 text-center">
                  {index + 1}
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>{t('instructions')}</AlertDescription>
      </Alert>

      <div>
        <Label htmlFor="question-text">{t('questionText')}</Label>
        <Textarea
          id="question-text"
          value={previewText}
          onChange={e => updateText(e.target.value)}
          placeholder={t('questionPlaceholder')}
          className="mt-1"
          rows={4}
        />
      </div>

      {previewText && renderPreview()}

      {blanks.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <Label className="mb-3">{t('blanksAnswers')}</Label>
            <div className="space-y-4">
              {blanks.map((blank, index) => (
                <div key={blank.id} className="rounded-lg border p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {t('blank')} {index + 1}
                    </span>
                  </div>

                  <Input
                    value={blank.answer}
                    onChange={e => updateBlankAnswer(index, e.target.value)}
                    placeholder={t('correctAnswer')}
                    className="mb-2"
                  />

                  {isAutoGrading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">
                          {t('alternativeAnswers')}
                        </Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addAlternativeAnswer(index)}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          {t('addAlternative')}
                        </Button>
                      </div>

                      {blank.alternativeAnswers?.map((alt, altIndex) => (
                        <div key={altIndex} className="flex items-center gap-2">
                          <Input
                            value={alt}
                            onChange={e =>
                              updateAlternativeAnswer(
                                index,
                                altIndex,
                                e.target.value
                              )
                            }
                            placeholder={t('alternativePlaceholder')}
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              removeAlternativeAnswer(index, altIndex)
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
