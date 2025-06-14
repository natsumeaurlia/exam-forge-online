'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Plus,
  CheckCircle,
  Circle,
  Square,
  List,
  FileText,
  Brain,
  User,
  Calendar,
  Tag,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

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

interface QuestionCardProps {
  question: BankQuestion;
  onEdit: (questionId: string) => void;
  onDelete: (questionId: string) => void;
  onAddToQuiz: (questionId: string) => void;
}

export function QuestionCard({
  question,
  onEdit,
  onDelete,
  onAddToQuiz,
}: QuestionCardProps) {
  const t = useTranslations('questionBank');
  const [isExpanded, setIsExpanded] = useState(false);

  const getQuestionIcon = (type: string) => {
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

  const getDifficultyColor = (difficulty: string) => {
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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'TRUE_FALSE':
        return t('types.trueFalse');
      case 'MULTIPLE_CHOICE':
        return t('types.multipleChoice');
      case 'CHECKBOX':
        return t('types.checkbox');
      case 'SHORT_ANSWER':
        return t('types.shortAnswer');
      default:
        return type;
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return t('difficulty.easy');
      case 'MEDIUM':
        return t('difficulty.medium');
      case 'HARD':
        return t('difficulty.hard');
      case 'EXPERT':
        return t('difficulty.expert');
      default:
        return difficulty;
    }
  };

  const handleCopyQuestion = () => {
    navigator.clipboard.writeText(question.text);
    toast.success(t('actions.copySuccess'));
  };

  const correctOptionsCount =
    question.options?.filter(opt => opt.isCorrect).length || 0;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 text-gray-600">
                {getQuestionIcon(question.type)}
                <span className="text-sm font-medium">
                  {getTypeLabel(question.type)}
                </span>
              </div>
              <Badge
                className={`text-xs ${getDifficultyColor(question.difficulty)}`}
              >
                {getDifficultyLabel(question.difficulty)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {question.points} {t('points')}
              </Badge>
              {question.aiGenerated && (
                <Badge className="border-purple-200 bg-purple-100 text-xs text-purple-800">
                  <Brain className="mr-1 h-3 w-3" />
                  AI
                </Badge>
              )}
            </div>

            <p className="line-clamp-2 text-sm font-medium text-gray-900">
              {question.text}
            </p>

            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {question.createdBy.name}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(question.createdAt).toLocaleDateString()}
              </div>
              {question.options && question.options.length > 0 && (
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {correctOptionsCount}/{question.options.length}{' '}
                  {t('correctOptions')}
                </div>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsExpanded(!isExpanded)}>
                <FileText className="mr-2 h-4 w-4" />
                {isExpanded ? t('actions.collapse') : t('actions.expand')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddToQuiz(question.id)}>
                <Plus className="mr-2 h-4 w-4" />
                {t('actions.addToQuiz')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyQuestion}>
                <Copy className="mr-2 h-4 w-4" />
                {t('actions.copy')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit(question.id)}>
                <Edit className="mr-2 h-4 w-4" />
                {t('actions.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(question.id)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('actions.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4 pt-0">
          {/* Options */}
          {question.options && question.options.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">
                {t('options')}
              </h4>
              <div className="space-y-1">
                {question.options.map((option, index) => (
                  <div
                    key={option.id}
                    className={`flex items-center gap-2 rounded p-2 text-sm ${
                      option.isCorrect
                        ? 'border border-green-200 bg-green-50 text-green-800'
                        : 'border border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-xs font-medium">
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="flex-1">{option.text}</span>
                    {option.isCorrect && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hint */}
          {question.hint && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">{t('hint')}</h4>
              <p className="rounded border border-blue-200 bg-blue-50 p-3 text-sm text-gray-600">
                {question.hint}
              </p>
            </div>
          )}

          {/* Explanation */}
          {question.explanation && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">
                {t('explanation')}
              </h4>
              <p className="rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
                {question.explanation}
              </p>
            </div>
          )}

          {/* Tags and Categories */}
          <div className="flex flex-wrap gap-2">
            {question.categories.map(({ category }) => (
              <Badge key={category.id} variant="secondary" className="text-xs">
                <Tag className="mr-1 h-3 w-3" />
                {category.name}
              </Badge>
            ))}
            {question.tags.map(({ tag }) => (
              <Badge
                key={tag.id}
                variant="outline"
                className="text-xs"
                style={{
                  borderColor: tag.color || undefined,
                  color: tag.color || undefined,
                }}
              >
                #{tag.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
