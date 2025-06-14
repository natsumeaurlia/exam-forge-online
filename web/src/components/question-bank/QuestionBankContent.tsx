'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  Filter,
  Brain,
  FileText,
  CheckCircle,
  Square,
  List,
  Shuffle,
  SortAsc,
  Tag,
  Calendar,
  User,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { QuestionCard } from './QuestionCard';
import { CreateQuestionModal } from './CreateQuestionModal';
import { AIQuestionGenerator } from './AIQuestionGenerator';
import { CategoryFilter } from './CategoryFilter';
import { getBankQuestions } from '@/lib/actions/question-bank';

interface BankQuestion {
  id: string;
  type: string;
  text: string;
  points: number;
  hint?: string;
  explanation?: string;
  difficulty: string;
  aiGenerated: boolean;
  createdAt: Date;
  createdBy: {
    name: string;
  };
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  tags: Array<{
    tag: {
      id: string;
      name: string;
      color?: string;
    };
  }>;
  categories: Array<{
    category: {
      id: string;
      name: string;
    };
  }>;
}

interface QuestionBankContentProps {
  userId: string;
  lng: string;
}

export function QuestionBankContent({ userId, lng }: QuestionBankContentProps) {
  const t = useTranslations('questionBank');
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, [selectedCategory, selectedDifficulty, selectedType, sortBy]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const result = await getBankQuestions({
        search: searchQuery,
        categoryId: selectedCategory || undefined,
        difficulty: selectedDifficulty as
          | 'EASY'
          | 'MEDIUM'
          | 'HARD'
          | 'EXPERT'
          | undefined,
        type: selectedType as
          | 'TRUE_FALSE'
          | 'MULTIPLE_CHOICE'
          | 'CHECKBOX'
          | 'SHORT_ANSWER'
          | 'SORTING'
          | 'FILL_IN_BLANK'
          | 'DIAGRAM'
          | 'MATCHING'
          | 'NUMERIC'
          | undefined,
        sortBy: sortBy as 'newest' | 'oldest' | 'difficulty' | 'type',
      });

      if (result.data?.success && result.data.questions) {
        const processedQuestions = result.data.questions.map((q: any) => ({
          ...q,
          hint: q.hint || undefined,
          explanation: q.explanation || undefined,
          createdBy: {
            name: q.createdBy.name || 'Unknown',
          },
          tags: q.tags.map((tagItem: any) => ({
            tag: {
              ...tagItem.tag,
              color: tagItem.tag.color || undefined,
            },
          })),
        }));
        setQuestions(processedQuestions);
      }
    } catch (error) {
      console.error('Failed to load questions:', error);
      toast.error(t('errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadQuestions();
  };

  const filteredQuestions = questions.filter(question => {
    if (
      searchQuery &&
      !question.text.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const getQuestionIcon = (type: string) => {
    switch (type) {
      case 'TRUE_FALSE':
        return <CheckCircle className="h-4 w-4" />;
      case 'MULTIPLE_CHOICE':
        return <Square className="h-4 w-4" />;
      case 'CHECKBOX':
        return <List className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return 'bg-green-100 text-green-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'HARD':
        return 'bg-red-100 text-red-800';
      case 'EXPERT':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <Input
              placeholder={t('search.placeholder')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSearch()}
              className="w-80 pl-10"
            />
          </div>
          <Button onClick={handleSearch} variant="outline" size="sm">
            <Search className="mr-2 h-4 w-4" />
            {t('search.button')}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsAIGeneratorOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600"
          >
            <Brain className="mr-2 h-4 w-4" />
            {t('actions.generateWithAI')}
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('actions.create')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t('filters.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                {t('filters.category')}
              </label>
              <CategoryFilter
                value={selectedCategory}
                onChange={setSelectedCategory}
                placeholder={t('filters.categoryPlaceholder')}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                {t('filters.difficulty')}
              </label>
              <Select
                value={selectedDifficulty}
                onValueChange={setSelectedDifficulty}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t('filters.difficultyPlaceholder')}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('filters.all')}</SelectItem>
                  <SelectItem value="EASY">{t('difficulty.easy')}</SelectItem>
                  <SelectItem value="MEDIUM">
                    {t('difficulty.medium')}
                  </SelectItem>
                  <SelectItem value="HARD">{t('difficulty.hard')}</SelectItem>
                  <SelectItem value="EXPERT">
                    {t('difficulty.expert')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                {t('filters.type')}
              </label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder={t('filters.typePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('filters.all')}</SelectItem>
                  <SelectItem value="TRUE_FALSE">
                    {t('types.trueFalse')}
                  </SelectItem>
                  <SelectItem value="MULTIPLE_CHOICE">
                    {t('types.multipleChoice')}
                  </SelectItem>
                  <SelectItem value="CHECKBOX">
                    {t('types.checkbox')}
                  </SelectItem>
                  <SelectItem value="SHORT_ANSWER">
                    {t('types.shortAnswer')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                {t('filters.sortBy')}
              </label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{t('sort.newest')}</SelectItem>
                  <SelectItem value="oldest">{t('sort.oldest')}</SelectItem>
                  <SelectItem value="difficulty">
                    {t('sort.difficulty')}
                  </SelectItem>
                  <SelectItem value="type">{t('sort.type')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            {t('results.found', { count: filteredQuestions.length })}
          </p>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {t('results.total', { count: questions.length })}
            </Badge>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="h-5 w-3/4 rounded bg-gray-200" />
                    <div className="h-4 w-1/2 rounded bg-gray-200" />
                    <div className="flex gap-2">
                      <div className="h-5 w-12 rounded bg-gray-200" />
                      <div className="h-5 w-16 rounded bg-gray-200" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredQuestions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                {t('empty.title')}
              </h3>
              <p className="mb-4 text-gray-500">{t('empty.description')}</p>
              <div className="flex justify-center gap-2">
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('empty.createFirst')}
                </Button>
                <Button
                  onClick={() => setIsAIGeneratorOpen(true)}
                  variant="outline"
                >
                  <Brain className="mr-2 h-4 w-4" />
                  {t('empty.generateWithAI')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredQuestions.map(question => (
              <QuestionCard
                key={question.id}
                question={question}
                onEdit={() => {}}
                onDelete={() => {}}
                onAddToQuiz={() => {}}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateQuestionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          loadQuestions();
        }}
      />

      <AIQuestionGenerator
        isOpen={isAIGeneratorOpen}
        onClose={() => setIsAIGeneratorOpen(false)}
        onSuccess={() => {
          setIsAIGeneratorOpen(false);
          loadQuestions();
        }}
      />
    </div>
  );
}
