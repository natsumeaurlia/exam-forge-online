'use client';

import { use } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface AuthErrorPageProps {
  params: Promise<{
    lng: string;
  }>;
}

export default function AuthErrorPage({ params }: AuthErrorPageProps) {
  const resolvedParams = use(params);
  const t = useTranslations('auth.error');
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get('error');

  const getErrorMessage = () => {
    switch (error) {
      case 'Configuration':
        return t('configuration');
      case 'AccessDenied':
        return t('accessDenied');
      case 'Verification':
        return t('verification');
      case 'SessionExpired':
        return t('sessionExpired');
      case 'OAuthSignin':
        return t('oauthSignin');
      case 'OAuthCallback':
        return t('oauthCallback');
      case 'OAuthCreateAccount':
        return t('oauthCreateAccount');
      case 'EmailCreateAccount':
        return t('emailCreateAccount');
      case 'Callback':
        return t('callback');
      case 'OAuthAccountNotLinked':
        return t('oauthAccountNotLinked');
      case 'EmailSignin':
        return t('emailSignin');
      case 'CredentialsSignin':
        return t('credentialsSignin');
      default:
        return t('default');
    }
  };

  const handleRetry = () => {
    const callbackUrl =
      searchParams.get('callbackUrl') || `/${resolvedParams.lng}/dashboard`;
    router.push(
      `/${resolvedParams.lng}/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">ExamForge</h1>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('title')}</AlertTitle>
          <AlertDescription className="mt-2">
            {getErrorMessage()}
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <Button onClick={handleRetry} className="w-full">
            {t('tryAgain')}
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push(`/${resolvedParams.lng}`)}
            className="w-full"
          >
            {t('backToHome')}
          </Button>
        </div>
      </div>
    </div>
  );
}
