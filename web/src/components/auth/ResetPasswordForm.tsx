'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, CheckCircle, Shield } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { resetPassword, verifyResetToken } from '@/lib/actions/password-reset';

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'パスワードは8文字以上である必要があります')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'パスワードは大文字、小文字、数字、特殊文字を含む必要があります'
      ),
    confirmPassword: z.string(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'パスワードが一致しません',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

interface Props {
  token: string;
  locale: string;
}

export default function ResetPasswordForm({ token, locale }: Props) {
  const t = useTranslations('auth');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const password = watch('newPassword');

  // パスワード強度チェック
  const passwordChecks = {
    length: password?.length >= 8,
    lowercase: /[a-z]/.test(password || ''),
    uppercase: /[A-Z]/.test(password || ''),
    number: /\d/.test(password || ''),
    special: /[@$!%*?&]/.test(password || ''),
  };

  const isPasswordStrong = Object.values(passwordChecks).every(Boolean);

  useEffect(() => {
    const verifyToken = async () => {
      setIsVerifying(true);
      try {
        const result = await verifyResetToken({ token });

        if (result?.data?.valid) {
          setTokenValid(true);
          setUserEmail(result.data.email || '');
        } else {
          setMessage(result?.data?.error || '無効なトークンです');
          setTokenValid(false);
        }
      } catch (error) {
        setMessage('トークンの検証中にエラーが発生しました');
        setTokenValid(false);
      } finally {
        setIsVerifying(false);
      }
    };

    if (token) {
      verifyToken();
    }
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    setMessage('');

    try {
      const result = await resetPassword({
        token,
        newPassword: data.newPassword,
      });

      if (result?.serverError) {
        setMessage(result.serverError);
        setIsSuccess(false);
      } else {
        setMessage('パスワードが正常に更新されました');
        setIsSuccess(true);

        // 3秒後にログインページへリダイレクト
        setTimeout(() => {
          router.push(`/${locale}/auth/signin`);
        }, 3000);
      }
    } catch (error) {
      setMessage('エラーが発生しました。もう一度お試しください。');
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">トークンを検証中...</span>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="space-y-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-700">
            {message}
          </AlertDescription>
        </Alert>

        <div className="text-center">
          <Link
            href={`/${locale}/auth/forgot-password`}
            className="text-blue-600 hover:text-blue-500"
          >
            新しいパスワードリセットをリクエストする
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="space-y-6">
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            {message}
          </AlertDescription>
        </Alert>

        <div className="text-center">
          <p className="mb-4 text-sm text-gray-600">
            3秒後にログインページへ移動します...
          </p>
          <Link
            href={`/${locale}/auth/signin`}
            className="text-blue-600 hover:text-blue-500"
          >
            今すぐログインページへ移動
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

      {userEmail && (
        <div className="rounded-lg bg-blue-50 p-3">
          <p className="text-sm text-blue-700">
            <Shield className="mr-2 inline h-4 w-4" />
            {userEmail} のパスワードをリセットします
          </p>
        </div>
      )}

      <div>
        <Label htmlFor="newPassword">新しいパスワード</Label>
        <div className="relative mt-1">
          <Input
            id="newPassword"
            type={showPassword ? 'text' : 'password'}
            {...register('newPassword')}
            placeholder="新しいパスワードを入力"
            disabled={isLoading}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </div>
        {errors.newPassword && (
          <p className="mt-1 text-sm text-red-600">
            {errors.newPassword.message}
          </p>
        )}

        {/* パスワード強度インジケーター */}
        {password && (
          <div className="mt-2 space-y-1">
            <div className="text-xs text-gray-600">パスワードの要件:</div>
            <div className="space-y-1">
              {Object.entries({
                length: '8文字以上',
                lowercase: '小文字を含む',
                uppercase: '大文字を含む',
                number: '数字を含む',
                special: '特殊文字(@$!%*?&)を含む',
              }).map(([key, label]) => (
                <div key={key} className="flex items-center text-xs">
                  <div
                    className={`mr-2 h-2 w-2 rounded-full ${
                      passwordChecks[key as keyof typeof passwordChecks]
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    }`}
                  />
                  <span
                    className={
                      passwordChecks[key as keyof typeof passwordChecks]
                        ? 'text-green-600'
                        : 'text-gray-500'
                    }
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="confirmPassword">パスワード確認</Label>
        <div className="relative mt-1">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            {...register('confirmPassword')}
            placeholder="パスワードを再入力"
            disabled={isLoading}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || !isPasswordStrong}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            パスワードを更新中...
          </>
        ) : (
          'パスワードを更新'
        )}
      </Button>

      <div className="mt-6 rounded-lg bg-amber-50 p-4">
        <h3 className="mb-2 text-sm font-medium text-amber-900">
          ⚠️ セキュリティに関する注意
        </h3>
        <ul className="space-y-1 text-xs text-amber-700">
          <li>• 強力なパスワードを設定してください</li>
          <li>• 他のサービスと同じパスワードは避けてください</li>
          <li>• パスワードは安全に保管してください</li>
        </ul>
      </div>
    </form>
  );
}
