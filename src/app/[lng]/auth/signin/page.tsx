'use client';

import { signIn, getProviders, type ClientSafeProvider } from 'next-auth/react';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface SignInPageProps {
  params: Promise<{
    lng: string;
  }>;
}

export default function SignInPage({ params }: SignInPageProps) {
  const resolvedParams = use(params);
  const t = useTranslations('auth.signin');
  const [providers, setProviders] = useState<Record<
    string,
    ClientSafeProvider
  > | null>(null);
  // テスト用デフォルト値（開発環境のみ）
  const [email, setEmail] = useState(
    process.env.NODE_ENV === 'development' ? 'test@example.com' : ''
  );
  const [password, setPassword] = useState(
    process.env.NODE_ENV === 'development' ? 'password' : ''
  );
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchProviders = async () => {
      const res = await getProviders();
      setProviders(res);
    };
    fetchProviders();
  }, []);

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        callbackUrl: `/${resolvedParams.lng}/dashboard`,
        redirect: false,
      });

      if (result?.error) {
        alert('ログインに失敗しました');
      } else if (result?.ok) {
        router.push(`/${resolvedParams.lng}/dashboard`);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      alert('ログインエラーが発生しました');
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
    <div
      className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8"
      data-testid="signin-page"
    >
      <div className="w-full max-w-md space-y-8" data-testid="signin-container">
        <div data-testid="signin-header">
          <h2
            className="mt-6 text-center text-3xl font-extrabold text-gray-900"
            data-testid="signin-title"
          >
            {t('title')}
          </h2>
          <p
            className="mt-2 text-center text-sm text-gray-600"
            data-testid="signin-subtitle"
          >
            {t('subtitle')}{' '}
            <button
              onClick={() => router.push(`/${resolvedParams.lng}`)}
              className="font-medium text-blue-600 hover:text-blue-500"
              data-testid="home-link"
            >
              {t('homeLink')}
            </button>
          </p>
        </div>

        <div className="space-y-6" data-testid="signin-content">
          {/* OAuth Providers */}
          <div className="space-y-3" data-testid="oauth-providers">
            {Object.values(providers || {})
              .filter(
                (provider: ClientSafeProvider) => provider.id !== 'credentials'
              )
              .map((provider: ClientSafeProvider) => (
                <button
                  key={provider.name}
                  onClick={() => handleProviderSignIn(provider.id)}
                  className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                  data-testid={`oauth-${provider.id}-button`}
                >
                  {t('withProvider').replace('%s', provider.name)}
                </button>
              ))}
          </div>

          {/* Divider */}
          <div className="relative" data-testid="signin-divider">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-gray-50 px-2 text-gray-500">
                {t('dividerText')}
              </span>
            </div>
          </div>

          {/* Credentials Form */}
          <form
            className="space-y-6"
            onSubmit={handleCredentialsSignIn}
            data-testid="credentials-form"
          >
            <div data-testid="email-field">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
                data-testid="email-label"
              >
                {t('email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="relative mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm"
                placeholder="test@example.com"
                data-testid="email-input"
              />
            </div>

            <div data-testid="password-field">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
                data-testid="password-label"
              >
                {t('password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="relative mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm"
                placeholder="password"
                data-testid="password-input"
              />
            </div>

            <div data-testid="submit-section">
              <button
                type="submit"
                disabled={isLoading}
                className="group relative flex w-full justify-center rounded-md border border-transparent bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
                data-testid="signin-submit-button"
              >
                {isLoading ? t('signingIn') : t('signinButton')}
              </button>
            </div>
          </form>

          {/* Test Credentials Info */}
          <div
            className="mt-6 rounded-md bg-blue-50 p-4"
            data-testid="test-credentials"
          >
            <h3
              className="mb-2 text-sm font-medium text-blue-800"
              data-testid="test-credentials-title"
            >
              {t('testCredentialsTitle')}
            </h3>
            <p
              className="text-sm text-blue-600"
              data-testid="test-credentials-info"
            >
              {t('testCredentialsInfo')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
