'use client';

import { Control } from 'react-hook-form';
import { ScoringType, SharingMode } from '@prisma/client';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CreateQuizFormData } from '@/types/quiz-schemas';
import { useTranslations } from 'next-intl';

// Re-export from centralized schemas for backward compatibility
export {
  createQuizFormSchema,
  type CreateQuizFormData,
} from '@/types/quiz-schemas';

export const defaultCreateQuizFormValues: CreateQuizFormData = {
  title: '',
  description: '',
  scoringType: ScoringType.AUTO,
  sharingMode: SharingMode.URL,
  password: '',
};

interface CreateQuizFormFieldsProps {
  control: Control<CreateQuizFormData>;
  isLoading?: boolean;
  watchSharingMode: SharingMode;
}

export function CreateQuizFormFields({
  control,
  isLoading = false,
  watchSharingMode,
}: CreateQuizFormFieldsProps) {
  const t = useTranslations('quizManagement.createQuiz');

  return (
    <>
      <FormField
        control={control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('title')}</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder={t('titlePlaceholder')}
                disabled={isLoading}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('description')}</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder={t('descriptionPlaceholder')}
                disabled={isLoading}
                rows={3}
              />
            </FormControl>
            <FormDescription>{t('descriptionHelp')}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name="scoringType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('scoringMode')}</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('scoringModePlaceholder')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={ScoringType.AUTO}>
                    {t('autoScoring')}
                  </SelectItem>
                  <SelectItem value={ScoringType.MANUAL}>
                    {t('manualScoring')}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="sharingMode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('sharingMode')}</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('sharingModePlaceholder')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={SharingMode.URL}>
                    {t('urlSharing')}
                  </SelectItem>
                  <SelectItem value={SharingMode.PASSWORD}>
                    {t('passwordProtected')}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {watchSharingMode === SharingMode.PASSWORD && (
        <FormField
          control={control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('password')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  placeholder={t('passwordPlaceholder')}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>{t('passwordHelp')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </>
  );
}
