'use client';

import { useTranslations } from 'next-intl';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { QuizListItem } from '@/types/quiz';

interface QuizCardDeleteDialogProps {
  quiz: QuizListItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function QuizCardDeleteDialog({
  quiz,
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
}: QuizCardDeleteDialogProps) {
  const t = useTranslations('quizManagement.deleteDialog');

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('title')}</AlertDialogTitle>
          <AlertDialogDescription>
            「{quiz.title}」{t('description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {t('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {isDeleting ? t('deleting') : t('deleteButton')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
