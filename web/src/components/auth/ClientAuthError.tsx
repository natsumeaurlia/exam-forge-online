'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';

interface ClientAuthErrorProps {
  error: Error;
  reset: () => void;
}

export function ClientAuthError({ error, reset }: ClientAuthErrorProps) {
  useEffect(() => {
    // Auto sign out for auth errors
    if (
      error.message === 'USER_NOT_FOUND' ||
      error.message.includes('INVALID_USER:') ||
      error.message === 'UNAUTHENTICATED'
    ) {
      console.warn('Authentication error detected, signing out...');
      signOut({ callbackUrl: '/auth/signin' });
    }
  }, [error]);

  if (
    error.message === 'USER_NOT_FOUND' ||
    error.message.includes('INVALID_USER:') ||
    error.message === 'UNAUTHENTICATED'
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">認証を確認しています...</p>
          <p className="mt-2 text-sm text-gray-500">
            自動的にサインイン画面にリダイレクトします
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="max-w-md text-center">
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h2 className="mb-2 text-lg font-semibold text-gray-900">
          エラーが発生しました
        </h2>
        <p className="mb-4 text-gray-600">
          予期しないエラーが発生しました。ページを再読み込みしてください。
        </p>
        <div className="space-y-2">
          <button
            onClick={reset}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            再試行
          </button>
          <button
            onClick={() => (window.location.href = '/')}
            className="w-full rounded-md bg-gray-100 px-4 py-2 text-gray-800 hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:outline-none"
          >
            ホームに戻る
          </button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm text-gray-500">
              エラー詳細 (開発環境のみ)
            </summary>
            <pre className="mt-2 overflow-auto rounded bg-gray-50 p-2 text-xs text-red-600">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
