'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Trash2,
  CheckCircle,
  Circle,
  Square,
  List,
  FileText,
  Save,
  X,
} from 'lucide-react';
import { QuestionType, QuestionDifficulty } from '@prisma/client';
import { createBankQuestion } from '@/lib/actions/question-bank';

interface Option {
  text: string;
  isCorrect: boolean;
}

const optionSchema = z.object({
  text: z.string().min(1, '選択肢を入力してください'),
  isCorrect: z.boolean(),
});

const questionSchema = z.object({
  type: z.nativeEnum(QuestionType),
  text: z.string().min(1, '問題文を入力してください'),
  points: z.number().min(1, '1点以上を指定してください').max(100, '100点以下を指定してください'),
  difficulty: z.nativeEnum(QuestionDifficulty),
  hint: z.string().optional(),
  explanation: z.string().optional(),
  options: z.array(optionSchema).optional(),
}).refine((data) => {
  if (data.type === 'SHORT_ANSWER') {
    return true;
  }
  
  if (!data.options || data.options.length === 0) {
    return false;
  }
  
  const hasCorrectOption = data.options.some(opt => opt.isCorrect);
  return hasCorrectOption;
}, {
  message: '正解となる選択肢を少なくとも1つ選択してください',
  path: ['options'],
});

type QuestionFormData = z.infer<typeof questionSchema>;

interface CreateQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateQuestionModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateQuestionModalProps) {
  const t = useTranslations('questionBank');

  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      type: 'MULTIPLE_CHOICE',
      text: '',
      points: 1,
      difficulty: 'MEDIUM',
      hint: '',
      explanation: '',
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ],
    },
  });

  const {
    formState: { errors },
    watch,
    setValue,
    reset,
  } = form;

  const questionType = watch('type');
  const options = watch('options') || [];

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  // React Hook Form Action integration
  const { action, isPending } = useHookFormAction(
    createBankQuestion,
    form,
    {
      onSuccess: () => {
        toast.success(t('create.success'));
        onSuccess();
        onClose();
      },
      onError: (error) => {
        toast.error(error.serverError || t('create.error'));
      },
    }
  );

  const getQuestionTypeIcon = (type: QuestionType) => {
    switch (type) {
      case 'TRUE_FALSE':
        return <CheckCircle className="h-4 w-4" />;
      case 'MULTIPLE_CHOICE':
        return <Circle className="h-4 w-4" />;
      case 'CHECKBOX':
        return <Square className="h-4 w-4" />;
      case 'SHORT_ANSWER':
        return <List className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const handleTypeChange = (type: QuestionType) => {
    setValue('type', type);

    // Reset options based on question type
    if (type === 'TRUE_FALSE') {
      setValue('options', [
        { text: 'True', isCorrect: false },
        { text: 'False', isCorrect: false },
      ]);
    } else if (type === 'SHORT_ANSWER') {
      setValue('options', []);
    } else {
      setValue('options', [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ]);
    }
  };

  const addOption = () => {
    if (options.length < 8) {
      setValue('options', [...options, { text: '', isCorrect: false }]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setValue('options', options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (
    index: number,
    field: keyof Option,
    value: string | boolean
  ) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };

    // For multiple choice, ensure only one correct answer
    if (
      field === 'isCorrect' &&
      value === true &&
      questionType === 'MULTIPLE_CHOICE'
    ) {
      newOptions.forEach((opt, i) => {
        if (i !== index) opt.isCorrect = false;
      });
    }

    setValue('options', newOptions);
  };


  const correctOptionsCount = options.filter(opt => opt.isCorrect).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {t('create.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">{t('create.tabs.basic')}</TabsTrigger>
              <TabsTrigger value="advanced">
                {t('create.tabs.advanced')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              {/* Question Type */}
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  {t('create.type.label')}
                </Label>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {Object.values(QuestionType).map(type => (
                    <Card
                      key={type}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        questionType === type
                          ? 'bg-blue-50 ring-2 ring-blue-500'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleTypeChange(type)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="flex flex-col items-center gap-2">
                          {getQuestionTypeIcon(type)}
                          <span className="text-sm font-medium">
                            {t(`types.${type.toLowerCase()}`)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Question Text */}
              <div className="space-y-2">
                <Label
                  htmlFor="question-text"
                  className="text-base font-medium"
                >
                  {t('create.question.label')} *
                </Label>
                <Textarea
                  id="question-text"
                  placeholder={t('create.question.placeholder')}
                  {...form.register('text')}
                  rows={4}
                  className={`resize-none ${errors.text ? 'border-red-500' : ''}`}
                />
                {errors.text && (
                  <p className="mt-1 text-sm text-red-500">{errors.text.message}</p>
                )}
              </div>

              {/* Options */}
              {questionType !== 'SHORT_ANSWER' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">
                      {t('create.options.label')} *
                    </Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {correctOptionsCount} {t('create.options.correct')}
                      </Badge>
                      {options.length < 8 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addOption}
                        >
                          <Plus className="mr-1 h-4 w-4" />
                          {t('create.options.add')}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {options.map((option, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-medium">
                          {String.fromCharCode(65 + index)}
                        </div>
                        <Input
                          placeholder={t('create.options.placeholder', {
                            number: index + 1,
                          })}
                          value={option.text}
                          onChange={e =>
                            updateOption(index, 'text', e.target.value)
                          }
                          className="flex-1"
                        />
                        <div className="flex items-center gap-2">
                          <Label className="text-sm text-gray-600">
                            {t('create.options.correctLabel')}
                          </Label>
                          <Switch
                            checked={option.isCorrect}
                            onCheckedChange={checked =>
                              updateOption(index, 'isCorrect', checked)
                            }
                          />
                        </div>
                        {options.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOption(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {errors.options && (
                      <p className="mt-1 text-sm text-red-500">{errors.options.message}</p>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6">
              {/* Points and Difficulty */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="points" className="text-base font-medium">
                    {t('create.points.label')}
                  </Label>
                  <Input
                    id="points"
                    type="number"
                    min={1}
                    max={100}
                    {...form.register('points', { valueAsNumber: true })}
                    className={errors.points ? 'border-red-500' : ''}
                  />
                  {errors.points && (
                    <p className="mt-1 text-sm text-red-500">{errors.points.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-medium">
                    {t('create.difficulty.label')}
                  </Label>
                  <Select
                    value={watch('difficulty')}
                    onValueChange={(value: QuestionDifficulty) =>
                      setValue('difficulty', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(QuestionDifficulty).map(diff => (
                        <SelectItem key={diff} value={diff}>
                          {t(`difficulty.${diff.toLowerCase()}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Hint */}
              <div className="space-y-2">
                <Label htmlFor="hint" className="text-base font-medium">
                  {t('create.hint.label')}
                </Label>
                <Textarea
                  id="hint"
                  placeholder={t('create.hint.placeholder')}
                  {...form.register('hint')}
                  rows={2}
                  className="resize-none"
                />
              </div>

              {/* Explanation */}
              <div className="space-y-2">
                <Label htmlFor="explanation" className="text-base font-medium">
                  {t('create.explanation.label')}
                </Label>
                <Textarea
                  id="explanation"
                  placeholder={t('create.explanation.placeholder')}
                  {...form.register('explanation')}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              <X className="mr-2 h-4 w-4" />
              {t('create.actions.cancel')}
            </Button>
            <form onSubmit={action}>
              <Button type="submit" disabled={isPending}>
                <Save className="mr-2 h-4 w-4" />
                {isPending
                  ? t('create.actions.creating')
                  : t('create.actions.create')}
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
