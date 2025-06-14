import { Suspense } from 'react';
import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { QuestionBankContent } from '@/components/question-bank/QuestionBankContent';
import { FileText } from 'lucide-react';

interface QuestionBankPageProps {
  params: { lng: string };
}

export async function generateMetadata({
  params,
}: QuestionBankPageProps): Promise<Metadata> {
  const t = await getTranslations({
    locale: params.lng,
    namespace: 'questionBank',
  });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function QuestionBankPage({
  params,
}: QuestionBankPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect(`/${params.lng}/auth/signin`);
  }

  const t = await getTranslations('questionBank');

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <FileText className="h-8 w-8" />
          {t('title')}
        </h1>
        <p className="text-muted-foreground mt-2">{t('description')}</p>
      </div>

      <Suspense fallback={<QuestionBankSkeleton />}>
        <QuestionBankContent userId={session.user.id} lng={params.lng} />
      </Suspense>
    </div>
  );
}

function QuestionBankSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-10 w-32 animate-pulse rounded bg-gray-200" />
          <div className="h-10 w-40 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="h-10 w-24 animate-pulse rounded bg-gray-200" />
      </div>

      <div className="grid gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse space-y-3 rounded-lg border p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <div className="h-5 w-3/4 rounded bg-gray-200" />
                <div className="h-4 w-1/2 rounded bg-gray-200" />
              </div>
              <div className="h-6 w-16 rounded bg-gray-200" />
            </div>
            <div className="flex gap-2">
              <div className="h-5 w-12 rounded bg-gray-200" />
              <div className="h-5 w-16 rounded bg-gray-200" />
              <div className="h-5 w-14 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
