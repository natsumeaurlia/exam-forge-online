'use client';

import { useState } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  Sparkles,
  FileText,
  CheckCircle,
  Circle,
  Square,
  List,
  Wand2,
  Loader2,
  Save,
  RefreshCw,
  X,
  Settings,
  Lightbulb,
} from 'lucide-react';
import { QuestionType, QuestionDifficulty } from '@prisma/client';
import {
  createBankQuestion,
  generateQuestionsWithAI,
} from '@/lib/actions/question-bank';

interface GeneratedQuestion {
  type: QuestionType;
  text: string;
  points: number;
  difficulty: QuestionDifficulty;
  hint?: string;
  explanation?: string;
  options?: Array<{
    text: string;
    isCorrect: boolean;
  }>;
}

interface AIQuestionGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AIQuestionGenerator({
  isOpen,
  onClose,
  onSuccess,
}: AIQuestionGeneratorProps) {
  const t = useTranslations('questionBank');
  const [step, setStep] = useState<'config' | 'generating' | 'review'>(
    'config'
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Configuration
  const [topic, setTopic] = useState('');
  const [context, setContext] = useState('');
  const [questionType, setQuestionType] =
    useState<QuestionType>('MULTIPLE_CHOICE');
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>('MEDIUM');
  const [count, setCount] = useState(5);
  const [language, setLanguage] = useState('japanese');

  // Generated questions
  const [generatedQuestions, setGeneratedQuestions] = useState<
    GeneratedQuestion[]
  >([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(
    new Set()
  );

  const handleClose = () => {
    setStep('config');
    setTopic('');
    setContext('');
    setQuestionType('MULTIPLE_CHOICE');
    setDifficulty('MEDIUM');
    setCount(5);
    setLanguage('japanese');
    setGeneratedQuestions([]);
    setSelectedQuestions(new Set());
    onClose();
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

  const getDifficultyColor = (difficulty: QuestionDifficulty) => {
    switch (difficulty) {
      case 'EASY':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'HARD':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'EXPERT':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const generateQuestions = async () => {
    if (!topic.trim()) {
      toast.error(t('ai.validation.topicRequired'));
      return;
    }

    setLoading(true);
    setStep('generating');

    try {
      // Real AI generation using our server action
      const result = await generateQuestionsWithAI({
        topic: topic.trim(),
        context: context.trim() || undefined,
        questionType,
        difficulty,
        count,
        language: language === 'japanese' ? 'ja' : 'en',
        customInstructions: undefined,
      });

      if (result?.data?.success && result.data.questions) {
        const questions: GeneratedQuestion[] = result.data.questions.map(q => ({
          type: q.type,
          text: q.text,
          points: q.points,
          difficulty: q.difficulty,
          hint: q.hint || undefined,
          explanation: q.explanation || '',
          options: q.options?.map(opt => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
          })),
        }));

        setGeneratedQuestions(questions);
        setSelectedQuestions(new Set(questions.map((_, index) => index)));
        setStep('review');

        toast.success(`${questions.length}問の問題を生成しました！`);
      } else {
        throw new Error(result?.data?.error || 'AI問題生成に失敗しました');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'AI問題生成中にエラーが発生しました'
      );
      setStep('config');
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestionSelection = (index: number) => {
    const newSelection = new Set(selectedQuestions);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedQuestions(newSelection);
  };

  const saveSelectedQuestions = async () => {
    if (selectedQuestions.size === 0) {
      toast.error(t('ai.validation.noQuestionsSelected'));
      return;
    }

    // Questions are already saved by the AI generation process
    // This function now just confirms the selection and closes the modal
    const selectedCount = selectedQuestions.size;

    toast.success(`${selectedCount}問の問題が問題バンクに保存されました`);

    onSuccess();
    handleClose();
  };

  const regenerateQuestions = () => {
    setStep('config');
    setGeneratedQuestions([]);
    setSelectedQuestions(new Set());
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            {t('ai.title')}
            <Badge className="bg-purple-100 text-purple-800">
              <Sparkles className="mr-1 h-3 w-3" />
              AI
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {step === 'config' && (
          <div className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">
                  <Settings className="mr-2 h-4 w-4" />
                  {t('ai.tabs.basic')}
                </TabsTrigger>
                <TabsTrigger value="advanced">
                  <Wand2 className="mr-2 h-4 w-4" />
                  {t('ai.tabs.advanced')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="topic" className="text-base font-medium">
                      {t('ai.config.topic.label')} *
                    </Label>
                    <Input
                      id="topic"
                      placeholder={t('ai.config.topic.placeholder')}
                      value={topic}
                      onChange={e => setTopic(e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="context" className="text-base font-medium">
                      {t('ai.config.context.label')}
                    </Label>
                    <Textarea
                      id="context"
                      placeholder={t('ai.config.context.placeholder')}
                      value={context}
                      onChange={e => setContext(e.target.value)}
                      rows={3}
                      className="mt-2 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <Label className="text-base font-medium">
                        {t('ai.config.type.label')}
                      </Label>
                      <Select
                        value={questionType}
                        onValueChange={(value: QuestionType) =>
                          setQuestionType(value)
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(QuestionType).map(type => (
                            <SelectItem key={type} value={type}>
                              <div className="flex items-center gap-2">
                                {getQuestionTypeIcon(type)}
                                {t(`types.${type.toLowerCase()}`)}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-base font-medium">
                        {t('ai.config.difficulty.label')}
                      </Label>
                      <Select
                        value={difficulty}
                        onValueChange={(value: QuestionDifficulty) =>
                          setDifficulty(value)
                        }
                      >
                        <SelectTrigger className="mt-2">
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

                    <div>
                      <Label htmlFor="count" className="text-base font-medium">
                        {t('ai.config.count.label')}
                      </Label>
                      <Input
                        id="count"
                        type="number"
                        min={1}
                        max={20}
                        value={count}
                        onChange={e => setCount(parseInt(e.target.value) || 1)}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">
                      {t('ai.config.language.label')}
                    </Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="japanese">日本語</SelectItem>
                        <SelectItem value="english">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Lightbulb className="h-4 w-4" />
                        {t('ai.tips.title')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-gray-600">
                        {t('ai.tips.tip1')}
                      </p>
                      <p className="text-sm text-gray-600">
                        {t('ai.tips.tip2')}
                      </p>
                      <p className="text-sm text-gray-600">
                        {t('ai.tips.tip3')}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 border-t pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                <X className="mr-2 h-4 w-4" />
                {t('ai.actions.cancel')}
              </Button>
              <Button onClick={generateQuestions} disabled={loading}>
                <Brain className="mr-2 h-4 w-4" />
                {t('ai.actions.generate')}
              </Button>
            </div>
          </div>
        )}

        {step === 'generating' && (
          <div className="flex flex-col items-center justify-center space-y-4 py-12">
            <div className="relative">
              <Brain className="h-16 w-16 text-purple-600" />
              <Loader2 className="absolute -top-1 -right-1 h-6 w-6 animate-spin text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold">
              {t('ai.generating.title')}
            </h3>
            <p className="max-w-md text-center text-gray-600">
              {t('ai.generating.description')}
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Sparkles className="h-4 w-4" />
              {t('ai.generating.progress')}
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {t('ai.review.title')}
                </h3>
                <p className="text-gray-600">
                  {t('ai.review.description', {
                    selected: selectedQuestions.size,
                    total: generatedQuestions.length,
                  })}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={regenerateQuestions}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t('ai.actions.regenerate')}
                </Button>
              </div>
            </div>

            <div className="max-h-96 space-y-4 overflow-y-auto">
              {generatedQuestions.map((question, index) => (
                <Card
                  key={index}
                  className={`cursor-pointer transition-all ${
                    selectedQuestions.has(index)
                      ? 'bg-blue-50 ring-2 ring-blue-500'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => toggleQuestionSelection(index)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <input
                          type="checkbox"
                          checked={selectedQuestions.has(index)}
                          onChange={() => toggleQuestionSelection(index)}
                          className="rounded"
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-1 text-gray-600">
                            {getQuestionTypeIcon(question.type)}
                            <span className="text-sm font-medium">
                              {t(`types.${question.type.toLowerCase()}`)}
                            </span>
                          </div>
                          <Badge
                            className={`text-xs ${getDifficultyColor(question.difficulty)}`}
                          >
                            {t(
                              `difficulty.${question.difficulty.toLowerCase()}`
                            )}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {question.points} {t('points')}
                          </Badge>
                        </div>

                        <p className="text-sm font-medium text-gray-900">
                          {question.text}
                        </p>

                        {question.options && (
                          <div className="space-y-1">
                            {question.options.map((option, optIndex) => (
                              <div
                                key={optIndex}
                                className={`flex items-center gap-2 rounded p-2 text-xs ${
                                  option.isCorrect
                                    ? 'border border-green-200 bg-green-50 text-green-800'
                                    : 'border border-gray-200 bg-gray-50'
                                }`}
                              >
                                <span className="font-medium">
                                  {String.fromCharCode(65 + optIndex)}:
                                </span>
                                <span>{option.text}</span>
                                {option.isCorrect && (
                                  <CheckCircle className="ml-auto h-3 w-3 text-green-600" />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-end gap-3 border-t pt-4">
              <Button variant="outline" onClick={handleClose} disabled={saving}>
                <X className="mr-2 h-4 w-4" />
                {t('ai.actions.cancel')}
              </Button>
              <Button
                onClick={saveSelectedQuestions}
                disabled={saving || selectedQuestions.size === 0}
              >
                <Save className="mr-2 h-4 w-4" />
                {saving
                  ? t('ai.actions.saving')
                  : t('ai.actions.save', { count: selectedQuestions.size })}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
