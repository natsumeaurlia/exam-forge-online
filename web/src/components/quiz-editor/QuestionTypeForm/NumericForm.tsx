'use client';

import { useTranslations } from 'next-intl';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, X, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';

interface NumericFormProps {
  question: {
    text: string;
    correctAnswer?: number;
    tolerance?: number;
    allowRange?: boolean;
    minValue?: number;
    maxValue?: number;
    unit?: string;
    decimalPlaces?: number;
    points: number;
    hint?: string;
    explanation?: string;
  };
  isAutoGrading: boolean;
  onChange: (updates: Partial<NumericFormProps['question']>) => void;
}

export function NumericForm({
  question,
  isAutoGrading,
  onChange,
}: NumericFormProps) {
  const t = useTranslations('quizManagement.editor.questionTypes.numeric');

  const allowRange = question.allowRange || false;

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

      {isAutoGrading && (
        <Card>
          <CardContent className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="allow-range">{t('allowRange')}</Label>
              <Switch
                id="allow-range"
                checked={allowRange}
                onCheckedChange={checked => onChange({ allowRange: checked })}
              />
            </div>

            {!allowRange ? (
              <>
                <div>
                  <Label htmlFor="correct-answer">{t('correctAnswer')}</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Input
                      id="correct-answer"
                      type="number"
                      step="any"
                      value={question.correctAnswer ?? ''}
                      onChange={e =>
                        onChange({
                          correctAnswer: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder={t('answerPlaceholder')}
                      className="flex-1"
                    />
                    {question.unit && (
                      <span className="text-sm text-gray-600">
                        {question.unit}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="tolerance">{t('tolerance')}</Label>
                  <Input
                    id="tolerance"
                    type="number"
                    step="any"
                    value={question.tolerance ?? ''}
                    onChange={e =>
                      onChange({ tolerance: parseFloat(e.target.value) || 0 })
                    }
                    placeholder={t('tolerancePlaceholder')}
                    className="mt-1 w-32"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {t('toleranceHint')}
                  </p>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min-value">{t('minValue')}</Label>
                  <Input
                    id="min-value"
                    type="number"
                    step="any"
                    value={question.minValue ?? ''}
                    onChange={e =>
                      onChange({ minValue: parseFloat(e.target.value) || 0 })
                    }
                    placeholder={t('minPlaceholder')}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="max-value">{t('maxValue')}</Label>
                  <Input
                    id="max-value"
                    type="number"
                    step="any"
                    value={question.maxValue ?? ''}
                    onChange={e =>
                      onChange({ maxValue: parseFloat(e.target.value) || 0 })
                    }
                    placeholder={t('maxPlaceholder')}
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="unit">{t('unit')}</Label>
                <Input
                  id="unit"
                  value={question.unit || ''}
                  onChange={e => onChange({ unit: e.target.value })}
                  placeholder={t('unitPlaceholder')}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="decimal-places">{t('decimalPlaces')}</Label>
                <Input
                  id="decimal-places"
                  type="number"
                  min={0}
                  max={10}
                  value={question.decimalPlaces ?? ''}
                  onChange={e =>
                    onChange({ decimalPlaces: parseInt(e.target.value) || 0 })
                  }
                  placeholder={t('decimalPlaceholder')}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!isAutoGrading && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>{t('manualGradingNote')}</AlertDescription>
        </Alert>
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
