'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { createSection, updateSection } from '@/lib/actions/section';
import { createSectionSchema, updateSectionSchema } from '@/types/quiz-schemas';
import type { Section } from '@prisma/client';

// フォーム用のスキーマ（作成時と更新時で共通の部分）
const sectionFormSchema = z.object({
  title: z
    .string()
    .min(1, 'セクション名は必須です')
    .max(100, 'セクション名は100文字以内で入力してください'),
  description: z.string().optional(),
});

type SectionFormData = z.infer<typeof sectionFormSchema>;

interface SectionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizId: string;
  section?: Section;
  onSuccess: () => void;
}

export function SectionForm({
  open,
  onOpenChange,
  quizId,
  section,
  onSuccess,
}: SectionFormProps) {
  const isEditing = !!section;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SectionFormData>({
    resolver: zodResolver(sectionFormSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  // セクション情報でフォームを初期化
  useEffect(() => {
    if (section) {
      form.reset({
        title: section.title,
        description: section.description || '',
      });
    } else {
      form.reset({
        title: '',
        description: '',
      });
    }
  }, [section, form]);

  const { execute: executeCreateSection } = useAction(createSection, {
    onSuccess: () => {
      toast.success('セクションを作成しました');
      form.reset();
      onSuccess();
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'セクションの作成に失敗しました');
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const { execute: executeUpdateSection } = useAction(updateSection, {
    onSuccess: () => {
      toast.success('セクションを更新しました');
      onSuccess();
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'セクションの更新に失敗しました');
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: SectionFormData) => {
    setIsSubmitting(true);

    if (isEditing && section) {
      executeUpdateSection({
        id: section.id,
        title: data.title,
        description: data.description || undefined,
      });
    } else {
      executeCreateSection({
        title: data.title,
        description: data.description || undefined,
        quizId,
      });
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      onOpenChange(newOpen);
      if (!newOpen) {
        form.reset();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'セクションを編集' : 'セクションを作成'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'セクションの情報を編集してください。'
              : '新しいセクションの情報を入力してください。'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>セクション名 *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="例: 基礎知識"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>説明（任意）</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="セクションの説明を入力してください"
                      rows={3}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? isEditing
                    ? '更新中...'
                    : '作成中...'
                  : isEditing
                    ? '更新'
                    : '作成'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
