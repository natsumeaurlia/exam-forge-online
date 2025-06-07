'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAction } from 'next-safe-action/hooks';
import { createQuiz } from '@/lib/actions/quiz';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  CreateQuizFormFields,
  createQuizFormSchema,
  defaultCreateQuizFormValues,
  type CreateQuizFormData,
} from './forms/CreateQuizFormFields';

interface CreateQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateQuizModal({ isOpen, onClose }: CreateQuizModalProps) {
  const router = useRouter();

  const form = useForm<CreateQuizFormData>({
    resolver: zodResolver(createQuizFormSchema),
    defaultValues: defaultCreateQuizFormValues,
  });

  const { execute, isExecuting } = useAction(createQuiz, {
    onSuccess: ({ data }) => {
      toast.success('クイズが作成されました');
      handleClose();
      if (data?.quiz.id) {
        router.push(`/dashboard/quizzes/${data.quiz.id}/edit`);
      }
    },
    onError: ({ error }) => {
      if (error.validationErrors) {
        // バリデーションエラーをフォームに反映
        Object.entries(error.validationErrors).forEach(([field, errors]) => {
          form.setError(field as keyof CreateQuizFormData, {
            type: 'manual',
            message: Array.isArray(errors) ? errors[0] : '',
          });
        });
      } else {
        toast.error(error.serverError || 'クイズの作成に失敗しました');
      }
    },
  });

  const onSubmit = (data: CreateQuizFormData) => {
    execute(data);
  };

  const handleClose = () => {
    if (!isExecuting) {
      form.reset();
      onClose();
    }
  };

  const watchSharingMode = form.watch('sharingMode');

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>新規クイズ作成</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <CreateQuizFormFields
              control={form.control}
              isLoading={isExecuting}
              watchSharingMode={watchSharingMode}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isExecuting}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                disabled={isExecuting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isExecuting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                作成して編集へ進む
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
