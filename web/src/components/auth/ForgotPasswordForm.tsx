'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { requestPasswordReset } from '@/lib/actions/password-reset';

const forgotPasswordSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

interface Props {
  locale: string;
}

export default function ForgotPasswordForm({ locale }: Props) {
  const t = useTranslations('auth');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setMessage('');

    try {
      const result = await requestPasswordReset(data);

      if (result?.serverError) {
        setMessage(result.serverError);
        setIsSuccess(false);
      } else {
        setMessage(
          'パスワードリセット用のメールを送信しました。メールボックスをご確認ください。'
        );
        setIsSuccess(true);
      }
    } catch (error) {
      setMessage('エラーが発生しました。もう一度お試しください。');
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="space-y-6">
        <Alert className="border-green-200 bg-green-50">
          <Mail className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            {message}
          </AlertDescription>
        </Alert>

        <div className="space-y-4 text-center">
          <p className="text-sm text-gray-600">
            メールが届かない場合は、迷惑メールフォルダもご確認ください。
          </p>
          <Link
            href={`/${locale}/auth/signin`}
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            ログインページに戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {message && !isSuccess && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-700">
            {message}
          </AlertDescription>
        </Alert>
      )}

      <div>
        <Label htmlFor="email">メールアドレス</Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          className="mt-1"
          placeholder="your@email.com"
          disabled={isLoading}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            送信中...
          </>
        ) : (
          <>
            <Mail className="mr-2 h-4 w-4" />
            リセット用メールを送信
          </>
        )}
      </Button>

      <div className="text-center">
        <Link
          href={`/${locale}/auth/signin`}
          className="text-sm text-blue-600 hover:text-blue-500"
        >
          ログインページに戻る
        </Link>
      </div>

      <div className="mt-6 rounded-lg bg-blue-50 p-4">
        <h3 className="mb-2 text-sm font-medium text-blue-900">
          🔒 セキュリティについて
        </h3>
        <ul className="space-y-1 text-xs text-blue-700">
          <li>• リセットリンクは1時間で有効期限が切れます</li>
          <li>• リンクは1回のみ使用可能です</li>
          <li>• 15分間に5回までリクエスト可能です</li>
        </ul>
      </div>
    </form>
  );
}
