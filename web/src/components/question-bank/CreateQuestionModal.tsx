'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
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
  const [loading, setLoading] = useState(false);

  // Form state
  const [questionType, setQuestionType] =
    useState<QuestionType>('MULTIPLE_CHOICE');
  const [questionText, setQuestionText] = useState('');
  const [points, setPoints] = useState(1);
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>('MEDIUM');
  const [hint, setHint] = useState('');
  const [explanation, setExplanation] = useState('');
  const [options, setOptions] = useState<Option[]>([
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setQuestionType('MULTIPLE_CHOICE');
    setQuestionText('');
    setPoints(1);
    setDifficulty('MEDIUM');
    setHint('');
    setExplanation('');
    setOptions([
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ]);
  };

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
    setQuestionType(type);

    // Reset options based on question type
    if (type === 'TRUE_FALSE') {
      setOptions([
        { text: 'True', isCorrect: false },
        { text: 'False', isCorrect: false },
      ]);
    } else if (type === 'SHORT_ANSWER') {
      setOptions([]);
    } else {
      setOptions([
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ]);
    }
  };

  const addOption = () => {
    if (options.length < 8) {
      setOptions([...options, { text: '', isCorrect: false }]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
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

    setOptions(newOptions);
  };

  const handleSubmit = async () => {
    try {
      // Validation
      if (!questionText.trim()) {
        toast.error(t('create.validation.questionRequired'));
        return;
      }

      if (questionType !== 'SHORT_ANSWER' && options.length === 0) {
        toast.error(t('create.validation.optionsRequired'));
        return;
      }

      if (questionType !== 'SHORT_ANSWER') {
        const hasCorrectOption = options.some(opt => opt.isCorrect);
        if (!hasCorrectOption) {
          toast.error(t('create.validation.correctOptionRequired'));
          return;
        }

        const hasEmptyOption = options.some(opt => !opt.text.trim());
        if (hasEmptyOption) {
          toast.error(t('create.validation.emptyOptionsNotAllowed'));
          return;
        }
      }

      setLoading(true);

      const result = await createBankQuestion({
        type: questionType,
        text: questionText.trim(),
        points,
        difficulty,
        hint: hint.trim() || undefined,
        explanation: explanation.trim() || undefined,
        options: questionType === 'SHORT_ANSWER' ? undefined : options,
      });

      if (result.data?.success) {
        toast.success(t('create.success'));
        onSuccess();
      } else {
        toast.error(result.data?.error || t('create.error'));
      }
    } catch (error) {
      console.error('Failed to create question:', error);
      toast.error(t('create.error'));
    } finally {
      setLoading(false);
    }
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
                  value={questionText}
                  onChange={e => setQuestionText(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
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
                    value={points}
                    onChange={e => setPoints(parseInt(e.target.value) || 1)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-medium">
                    {t('create.difficulty.label')}
                  </Label>
                  <Select
                    value={difficulty}
                    onValueChange={(value: QuestionDifficulty) =>
                      setDifficulty(value)
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
                  value={hint}
                  onChange={e => setHint(e.target.value)}
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
                  value={explanation}
                  onChange={e => setExplanation(e.target.value)}
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
              disabled={loading}
            >
              <X className="mr-2 h-4 w-4" />
              {t('create.actions.cancel')}
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading
                ? t('create.actions.creating')
                : t('create.actions.create')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
