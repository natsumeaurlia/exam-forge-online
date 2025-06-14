'use client';

import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, use } from 'react';
import { useTranslations } from 'next-intl';

interface SignOutPageProps {
  params: Promise<{
    lng: string;
  }>;
}

export default function SignOutPage({ params }: SignOutPageProps) {
  const resolvedParams = use(params);
  const t = useTranslations('auth.signout');
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      signOut({
        callbackUrl: `/${resolvedParams.lng}`,
        redirect: true,
      });
    } else {
      router.push(`/${resolvedParams.lng}`);
    }
  }, [session, resolvedParams.lng, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('message')}
          </p>
        </div>

        <div className="flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
        </div>

        <div className="text-center">
          <button
            onClick={() => router.push(`/${resolvedParams.lng}`)}
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            {t('homeLink')}
          </button>
        </div>
      </div>
    </div>
  );
}
