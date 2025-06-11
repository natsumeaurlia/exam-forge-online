'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const SESSION_CHECK_INTERVAL = 60 * 1000; // 1 minute
const WARNING_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry

export function useSessionMonitor() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const warningShownRef = useRef(false);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.expires) {
      return;
    }

    const checkSession = () => {
      const now = Date.now();
      const expiryTime = new Date(session.expires).getTime();
      const timeRemaining = expiryTime - now;

      // If session has expired
      if (timeRemaining <= 0) {
        const pathSegments = pathname.split('/');
        const locale = ['en', 'ja'].includes(pathSegments[1])
          ? pathSegments[1]
          : 'ja';

        toast({
          title: 'セッション期限切れ',
          description: '再度ログインしてください',
          variant: 'destructive',
        });

        router.push(
          `/${locale}/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`
        );
      }
      // If session is about to expire, show warning
      else if (timeRemaining <= WARNING_THRESHOLD && !warningShownRef.current) {
        warningShownRef.current = true;

        toast({
          title: 'セッションがまもなく期限切れになります',
          description: '作業を保存してください',
          variant: 'default',
        });
      }
    };

    // Initial check
    checkSession();

    // Set up interval
    const interval = setInterval(checkSession, SESSION_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [session, status, pathname, router, toast]);
}
