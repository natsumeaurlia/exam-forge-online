'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  Circle,
  Square,
  Type,
  ArrowUpDown,
  Puzzle,
  Target,
  Link,
  Hash,
  Database,
} from 'lucide-react';
import { useQuizEditorStore } from '@/stores/useQuizEditorStore';
import { QuestionType } from '@prisma/client';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTranslations } from 'next-intl';

const getQuestionTypes = (t: any) => [
  {
    type: QuestionType.TRUE_FALSE,
    label: t('truefalse.label'),
    icon: CheckCircle,
    description: t('truefalse.description'),
    isPro: false,
  },
  {
    type: QuestionType.MULTIPLE_CHOICE,
    label: t('singlechoice.label'),
    icon: Circle,
    description: t('singlechoice.description'),
    isPro: false,
  },
  {
    type: QuestionType.CHECKBOX,
    label: t('multiplechoice.label'),
    icon: Square,
    description: t('multiplechoice.description'),
    isPro: false,
  },
  {
    type: QuestionType.SHORT_ANSWER,
    label: t('freetext.label'),
    icon: Type,
    description: t('freetext.description'),
    isPro: false,
  },
  {
    type: QuestionType.SORTING,
    label: t('ordering.label'),
    icon: ArrowUpDown,
    description: t('ordering.description'),
    isPro: true,
  },
  {
    type: QuestionType.FILL_IN_BLANK,
    label: t('fillinblank.label'),
    icon: Puzzle,
    description: t('fillinblank.description'),
    isPro: true,
  },
  {
    type: QuestionType.DIAGRAM,
    label: t('diagram.label'),
    icon: Target,
    description: t('diagram.description'),
    isPro: true,
  },
  {
    type: QuestionType.MATCHING,
    label: t('matching.label'),
    icon: Link,
    description: t('matching.description'),
    isPro: true,
  },
  {
    type: QuestionType.NUMERIC,
    label: t('numeric.label'),
    icon: Hash,
    description: t('numeric.description'),
    isPro: true,
  },
];

export function QuestionTypeToolbar() {
  const { addQuestion } = useQuizEditorStore();
  const t = useTranslations('quizManagement.editor.questionTypes');
  const questionTypes = getQuestionTypes(t);

  const handleAddQuestion = (type: QuestionType) => {
    addQuestion(type);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">
          {t('addQuestion')}
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          <TooltipProvider>
            {questionTypes.map(
              ({ type, label, icon: Icon, description, isPro }) => (
                <Tooltip key={type}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddQuestion(type)}
                      disabled={isPro}
                      className="flex h-auto flex-col items-center gap-1 py-3"
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs">{label}</span>
                      {isPro && (
                        <span className="text-xs text-orange-500">
                          {t('proLabel')}
                        </span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{description}</p>
                  </TooltipContent>
                </Tooltip>
              )
            )}
          </TooltipProvider>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled
                className="flex h-auto flex-col items-center gap-1 py-3"
              >
                <Database className="h-5 w-5" />
                <span className="text-xs">{t('questionBank')}</span>
                <span className="text-xs text-orange-500">{t('proLabel')}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('selectFromSaved')}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  );
}
