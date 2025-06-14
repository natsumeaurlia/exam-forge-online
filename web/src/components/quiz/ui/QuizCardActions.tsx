'use client';

import { useTranslations } from 'next-intl';
import {
  MoreVertical,
  Eye,
  Edit,
  Share2,
  Copy,
  BarChart,
  Trash2,
  Play,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface QuizCardActionsProps {
  onPreview: () => void;
  onEdit: () => void;
  onShare: () => void;
  onCopy: () => void;
  onAnalytics: () => void;
  onDelete: () => void;
  onTakeQuiz: () => void;
}

export function QuizCardActions({
  onPreview,
  onEdit,
  onShare,
  onCopy,
  onAnalytics,
  onDelete,
  onTakeQuiz,
}: QuizCardActionsProps) {
  const t = useTranslations('quizManagement.cardActions');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">{t('openMenu')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem onClick={onPreview}>
          <Eye className="mr-2 h-4 w-4" />
          {t('preview')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onTakeQuiz}>
          <Play className="mr-2 h-4 w-4" />
          {t('takeQuiz')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>
          <Edit className="mr-2 h-4 w-4" />
          {t('edit')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onShare}>
          <Share2 className="mr-2 h-4 w-4" />
          {t('share')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onCopy}>
          <Copy className="mr-2 h-4 w-4" />
          {t('duplicate')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onAnalytics}>
          <BarChart className="mr-2 h-4 w-4" />
          {t('analytics')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onDelete}
          className="text-red-600 focus:bg-red-50 focus:text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {t('delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
