'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';

export function AuthErrorBoundary({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated' && pathname.includes('/dashboard')) {
      // Extract locale from pathname
      const pathSegments = pathname.split('/');
      const locale = ['en', 'ja'].includes(pathSegments[1])
        ? pathSegments[1]
        : 'ja';

      // Redirect to signin with the current path as callback
      const signinUrl = `/${locale}/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`;
      router.push(signinUrl);
    }
  }, [status, pathname, router]);

  return <>{children}</>;
}
