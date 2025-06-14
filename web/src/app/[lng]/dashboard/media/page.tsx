import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { MediaGallery } from '@/components/media/MediaGallery';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lng: string }>;
}) {
  const { lng } = await params;
  const t = await getTranslations({ locale: lng, namespace: 'media' });
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function MediaPage({
  params,
}: {
  params: Promise<{ lng: string }>;
}) {
  const { lng } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect(`/${lng}/auth/signin`);
  }

  const t = await getTranslations({ locale: lng, namespace: 'media' });

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-2">{t('description')}</p>
      </div>
      <MediaGallery lng={lng} />
    </div>
  );
}
