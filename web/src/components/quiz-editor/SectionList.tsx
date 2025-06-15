'use client';

import { useState } from 'react';
import {
  Plus,
  GripVertical,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import { SectionForm } from './SectionForm';
import { deleteSection, reorderSections } from '@/lib/actions/section';
import type { Section, Question } from '@prisma/client';

interface SectionWithQuestions extends Section {
  questions: Pick<Question, 'id' | 'text' | 'type' | 'points' | 'order'>[];
}

interface SectionListProps {
  quizId: string;
  sections: SectionWithQuestions[];
  onSectionUpdated: () => void;
}

interface SortableSectionItemProps {
  section: SectionWithQuestions;
  onEdit: (section: SectionWithQuestions) => void;
  onDelete: (sectionId: string) => void;
}

function SortableSectionItem({
  section,
  onEdit,
  onDelete,
}: SortableSectionItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? 'opacity-50' : ''}`}
    >
      <Card className="p-4">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center gap-3">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab rounded p-1 hover:bg-gray-100 active:cursor-grabbing"
              >
                <GripVertical className="h-4 w-4 text-gray-500" />
              </div>

              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-auto p-0">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>

              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{section.title}</h3>
                {section.description && (
                  <p className="mt-1 text-sm text-gray-600">
                    {section.description}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="secondary">
                    {section.questions.length} 問題
                  </Badge>
                  <span className="text-xs text-gray-500">
                    順序: {section.order}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => onEdit(section)}>
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(section.id)}
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <CollapsibleContent className="mt-4">
            {section.questions.length > 0 ? (
              <div className="space-y-2">
                {section.questions.map(question => (
                  <div
                    key={question.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {question.text.substring(0, 100)}
                        {question.text.length > 100 && '...'}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {question.type}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {question.points}点
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">
                このセクションには問題がありません
              </p>
            )}
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}

export function SectionList({
  quizId,
  sections,
  onSectionUpdated,
}: SectionListProps) {
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [editingSection, setEditingSection] =
    useState<SectionWithQuestions | null>(null);
  const [deletingSection, setDeletingSection] = useState<string | null>(null);
  const [localSections, setLocalSections] = useState(sections);

  const { execute: executeDeleteSection, isExecuting: isDeleting } = useAction(
    deleteSection,
    {
      onSuccess: () => {
        toast.success('セクションを削除しました');
        setDeletingSection(null);
        onSectionUpdated();
      },
      onError: ({ error }) => {
        toast.error(error.serverError || 'セクションの削除に失敗しました');
      },
    }
  );

  const { execute: executeReorderSections } = useAction(reorderSections, {
    onSuccess: () => {
      toast.success('セクションの順序を変更しました');
      onSectionUpdated();
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'セクションの順序変更に失敗しました');
      // エラー時は元の順序に戻す
      setLocalSections(sections);
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localSections.findIndex(
        section => section.id === active.id
      );
      const newIndex = localSections.findIndex(
        section => section.id === over.id
      );

      const newSections = arrayMove(localSections, oldIndex, newIndex);
      setLocalSections(newSections);

      // サーバーに順序変更を送信
      executeReorderSections({
        quizId,
        sectionIds: newSections.map(section => section.id),
      });
    }
  };

  const handleDelete = (sectionId: string) => {
    executeDeleteSection({ id: sectionId });
  };

  const handleFormSuccess = () => {
    setIsCreateFormOpen(false);
    setEditingSection(null);
    onSectionUpdated();
  };

  // sections が変更されたら localSections も更新
  if (sections !== localSections && sections.length !== localSections.length) {
    setLocalSections(sections);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">セクション管理</h2>
        <Button onClick={() => setIsCreateFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          セクション追加
        </Button>
      </div>

      {localSections.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localSections.map(section => section.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {localSections.map(section => (
                <SortableSectionItem
                  key={section.id}
                  section={section}
                  onEdit={setEditingSection}
                  onDelete={setDeletingSection}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <Card className="p-8 text-center">
          <p className="mb-4 text-gray-500">まだセクションがありません</p>
          <Button onClick={() => setIsCreateFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            最初のセクションを作成
          </Button>
        </Card>
      )}

      {/* セクション作成フォーム */}
      <SectionForm
        open={isCreateFormOpen}
        onOpenChange={setIsCreateFormOpen}
        quizId={quizId}
        onSuccess={handleFormSuccess}
      />

      {/* セクション編集フォーム */}
      {editingSection && (
        <SectionForm
          open={!!editingSection}
          onOpenChange={open => !open && setEditingSection(null)}
          quizId={quizId}
          section={editingSection}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* セクション削除確認ダイアログ */}
      <AlertDialog
        open={!!deletingSection}
        onOpenChange={open => !open && setDeletingSection(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>セクションを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。セクション内の問題は削除されずに、セクションなしの状態になります。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingSection && handleDelete(deletingSection)}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
