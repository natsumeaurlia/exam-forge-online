'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { useQuizPreviewStore } from '@/stores/useQuizPreviewStore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const participantSchema = z.object({
  name: z.string().min(1, '名前を入力してください'),
  email: z.string().email('有効なメールアドレスを入力してください'),
});

type ParticipantFormData = z.infer<typeof participantSchema>;

interface ParticipantFormProps {
  onSubmit: () => void;
}

export function ParticipantForm({ onSubmit }: ParticipantFormProps) {
  const t = useTranslations('quiz.preview');
  const { setParticipantInfo } = useQuizPreviewStore();

  const form = useForm<ParticipantFormData>({
    resolver: zodResolver(participantSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });

  const {
    formState: { errors },
    handleSubmit,
  } = form;

  const onFormSubmit = (data: ParticipantFormData) => {
    setParticipantInfo(data);
    onSubmit();
  };

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>{t('participantInfo.title')}</CardTitle>
        <CardDescription>{t('participantInfo.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('participantInfo.name')}</Label>
            <Input
              id="name"
              type="text"
              {...form.register('name')}
              placeholder={t('participantInfo.namePlaceholder')}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('participantInfo.email')}</Label>
            <Input
              id="email"
              type="email"
              {...form.register('email')}
              placeholder={t('participantInfo.emailPlaceholder')}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full">
            {t('startQuiz')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
