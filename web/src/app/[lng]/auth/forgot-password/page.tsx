import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth');

  return {
    title: t('forgotPassword.title'),
    description: t('forgotPassword.description'),
  };
}

interface Props {
  params: { lng: string };
}

export default async function ForgotPasswordPage({ params: { lng } }: Props) {
  const t = await getTranslations('auth');

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('forgotPassword.title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('forgotPassword.subtitle')}
          </p>
        </div>
        <ForgotPasswordForm locale={lng} />
      </div>
    </div>
  );
}
