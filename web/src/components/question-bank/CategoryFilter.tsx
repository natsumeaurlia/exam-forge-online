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
import { getCategories, createCategory } from '@/lib/actions/category';

interface Category {
  id: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
  order: number;
  teamId: string;
  createdAt: Date;
  updatedAt: Date;
  children?: Category[];
  parent?: Category | null;
  _count?: {
    bankQuestionCategories: number;
  };
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
  const [parentId, setParentId] = useState<string>('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);

      const result = await getCategories({ includeChildren: true });
      if (result?.data?.categories) {
        setCategories(result.data.categories);
      }
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

      const result = await createCategory({
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || undefined,
        parentId: parentId || undefined,
      });

      if (result?.data?.category) {
        // Reload categories to get updated list
        await loadCategories();
        onChange(result.data.category.id);

        // Reset form
        setNewCategoryName('');
        setNewCategoryDescription('');
        setParentId('');
        setIsCreateDialogOpen(false);

        toast.success(t('category.createSuccess'));
      }
    } catch (error) {
      console.error('Failed to create category:', error);
      toast.error(t('category.createError'));
    } finally {
      setCreating(false);
    }
  };

  const selectedCategory = categories.find(cat => cat.id === value);

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
                <Tag className="h-4 w-4 text-gray-500" />
                <span>{selectedCategory.name}</span>
                {selectedCategory._count?.bankQuestionCategories !==
                  undefined && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {selectedCategory._count.bankQuestionCategories}
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
                <Tag className="h-3 w-3 text-gray-500" />
                <span className="flex-1">{category.name}</span>
                {category._count?.bankQuestionCategories !== undefined && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {category._count.bankQuestionCategories}
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
                      <Label htmlFor="parent-category">
                        {t('category.parent')}
                      </Label>
                      <Select value={parentId} onValueChange={setParentId}>
                        <SelectTrigger className="mt-1">
                          <SelectValue
                            placeholder={t('category.selectParent')}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">
                            {t('category.noParent')}
                          </SelectItem>
                          {categories
                            .filter(cat => !cat.parentId) // Only show root categories as potential parents
                            .map(category => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
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
          <Badge variant="secondary" className="flex items-center gap-1">
            <Tag className="h-3 w-3" />
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
