'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuizEditorStore } from '@/stores/useQuizEditorStore';
import { useTranslations } from 'next-intl';
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Trash2,
  GripVertical,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { QuestionEditForm } from './QuestionEditForm';
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

// Sortable Question Item Component
function SortableQuestionItem({
  question,
  index,
  isExpanded,
  onToggleExpanded,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  isCurrentQuestion,
}: {
  question: any;
  index: number;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  isCurrentQuestion: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const t = useTranslations('quizManagement.editor.questions');

  return (
    <Card
      ref={setNodeRef}
      style={style}
      id={`question-${index}`}
      className={`transition-all ${
        isCurrentQuestion ? 'ring-2 ring-blue-500' : ''
      } ${isDragging ? 'z-50' : ''}`}
    >
      <div
        className="flex cursor-pointer items-start justify-between p-4 hover:bg-gray-50"
        onClick={onToggleExpanded}
      >
        <div className="flex flex-1 items-start gap-3">
          <div
            {...attributes}
            {...listeners}
            className="mt-0.5 cursor-grab touch-none"
          >
            <GripVertical className="h-5 w-5 text-gray-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500">
                {t('questionNumber', { number: index + 1 })}
              </span>
              <span className="text-xs text-gray-400">
                {question.type.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="mt-1 line-clamp-2 text-sm">
              {question.text || t('noQuestionText')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {question.points} {t('pointsLabel')}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={e => {
                e.stopPropagation();
                onMoveUp();
              }}
              disabled={isFirst}
              title={t('moveUp')}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={e => {
                e.stopPropagation();
                onMoveDown();
              }}
              disabled={isLast}
              title={t('moveDown')}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={e => {
                e.stopPropagation();
                onDuplicate();
              }}
              title={t('duplicate')}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={e => {
                e.stopPropagation();
                onDelete();
              }}
              title={t('delete')}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </div>
      </div>
      {isExpanded && (
        <div className="border-t px-4 py-4">
          <QuestionEditForm questionIndex={index} />
        </div>
      )}
    </Card>
  );
}

export function QuestionList() {
  const {
    questions,
    currentQuestionIndex,
    setCurrentQuestion,
    deleteQuestion,
    duplicateQuestion,
    reorderQuestions,
  } = useQuizEditorStore();
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(
    new Set()
  );
  const t = useTranslations('quizManagement.editor.questions');

  // Setup DnD sensors - must be called before any conditional returns
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Auto-expand new questions
  useEffect(() => {
    if (
      currentQuestionIndex !== null &&
      !expandedQuestions.has(currentQuestionIndex)
    ) {
      setExpandedQuestions(
        prev => new Set(Array.from(prev).concat(currentQuestionIndex))
      );
    }
  }, [currentQuestionIndex]);

  if (!questions || questions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">{t('empty')}</p>
      </Card>
    );
  }

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedQuestions(newExpanded);
    setCurrentQuestion(index);
  };

  const handleDelete = (index: number) => {
    deleteQuestion(index);
    // 展開状態をリセット
    const newExpanded = new Set(expandedQuestions);
    newExpanded.delete(index);
    setExpandedQuestions(newExpanded);
  };

  const handleDuplicate = (index: number) => {
    duplicateQuestion(index);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = questions.findIndex(q => q.id === active.id);
      const newIndex = questions.findIndex(q => q.id === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(questions, oldIndex, newIndex);
        reorderQuestions(newOrder.map(q => q.id));
      }
    }
  };

  const moveQuestion = (fromIndex: number, toIndex: number) => {
    if (toIndex >= 0 && toIndex < questions.length) {
      const newOrder = arrayMove(questions, fromIndex, toIndex);
      reorderQuestions(newOrder.map(q => q.id));
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={questions.map(q => q.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4">
          {questions.map((question, index) => (
            <SortableQuestionItem
              key={question.id}
              question={question}
              index={index}
              isExpanded={expandedQuestions.has(index)}
              onToggleExpanded={() => toggleExpanded(index)}
              onDelete={() => handleDelete(index)}
              onDuplicate={() => handleDuplicate(index)}
              onMoveUp={() => moveQuestion(index, index - 1)}
              onMoveDown={() => moveQuestion(index, index + 1)}
              isFirst={index === 0}
              isLast={index === questions.length - 1}
              isCurrentQuestion={currentQuestionIndex === index}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
