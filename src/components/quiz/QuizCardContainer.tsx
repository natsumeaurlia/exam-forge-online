'use client';

import { useState } from 'react';
import { QuizCardPresentation } from './QuizCardPresentation';
import { QuizCardDeleteDialog } from './ui/QuizCardDeleteDialog';
import { useQuizCardActions } from './hooks/useQuizCardActions';
import type { QuizListItem } from '@/types/quiz';

interface QuizCardContainerProps {
  quiz: QuizListItem & { lng?: string };
  lng?: string;
}

export function QuizCardContainer({
  quiz,
  lng = 'ja',
}: QuizCardContainerProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const actions = useQuizCardActions(quiz.id, lng);

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    actions.handleDelete();
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <QuizCardPresentation
        title={quiz.title}
        description={quiz.description}
        status={quiz.status}
        questionsCount={quiz._count?.questions || 0}
        responsesCount={quiz._count?.responses || 0}
        tags={quiz.tags?.map(qt => qt.tag) || []}
        updatedAt={quiz.updatedAt}
        onPreview={actions.handlePreview}
        onEdit={actions.handleEdit}
        onShare={actions.handleShare}
        onCopy={actions.handleCopy}
        onAnalytics={actions.handleAnalytics}
        onDelete={handleDelete}
      />
      <QuizCardDeleteDialog
        quiz={quiz}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        isDeleting={actions.isDeleting}
      />
    </>
  );
}
