'use client';

import React, { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Plus,
  FolderOpen,
  Folder,
  MoreVertical,
  Edit,
  Trash2,
  Move,
  ChevronRight,
  Settings,
  Hash,
} from 'lucide-react';
import {
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} from '@/lib/actions/category';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
  order: number;
  questionCount: number;
  children: Category[];
  createdAt: Date;
  updatedAt: Date;
}

interface Team {
  id: string;
  name: string;
  userRole: string;
  subscription?: {
    plan: {
      name: string;
      type: string;
    };
  } | null;
}

interface CategoryManagementClientProps {
  lng: string;
  team: Team;
  categories: Category[];
  hasAdminAccess: boolean;
}

export function CategoryManagementClient({
  lng,
  team,
  categories: initialCategories,
  hasAdminAccess,
}: CategoryManagementClientProps) {
  const t = useTranslations('dashboard.categories');
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null
  );
  const [isPending, startTransition] = useTransition();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: '',
  });

  // Server actions
  const { execute: executeCreate, isExecuting: isCreating } = useAction(
    createCategory,
    {
      onSuccess: ({ data }) => {
        if (data?.success) {
          toast.success(t('messages.categoryCreated'));
          setIsCreateDialogOpen(false);
          resetForm();
          // Refresh categories
          window.location.reload();
        }
      },
      onError: ({ error }) => {
        toast.error(error.serverError || t('messages.createError'));
      },
    }
  );

  const { execute: executeUpdate, isExecuting: isUpdating } = useAction(
    updateCategory,
    {
      onSuccess: ({ data }) => {
        if (data?.success) {
          toast.success(t('messages.categoryUpdated'));
          setIsEditDialogOpen(false);
          setEditingCategory(null);
          resetForm();
          // Refresh categories
          window.location.reload();
        }
      },
      onError: ({ error }) => {
        toast.error(error.serverError || t('messages.updateError'));
      },
    }
  );

  const { execute: executeDelete, isExecuting: isDeleting } = useAction(
    deleteCategory,
    {
      onSuccess: ({ data }) => {
        if (data?.success) {
          toast.success(t('messages.categoryDeleted'));
          setIsDeleteDialogOpen(false);
          setDeletingCategory(null);
          // Refresh categories
          window.location.reload();
        }
      },
      onError: ({ error }) => {
        toast.error(error.serverError || t('messages.deleteError'));
      },
    }
  );

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      parentId: '',
    });
  };

  const handleCreate = () => {
    executeCreate({
      name: formData.name,
      description: formData.description || undefined,
      parentId: formData.parentId || undefined,
      teamId: team.id,
    });
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      parentId: category.parentId || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingCategory) return;

    executeUpdate({
      id: editingCategory.id,
      name: formData.name,
      description: formData.description || undefined,
      parentId: formData.parentId || undefined,
    });
  };

  const handleDelete = (category: Category) => {
    setDeletingCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!deletingCategory) return;
    executeDelete({ id: deletingCategory.id });
  };

  // Get flat list of categories for parent selection
  const getFlatCategories = (
    cats: Category[],
    level = 0
  ): Array<{ category: Category; level: number }> => {
    const result: Array<{ category: Category; level: number }> = [];

    cats.forEach(cat => {
      result.push({ category: cat, level });
      if (cat.children.length > 0) {
        result.push(...getFlatCategories(cat.children, level + 1));
      }
    });

    return result;
  };

  const flatCategories = getFlatCategories(categories);

  // Render category tree
  const renderCategory = (category: Category, level = 0) => {
    const hasChildren = category.children.length > 0;

    return (
      <div key={category.id} className="space-y-2">
        <Card className="relative">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  style={{ marginLeft: `${level * 20}px` }}
                  className="flex items-center gap-2"
                >
                  {hasChildren ? (
                    <FolderOpen className="h-4 w-4 text-amber-500" />
                  ) : (
                    <Folder className="h-4 w-4 text-blue-500" />
                  )}
                  <div>
                    <h3 className="font-medium">{category.name}</h3>
                    {category.description && (
                      <p className="text-muted-foreground text-sm">
                        {category.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  <Hash className="mr-1 h-3 w-3" />
                  {category.questionCount}
                </Badge>

                {hasAdminAccess && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(category)}>
                        <Edit className="mr-2 h-4 w-4" />
                        {t('actions.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(category)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t('actions.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Render children */}
        {hasChildren && (
          <div className="space-y-2">
            {category.children.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>

        {hasAdminAccess && (
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t('actions.createCategory')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('dialogs.create.title')}</DialogTitle>
                <DialogDescription>
                  {t('dialogs.create.description')}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">{t('fields.name')}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, name: e.target.value }))
                    }
                    placeholder={t('placeholders.name')}
                  />
                </div>

                <div>
                  <Label htmlFor="description">{t('fields.description')}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder={t('placeholders.description')}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="parent">{t('fields.parentCategory')}</Label>
                  <Select
                    value={formData.parentId}
                    onValueChange={value =>
                      setFormData(prev => ({ ...prev, parentId: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t('placeholders.parentCategory')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">{t('options.noParent')}</SelectItem>
                      {flatCategories.map(({ category, level }) => (
                        <SelectItem key={category.id} value={category.id}>
                          {'—'.repeat(level)} {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  {t('actions.cancel')}
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={isCreating || !formData.name.trim()}
                >
                  {isCreating ? t('actions.creating') : t('actions.create')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Categories */}
      <div className="space-y-4">
        {categories.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Folder className="text-muted-foreground mx-auto h-12 w-12" />
              <h3 className="mt-4 text-lg font-medium">{t('empty.title')}</h3>
              <p className="text-muted-foreground mt-2">
                {t('empty.description')}
              </p>

              {hasAdminAccess && (
                <Button
                  className="mt-4"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t('actions.createFirst')}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {categories
              .filter(cat => !cat.parentId)
              .map(category => renderCategory(category))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dialogs.edit.title')}</DialogTitle>
            <DialogDescription>
              {t('dialogs.edit.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">{t('fields.name')}</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={e =>
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                }
                placeholder={t('placeholders.name')}
              />
            </div>

            <div>
              <Label htmlFor="edit-description">
                {t('fields.description')}
              </Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder={t('placeholders.description')}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-parent">{t('fields.parentCategory')}</Label>
              <Select
                value={formData.parentId}
                onValueChange={value =>
                  setFormData(prev => ({ ...prev, parentId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('placeholders.parentCategory')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('options.noParent')}</SelectItem>
                  {flatCategories
                    .filter(
                      ({ category }) => category.id !== editingCategory?.id
                    )
                    .map(({ category, level }) => (
                      <SelectItem key={category.id} value={category.id}>
                        {'—'.repeat(level)} {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              {t('actions.cancel')}
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isUpdating || !formData.name.trim()}
            >
              {isUpdating ? t('actions.updating') : t('actions.update')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialogs.delete.description', {
                name: deletingCategory?.name || '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t('actions.deleting') : t('actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
