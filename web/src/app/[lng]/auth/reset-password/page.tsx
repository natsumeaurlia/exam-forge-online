import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth');

  return {
    title: t('resetPassword.title'),
    description: t('resetPassword.description'),
  };
}

interface Props {
  params: { lng: string };
  searchParams: { token?: string };
}

export default async function ResetPasswordPage({
  params: { lng },
  searchParams,
}: Props) {
  const t = await getTranslations('auth');

  if (!searchParams.token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              {t('resetPassword.invalidToken')}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {t('resetPassword.tokenMissing')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('resetPassword.title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('resetPassword.subtitle')}
          </p>
        </div>
        <Suspense fallback={<div>Loading...</div>}>
          <ResetPasswordForm token={searchParams.token} locale={lng} />
        </Suspense>
      </div>
    </div>
  );
}
