'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useCallback } from 'react';

export function useActionError() {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const handleError = useCallback(
    (error: unknown) => {
      console.error('Action error:', error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : '予期しないエラーが発生しました';

      // Check if this is an authentication error
      if (
        errorMessage.includes('INVALID_USER:') ||
        errorMessage.includes('認証が必要です') ||
        errorMessage.includes('ログインが必要です')
      ) {
        // Extract locale from pathname
        const pathSegments = pathname.split('/');
        const locale = ['en', 'ja'].includes(pathSegments[1])
          ? pathSegments[1]
          : 'ja';

        // Show error toast
        toast({
          title: 'セッションエラー',
          description: '再度ログインが必要です',
          variant: 'destructive',
        });

        // Redirect to signin
        const signinUrl = `/${locale}/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`;
        router.push(signinUrl);
        return;
      }

      // For other errors, just show toast
      toast({
        title: 'エラー',
        description: errorMessage,
        variant: 'destructive',
      });
    },
    [pathname, router, toast]
  );

  return { handleError };
}
