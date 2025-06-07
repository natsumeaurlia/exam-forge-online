'use client';

import { z } from 'zod';
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

// Schema definition
export const createQuizFormSchema = z
  .object({
    title: z.string().min(1, 'タイトルは必須です'),
    description: z.string().optional(),
    scoringType: z.nativeEnum(ScoringType),
    sharingMode: z.nativeEnum(SharingMode),
    password: z.string().optional(),
  })
  .refine(
    data => {
      if (data.sharingMode === SharingMode.PASSWORD) {
        return !!data.password && data.password.length >= 4;
      }
      return true;
    },
    {
      message: 'パスワードは4文字以上で設定してください',
      path: ['password'],
    }
  );

export type CreateQuizFormData = z.infer<typeof createQuizFormSchema>;

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
  return (
    <>
      <FormField
        control={control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>タイトル *</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="クイズのタイトルを入力"
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
            <FormLabel>説明</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder="クイズの説明を入力（任意）"
                disabled={isLoading}
                rows={3}
              />
            </FormControl>
            <FormDescription>受験者に表示される説明文です</FormDescription>
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
              <FormLabel>採点モード</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="採点モードを選択" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={ScoringType.AUTO}>自動採点</SelectItem>
                  <SelectItem value={ScoringType.MANUAL}>手動採点</SelectItem>
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
              <FormLabel>共有モード</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="共有モードを選択" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={SharingMode.URL}>URL共有</SelectItem>
                  <SelectItem value={SharingMode.PASSWORD}>
                    パスワード保護
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
              <FormLabel>パスワード</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  placeholder="アクセス用パスワードを入力"
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                受験者がクイズにアクセスする際に必要なパスワードです
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </>
  );
}
