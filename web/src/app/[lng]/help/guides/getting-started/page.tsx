import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { GuideLayout } from '@/components/help/GuideLayout';

interface GettingStartedGuideProps {
  params: Promise<{ lng: string }>;
}

export async function generateMetadata({
  params: { lng },
}: {
  params: { lng: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: lng });

  return {
    title: t('help.guides.gettingStarted.title'),
    description: t('help.guides.gettingStarted.description'),
  };
}

export default async function GettingStartedGuide({
  params,
}: GettingStartedGuideProps) {
  const { lng } = await params;

  return (
    <GuideLayout
      lng={lng}
      guideId="getting-started"
      title="help.guides.gettingStarted.title"
    />
  );
}
