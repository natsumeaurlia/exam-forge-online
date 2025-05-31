'use client';

import { signIn, getProviders, type ClientSafeProvider } from 'next-auth/react';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

interface SignInPageProps {
  params: Promise<{
    lng: string;
  }>;
}

export default function SignInPage({ params }: SignInPageProps) {
  const resolvedParams = use(params);
  const [providers, setProviders] = useState<Record<string, ClientSafeProvider> | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        callbackUrl: `/${resolvedParams.lng}`,
        redirect: false,
      });

      if (result?.error) {
        alert('ログインに失敗しました');
      } else if (result?.ok) {
        router.push(`/${resolvedParams.lng}`);
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
      callbackUrl: `/${resolvedParams.lng}`,
    });
  };

  if (!providers) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            アカウントにサインイン
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            または{' '}
            <button
              onClick={() => router.push(`/${resolvedParams.lng}`)}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              ホームに戻る
            </button>
          </p>
        </div>

        <div className="space-y-6">
          {/* OAuth Providers */}
          <div className="space-y-3">
            {Object.values(providers || {})
              .filter((provider: ClientSafeProvider) => provider.id !== 'credentials')
              .map((provider: ClientSafeProvider) => (
                <button
                  key={provider.name}
                  onClick={() => handleProviderSignIn(provider.id)}
                  className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                >
                  {provider.name}でサインイン
                </button>
              ))}
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-gray-50 px-2 text-gray-500">または</span>
            </div>
          </div>

          {/* Credentials Form */}
          <form className="space-y-6" onSubmit={handleCredentialsSignIn}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                メールアドレス
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
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                パスワード
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
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative flex w-full justify-center rounded-md border border-transparent bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
              >
                {isLoading ? 'サインイン中...' : 'サインイン'}
              </button>
            </div>
          </form>

          {/* Test Credentials Info */}
          <div className="mt-6 rounded-md bg-blue-50 p-4">
            <h3 className="mb-2 text-sm font-medium text-blue-800">
              テスト用アカウント:
            </h3>
            <p className="text-sm text-blue-600">
              メール: test@example.com
              <br />
              パスワード: password
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
