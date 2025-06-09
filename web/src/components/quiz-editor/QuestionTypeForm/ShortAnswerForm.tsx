'use client';

import { useTranslations } from 'next-intl';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';

interface ShortAnswerFormProps {
  question: {
    text: string;
    correctAnswer?: string;
    gradingCriteria?: string;
    points: number;
    hint?: string;
    explanation?: string;
  };
  isAutoGrading: boolean;
  onChange: (
    updates: Partial<{
      text: string;
      correctAnswer?: string;
      gradingCriteria?: string;
      points: number;
      hint?: string;
      explanation?: string;
    }>
  ) => void;
}

export function ShortAnswerForm({
  question,
  isAutoGrading,
  onChange,
}: ShortAnswerFormProps) {
  const t = useTranslations('quizManagement.editor.questionTypes.freetext');

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

      {isAutoGrading ? (
        <Card>
          <CardContent className="pt-4">
            <Label htmlFor="correct-answer">{t('correctAnswer')}</Label>
            <Textarea
              id="correct-answer"
              value={question.correctAnswer || ''}
              onChange={e => onChange({ correctAnswer: e.target.value })}
              placeholder={t('correctAnswerPlaceholder')}
              className="mt-1"
              rows={3}
            />
            <p className="mt-2 text-sm text-gray-500">
              {t('correctAnswerHint')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-4">
            <Label htmlFor="grading-criteria">{t('gradingCriteria')}</Label>
            <Textarea
              id="grading-criteria"
              value={question.gradingCriteria || ''}
              onChange={e => onChange({ gradingCriteria: e.target.value })}
              placeholder={t('gradingCriteriaPlaceholder')}
              className="mt-1"
              rows={4}
            />
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
