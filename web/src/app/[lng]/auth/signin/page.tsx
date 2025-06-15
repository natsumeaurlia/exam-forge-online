'use client';

import { signIn, getProviders, type ClientSafeProvider } from 'next-auth/react';
import { useState, useEffect, use } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import {
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

interface SignInPageProps {
  params: Promise<{
    lng: string;
  }>;
}

const signinSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(1, 'パスワードを入力してください'),
  rememberMe: z.boolean().optional(),
});

type SigninFormData = z.infer<typeof signinSchema>;

export default function SignInPage({ params }: SignInPageProps) {
  const resolvedParams = use(params);
  const t = useTranslations('auth.signin');
  const [providers, setProviders] = useState<Record<
    string,
    ClientSafeProvider
  > | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const errorParam = searchParams.get('error');
  const messageParam = searchParams.get('message');

  const form = useForm<SigninFormData>({
    resolver: zodResolver(signinSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const {
    formState: { errors },
    handleSubmit,
  } = form;

  useEffect(() => {
    const fetchProviders = async () => {
      const res = await getProviders();
      setProviders(res);
    };
    fetchProviders();
  }, []);

  const onSubmit = async (data: SigninFormData) => {
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        callbackUrl: `/${resolvedParams.lng}/dashboard`,
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: t('auth.signin.error.title'),
          description: t('auth.signin.error.invalidCredentials'),
          variant: 'destructive',
        });
      } else if (result?.ok) {
        router.push(`/${resolvedParams.lng}/dashboard`);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      toast({
        title: t('auth.signin.error.title'),
        description: t('auth.signin.error.general'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProviderSignIn = (providerId: string) => {
    signIn(providerId, {
      callbackUrl: `/${resolvedParams.lng}/dashboard`,
    });
  };

  if (!providers) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        data-testid="signin-loading"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
                  href={`/${resolvedParams.lng}/auth/signup`}
                  className="text-examforge-blue hover:text-examforge-blue-dark font-medium"
                >
                  {t('signupLink')}
                </Link>
              </p>
            </div>

            {/* Social Sign In */}
            <div className="space-y-3">
              {Object.values(providers || {})
                .filter(
                  (provider: ClientSafeProvider) =>
                    provider.id !== 'credentials'
                )
                .map((provider: ClientSafeProvider) => (
                  <Button
                    key={provider.name}
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleProviderSignIn(provider.id)}
                    disabled={isLoading}
                  >
                    {provider.id === 'google' && (
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
                    )}
                    {provider.id === 'github' && (
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
                    )}
                    {t('withProvider').replace('%s', provider.name)}
                  </Button>
                ))}
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">
                  {t('dividerText')}
                </span>
              </div>
            </div>

            {/* Credentials Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register('email')}
                  placeholder="test@example.com"
                  disabled={isLoading}
                  className={errors.email ? 'border-red-500' : ''}
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email && (
                  <p
                    id="email-error"
                    className="mt-1 text-sm text-red-500"
                    role="alert"
                  >
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="password">{t('password')}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...form.register('password')}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className={errors.password ? 'border-red-500' : ''}
                    aria-invalid={errors.password ? 'true' : 'false'}
                    aria-describedby={
                      errors.password ? 'password-error' : undefined
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={
                      showPassword
                        ? t('auth.signin.hidePassword')
                        : t('auth.signin.showPassword')
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p
                    id="password-error"
                    className="mt-1 text-sm text-red-500"
                    role="alert"
                  >
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" {...form.register('rememberMe')} />
                  <label
                    htmlFor="remember"
                    className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {t('rememberMe')}
                  </label>
                </div>
                <Link
                  href={`/${resolvedParams.lng}/auth/forgot-password`}
                  className="text-examforge-blue hover:text-examforge-blue-dark text-sm"
                >
                  {t('forgotPassword')}
                </Link>
              </div>

              <Button
                type="submit"
                className="bg-examforge-blue hover:bg-examforge-blue-dark w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {t('signingIn')}
                  </span>
                ) : (
                  <span className="flex items-center">
                    {t('signinButton')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>

            {/* Error Alert */}
            {(errorParam || messageParam) && (
              <Alert variant="destructive" className="mt-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {messageParam ||
                    (errorParam === 'SessionExpired'
                      ? t('sessionExpired')
                      : t('errorGeneric'))}
                </AlertDescription>
              </Alert>
            )}

            {/* Test Credentials Info */}
            <Alert className="mt-6">
              <AlertDescription>
                <h3 className="mb-1 font-medium">
                  {t('testCredentialsTitle')}
                </h3>
                <p className="text-sm text-gray-600">
                  {t('testCredentialsInfo')}
                </p>
              </AlertDescription>
            </Alert>
          </div>
        </div>

        {/* Right side - Welcome back message */}
        <div className="from-examforge-blue/5 to-examforge-blue/10 hidden flex-1 items-center justify-center bg-gradient-to-br px-8 lg:flex">
          <div className="max-w-md">
            <h3 className="mb-8 text-3xl font-bold text-gray-900">
              {t('welcome.title')}
            </h3>
            <p className="mb-8 text-lg text-gray-600">
              {t('welcome.subtitle')}
            </p>
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="bg-examforge-blue/20 flex h-10 w-10 items-center justify-center rounded-full">
                  <CheckCircle className="text-examforge-blue h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900">
                    {t('welcome.benefit1.title')}
                  </h4>
                  <p className="mt-1 text-sm text-gray-600">
                    {t('welcome.benefit1.description')}
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-examforge-blue/20 flex h-10 w-10 items-center justify-center rounded-full">
                  <CheckCircle className="text-examforge-blue h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900">
                    {t('welcome.benefit2.title')}
                  </h4>
                  <p className="mt-1 text-sm text-gray-600">
                    {t('welcome.benefit2.description')}
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-examforge-blue/20 flex h-10 w-10 items-center justify-center rounded-full">
                  <CheckCircle className="text-examforge-blue h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900">
                    {t('welcome.benefit3.title')}
                  </h4>
                  <p className="mt-1 text-sm text-gray-600">
                    {t('welcome.benefit3.description')}
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
