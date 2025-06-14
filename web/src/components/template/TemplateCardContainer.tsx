'use client';

import { useState } from 'react';
import { TemplateCardPresentation } from './TemplateCardPresentation';
import { TemplateCardDeleteDialog } from './ui/TemplateCardDeleteDialog';
import { useTemplateCardActions } from './hooks/useTemplateCardActions';
import type { TemplateListItem } from '@/types/template';

interface TemplateCardContainerProps {
  template: TemplateListItem & { lng?: string };
  lng?: string;
}

export function TemplateCardContainer({
  template,
  lng = 'ja',
}: TemplateCardContainerProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const actions = useTemplateCardActions(template.id, lng);

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    actions.handleDelete();
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <TemplateCardPresentation
        title={template.title}
        description={template.description}
        category={template.category}
        isPublic={template.isPublic}
        usageCount={template.usageCount}
        tags={template.tags?.map(tt => tt.tag) || []}
        updatedAt={template.updatedAt}
        createdBy={template.createdBy}
        thumbnail={template.thumbnail}
        onPreview={actions.handlePreview}
        onEdit={actions.handleEdit}
        onDuplicate={actions.handleDuplicate}
        onCreateQuiz={actions.handleCreateQuiz}
        onDelete={handleDelete}
      />
      <TemplateCardDeleteDialog
        template={template}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        isDeleting={actions.isDeleting}
      />
    </>
  );
}
