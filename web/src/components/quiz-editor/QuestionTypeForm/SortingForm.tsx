'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, X, Trash2, GripVertical } from 'lucide-react';

interface SortingItem {
  id: string;
  text: string;
  order: number;
}

interface SortingFormProps {
  question: {
    text: string;
    items?: SortingItem[];
    points: number;
    hint?: string;
    explanation?: string;
  };
  isAutoGrading: boolean;
  onChange: (updates: Partial<SortingFormProps['question']>) => void;
}

export function SortingForm({
  question,
  isAutoGrading,
  onChange,
}: SortingFormProps) {
  const t = useTranslations('quizManagement.editor.questionTypes.ordering');
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  const items = question.items || [
    { id: '1', text: '', order: 1 },
    { id: '2', text: '', order: 2 },
    { id: '3', text: '', order: 3 },
  ];

  const addItem = () => {
    const newItem: SortingItem = {
      id: Date.now().toString(),
      text: '',
      order: items.length + 1,
    };
    onChange({ items: [...items, newItem] });
  };

  const updateItem = (index: number, text: string) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], text };
    onChange({ items: updatedItems });
  };

  const deleteItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    // 順序を再計算
    const reorderedItems = updatedItems.map((item, i) => ({
      ...item,
      order: i + 1,
    }));
    onChange({ items: reorderedItems });
  };

  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === dropIndex) return;

    const updatedItems = [...items];
    const [movedItem] = updatedItems.splice(draggedItem, 1);
    updatedItems.splice(dropIndex, 0, movedItem);

    // 順序を再計算
    const reorderedItems = updatedItems.map((item, i) => ({
      ...item,
      order: i + 1,
    }));

    onChange({ items: reorderedItems });
    setDraggedItem(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="question-text">{t('questionText')}</Label>
        <Textarea
          id="question-text"
          value={question.text}
          onChange={e => onChange({ text: e.target.value })}
          placeholder={t('questionPlaceholder')}
          className="mt-1"
          rows={3}
        />
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="mb-3 flex items-center justify-between">
            <Label>{t('sortItems')}</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={addItem}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {t('addItem')}
            </Button>
          </div>

          <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={e => handleDrop(e, index)}
                className="flex cursor-move items-center gap-2 rounded-lg border p-2 hover:bg-gray-50"
              >
                <GripVertical className="h-4 w-4 text-gray-400" />
                <span className="w-8 text-sm font-medium text-gray-600">
                  {index + 1}.
                </span>
                <Input
                  value={item.text}
                  onChange={e => updateItem(index, e.target.value)}
                  placeholder={t('itemPlaceholder')}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteItem(index)}
                  disabled={items.length <= 2}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <p className="mt-2 text-sm text-gray-500">{t('sortingHint')}</p>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Label htmlFor="points">{t('points')}</Label>
          <Input
            id="points"
            type="number"
            value={question.points}
            onChange={e => onChange({ points: parseInt(e.target.value) || 0 })}
            className="mt-1 w-24"
            min={0}
          />
        </div>
      </div>

      {/* ヒントセクション */}
      <div>
        {question.hint !== undefined ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="hint">{t('hint')}</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange({ hint: undefined })}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              id="hint"
              value={question.hint || ''}
              onChange={e => onChange({ hint: e.target.value })}
              placeholder={t('hintPlaceholder')}
              rows={2}
            />
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange({ hint: '' })}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t('addHint')}
          </Button>
        )}
      </div>

      {/* 解説セクション */}
      <div>
        {question.explanation !== undefined ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="explanation">{t('explanation')}</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange({ explanation: undefined })}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              id="explanation"
              value={question.explanation || ''}
              onChange={e => onChange({ explanation: e.target.value })}
              placeholder={t('explanationPlaceholder')}
              rows={3}
            />
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange({ explanation: '' })}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t('addExplanation')}
          </Button>
        )}
      </div>
    </div>
  );
}
