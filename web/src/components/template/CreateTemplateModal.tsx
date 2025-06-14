'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
import { TEMPLATE_CATEGORIES } from '@/types/template';
import { createTemplate } from '@/lib/actions/template';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface CreateTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lng: string;
}

export function CreateTemplateModal({
  open,
  onOpenChange,
  lng,
}: CreateTemplateModalProps) {
  const t = useTranslations('templateManagement.createModal');
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  const { execute, isExecuting } = useAction(createTemplate, {
    onSuccess: ({ data }) => {
      toast.success('テンプレートが作成されました');
      onOpenChange(false);
      if (data?.template?.id) {
        router.push(`/${lng}/dashboard/templates/${data.template.id}/edit`);
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'テンプレートの作成に失敗しました');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('テンプレート名は必須です');
      return;
    }

    execute({
      title: title.trim(),
      description: description.trim() || undefined,
      category: category || undefined,
      isPublic: false,
      questions: [], // Empty template to start
      settings: {
        passingScore: 70,
        shuffleQuestions: false,
        shuffleOptions: false,
      },
    });
  };

  const handleClose = () => {
    if (!isExecuting) {
      setTitle('');
      setDescription('');
      setCategory('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t('titleLabel')}</Label>
            <Input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={t('titlePlaceholder')}
              disabled={isExecuting}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('descriptionLabel')}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('descriptionPlaceholder')}
              disabled={isExecuting}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">{t('categoryLabel')}</Label>
            <Select
              value={category}
              onValueChange={setCategory}
              disabled={isExecuting}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('categoryPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATE_CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {t(`categories.${cat}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isExecuting}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isExecuting || !title.trim()}>
              {isExecuting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('creating')}
                </>
              ) : (
                t('create')
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
