'use client';

import { useTranslations } from 'next-intl';
import { MoreVertical, Eye, Edit, Copy, Plus, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface TemplateCardActionsProps {
  onPreview: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onCreateQuiz: () => void;
  onDelete: () => void;
}

export function TemplateCardActions({
  onPreview,
  onEdit,
  onDuplicate,
  onCreateQuiz,
  onDelete,
}: TemplateCardActionsProps) {
  const t = useTranslations('templateManagement.cardActions');

  const handleClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">{t('openMenu')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem onClick={e => handleClick(e, onPreview)}>
          <Eye className="mr-2 h-4 w-4" />
          {t('preview')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={e => handleClick(e, onCreateQuiz)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('createQuiz')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={e => handleClick(e, onEdit)}>
          <Edit className="mr-2 h-4 w-4" />
          {t('edit')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={e => handleClick(e, onDuplicate)}>
          <Copy className="mr-2 h-4 w-4" />
          {t('duplicate')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={e => handleClick(e, onDelete)}
          className="text-red-600 focus:bg-red-50 focus:text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {t('delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
