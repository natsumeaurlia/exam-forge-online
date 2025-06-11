'use client';

import { signIn } from 'next-auth/react';
import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { signupAction } from '@/lib/actions/auth';
import { useAction } from 'next-safe-action/hooks';

interface SignUpPageProps {
  params: Promise<{
    lng: string;
  }>;
}

const signupSchema = z
  .object({
    name: z.string().min(1, 'お名前を入力してください'),
    email: z.string().email('有効なメールアドレスを入力してください'),
    password: z
      .string()
      .min(8, 'パスワードは8文字以上である必要があります')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'パスワードは大文字・小文字・数字を含む必要があります'
      ),
    confirmPassword: z.string(),
    agreeToTerms: z.boolean().refine(val => val === true, {
      message: '利用規約に同意する必要があります',
    }),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'パスワードが一致しません',
    path: ['confirmPassword'],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignUpPage({ params }: SignUpPageProps) {
  const resolvedParams = use(params);
  const t = useTranslations('auth.signup');
  const router = useRouter();

  const [formData, setFormData] = useState<SignupFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof SignupFormData, string>>
  >({});

  // ServerActionを使用
  const {
    execute: signup,
    isExecuting,
    result,
  } = useAction(signupAction, {
    onSuccess: async data => {
      if (data.success) {
        // Auto sign in after successful signup
        const signInResult = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          callbackUrl: `/${resolvedParams.lng}/dashboard`,
          redirect: false,
        });

        if (signInResult?.ok) {
          router.push(`/${resolvedParams.lng}/dashboard`);
        } else {
          setErrors({ email: '自動ログインに失敗しました' });
        }
      }
    },
    onError: error => {
      setErrors({ email: error.serverError || 'エラーが発生しました' });
    },
  });

  const validateForm = (): boolean => {
    try {
      signupSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof SignupFormData, string>> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof SignupFormData] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // ServerActionを実行
    signup({
      name: formData.name,
      email: formData.email,
      password: formData.password,
    });
  };

  const handleSocialSignUp = (provider: 'google' | 'github') => {
    signIn(provider, {
      callbackUrl: `/${resolvedParams.lng}/dashboard`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto flex min-h-screen flex-col lg:flex-row">
        {/* Left side - Form */}
        <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-sm">
            {/* Logo */}
            <Link href={`/${resolvedParams.lng}`} className="mb-8 block">
              <h1 className="text-3xl font-bold text-gray-900">ExamForge</h1>
            </Link>

            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                {t('title')}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {t('subtitle')}{' '}
                <Link
                  href={`/${resolvedParams.lng}/auth/signin`}
                  className="text-examforge-blue hover:text-examforge-blue-dark font-medium"
                >
                  {t('signinLink')}
                </Link>
              </p>
            </div>

            {/* Server Error Alert */}
            {result?.serverError && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{result.serverError}</AlertDescription>
              </Alert>
            )}

            {/* Social Sign Up */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => handleSocialSignUp('google')}
                disabled={isExecuting}
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {t('continueWithGoogle')}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => handleSocialSignUp('github')}
                disabled={isExecuting}
              >
                <svg
                  className="mr-2 h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 0C4.477 0 0 4.477 0 10c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V19c0 .27.16.59.67.5C17.14 18.16 20 14.42 20 10A10 10 0 0010 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {t('continueWithGitHub')}
              </Button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">
                  {t('orContinueWith')}
                </span>
              </div>
            </div>

            {/* Sign Up Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">{t('name')}</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={errors.name ? 'border-red-500' : ''}
                  disabled={isExecuting}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={e =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className={errors.email ? 'border-red-500' : ''}
                  disabled={isExecuting}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password">{t('password')}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={e =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className={errors.password ? 'border-red-500' : ''}
                    disabled={isExecuting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                )}
                {formData.password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center text-xs">
                      <CheckCircle
                        className={`mr-1 h-3 w-3 ${
                          formData.password.length >= 8
                            ? 'text-green-500'
                            : 'text-gray-300'
                        }`}
                      />
                      <span
                        className={
                          formData.password.length >= 8
                            ? 'text-green-600'
                            : 'text-gray-500'
                        }
                      >
                        8文字以上
                      </span>
                    </div>
                    <div className="flex items-center text-xs">
                      <CheckCircle
                        className={`mr-1 h-3 w-3 ${
                          /[A-Z]/.test(formData.password) &&
                          /[a-z]/.test(formData.password) &&
                          /\d/.test(formData.password)
                            ? 'text-green-500'
                            : 'text-gray-300'
                        }`}
                      />
                      <span
                        className={
                          /[A-Z]/.test(formData.password) &&
                          /[a-z]/.test(formData.password) &&
                          /\d/.test(formData.password)
                            ? 'text-green-600'
                            : 'text-gray-500'
                        }
                      >
                        大文字・小文字・数字を含む
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className={errors.confirmPassword ? 'border-red-500' : ''}
                    disabled={isExecuting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={checked =>
                    setFormData({
                      ...formData,
                      agreeToTerms: checked as boolean,
                    })
                  }
                  disabled={isExecuting}
                />
                <label
                  htmlFor="terms"
                  className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  <Link
                    href={`/${resolvedParams.lng}/terms`}
                    className="text-examforge-blue hover:text-examforge-blue-dark"
                  >
                    {t('termsOfService')}
                  </Link>
                  {t('and')}
                  <Link
                    href={`/${resolvedParams.lng}/privacy`}
                    className="text-examforge-blue hover:text-examforge-blue-dark"
                  >
                    {t('privacyPolicy')}
                  </Link>
                  {t('agreeToTerms')}
                </label>
              </div>
              {errors.agreeToTerms && (
                <p className="text-sm text-red-500">{errors.agreeToTerms}</p>
              )}

              <Button
                type="submit"
                className="bg-examforge-blue hover:bg-examforge-blue-dark w-full"
                disabled={isExecuting}
              >
                {isExecuting ? (
                  <span className="flex items-center">
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {t('creatingAccount')}
                  </span>
                ) : (
                  <span className="flex items-center">
                    {t('createAccount')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Right side - Benefits */}
        <div className="from-examforge-blue/5 to-examforge-blue/10 hidden flex-1 items-center justify-center bg-gradient-to-br px-8 lg:flex">
          <div className="max-w-md">
            <h3 className="mb-8 text-3xl font-bold text-gray-900">
              {t('benefits.title')}
            </h3>
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="bg-examforge-blue/20 flex h-10 w-10 items-center justify-center rounded-full">
                  <CheckCircle className="text-examforge-blue h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900">
                    {t('benefits.item1.title')}
                  </h4>
                  <p className="mt-1 text-sm text-gray-600">
                    {t('benefits.item1.description')}
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-examforge-blue/20 flex h-10 w-10 items-center justify-center rounded-full">
                  <CheckCircle className="text-examforge-blue h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900">
                    {t('benefits.item2.title')}
                  </h4>
                  <p className="mt-1 text-sm text-gray-600">
                    {t('benefits.item2.description')}
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-examforge-blue/20 flex h-10 w-10 items-center justify-center rounded-full">
                  <CheckCircle className="text-examforge-blue h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900">
                    {t('benefits.item3.title')}
                  </h4>
                  <p className="mt-1 text-sm text-gray-600">
                    {t('benefits.item3.description')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
