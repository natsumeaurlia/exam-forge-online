'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Tag, Check, X, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  questionCount?: number;
}

interface CategoryFilterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  allowCreate?: boolean;
  multiple?: boolean;
}

export function CategoryFilter({
  value,
  onChange,
  placeholder = 'Select category...',
  allowCreate = false,
  multiple = false,
}: CategoryFilterProps) {
  const t = useTranslations('questionBank');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);

      // Mock categories - In real implementation, this would fetch from API
      const mockCategories: Category[] = [
        {
          id: '1',
          name: '数学',
          description: 'Mathematics questions',
          color: '#3B82F6',
          questionCount: 25,
        },
        {
          id: '2',
          name: '科学',
          description: 'Science questions',
          color: '#10B981',
          questionCount: 18,
        },
        {
          id: '3',
          name: '歴史',
          description: 'History questions',
          color: '#F59E0B',
          questionCount: 12,
        },
        {
          id: '4',
          name: '言語',
          description: 'Language questions',
          color: '#8B5CF6',
          questionCount: 30,
        },
        {
          id: '5',
          name: '技術',
          description: 'Technology questions',
          color: '#EF4444',
          questionCount: 22,
        },
      ];

      setCategories(mockCategories);
    } catch (error) {
      console.error('Failed to load categories:', error);
      toast.error(t('category.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error(t('category.validation.nameRequired'));
      return;
    }

    try {
      setCreating(true);

      // Mock category creation - In real implementation, this would call an API
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newCategory: Category = {
        id: Date.now().toString(),
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || undefined,
        color: newCategoryColor,
        questionCount: 0,
      };

      setCategories(prev => [...prev, newCategory]);
      onChange(newCategory.id);

      // Reset form
      setNewCategoryName('');
      setNewCategoryDescription('');
      setNewCategoryColor('#3B82F6');
      setIsCreateDialogOpen(false);

      toast.success(t('category.createSuccess'));
    } catch (error) {
      console.error('Failed to create category:', error);
      toast.error(t('category.createError'));
    } finally {
      setCreating(false);
    }
  };

  const selectedCategory = categories.find(cat => cat.id === value);
  const colorOptions = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#EF4444', // Red
    '#F97316', // Orange
    '#84CC16', // Lime
    '#06B6D4', // Cyan
    '#EC4899', // Pink
    '#6B7280', // Gray
  ];

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger>
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-gray-500">Loading categories...</span>
          </div>
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder}>
            {selectedCategory && (
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 flex-shrink-0 rounded-full"
                  style={{
                    backgroundColor: selectedCategory.color || '#3B82F6',
                  }}
                />
                <span>{selectedCategory.name}</span>
                {selectedCategory.questionCount !== undefined && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {selectedCategory.questionCount}
                  </Badge>
                )}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">{t('filters.all')}</SelectItem>
          {categories.map(category => (
            <SelectItem key={category.id} value={category.id}>
              <div className="flex w-full items-center gap-2">
                <div
                  className="h-3 w-3 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: category.color || '#3B82F6' }}
                />
                <span className="flex-1">{category.name}</span>
                {category.questionCount !== undefined && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {category.questionCount}
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}

          {allowCreate && (
            <>
              <div className="px-2 py-1">
                <div className="border-t" />
              </div>
              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <div className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-gray-100">
                    <Plus className="h-4 w-4" />
                    {t('category.create')}
                  </div>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Tag className="h-5 w-5" />
                      {t('category.createTitle')}
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="category-name">
                        {t('category.name')} *
                      </Label>
                      <Input
                        id="category-name"
                        placeholder={t('category.namePlaceholder')}
                        value={newCategoryName}
                        onChange={e => setNewCategoryName(e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="category-description">
                        {t('category.description')}
                      </Label>
                      <Input
                        id="category-description"
                        placeholder={t('category.descriptionPlaceholder')}
                        value={newCategoryDescription}
                        onChange={e =>
                          setNewCategoryDescription(e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>{t('category.color')}</Label>
                      <div className="mt-2 grid grid-cols-5 gap-2">
                        {colorOptions.map(color => (
                          <button
                            key={color}
                            type="button"
                            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                              newCategoryColor === color
                                ? 'border-gray-900'
                                : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setNewCategoryColor(color)}
                          >
                            {newCategoryColor === color && (
                              <Check className="h-4 w-4 text-white" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                        disabled={creating}
                      >
                        <X className="mr-2 h-4 w-4" />
                        {t('category.cancel')}
                      </Button>
                      <Button
                        type="button"
                        onClick={handleCreateCategory}
                        disabled={creating || !newCategoryName.trim()}
                      >
                        {creating ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="mr-2 h-4 w-4" />
                        )}
                        {creating
                          ? t('category.creating')
                          : t('category.create')}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </SelectContent>
      </Select>

      {/* Selected category display for multiple selection */}
      {multiple && selectedCategory && (
        <div className="flex flex-wrap gap-1">
          <Badge
            variant="secondary"
            className="flex items-center gap-1"
            style={{
              borderColor: selectedCategory.color,
              color: selectedCategory.color,
            }}
          >
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: selectedCategory.color }}
            />
            {selectedCategory.name}
            <button
              type="button"
              onClick={() => onChange('')}
              className="ml-1 rounded-full p-0.5 hover:bg-gray-200"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        </div>
      )}
    </div>
  );
}
