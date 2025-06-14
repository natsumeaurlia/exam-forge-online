import { Suspense } from 'react';
import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { NotificationList } from '@/components/notifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell } from 'lucide-react';

interface NotificationsPageProps {
  params: { lng: string };
}

export async function generateMetadata({
  params,
}: NotificationsPageProps): Promise<Metadata> {
  const t = await getTranslations({
    locale: params.lng,
    namespace: 'notifications',
  });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function NotificationsPage({
  params,
}: NotificationsPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect(`/${params.lng}/auth/signin`);
  }

  const t = await getTranslations('notifications');

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Bell className="h-8 w-8" />
          {t('title')}
        </h1>
        <p className="text-muted-foreground mt-2">{t('description')}</p>
      </div>

      <Suspense fallback={<NotificationsSkeleton />}>
        <NotificationList userId={session.user.id} limit={50} />
      </Suspense>
    </div>
  );
}

function NotificationsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="animate-pulse">
            <div className="mb-2 h-6 w-32 rounded bg-gray-200" />
          </div>
          <div className="animate-pulse">
            <div className="h-8 w-24 rounded bg-gray-200" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-start space-x-3">
                <div className="h-8 w-8 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-gray-200" />
                  <div className="h-3 w-1/2 rounded bg-gray-200" />
                  <div className="flex gap-2">
                    <div className="h-5 w-16 rounded bg-gray-200" />
                    <div className="h-5 w-20 rounded bg-gray-200" />
                  </div>
                </div>
                <div className="h-3 w-16 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
