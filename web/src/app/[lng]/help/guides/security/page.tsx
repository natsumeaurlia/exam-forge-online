import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { GuideLayout } from '@/components/help/GuideLayout';

interface SecurityGuideProps {
  params: Promise<{ lng: string }>;
}

export async function generateMetadata({
  params: { lng },
}: {
  params: { lng: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: lng });

  return {
    title: t('help.guides.security.title'),
    description: t('help.guides.security.description'),
  };
}

export default async function SecurityGuide({ params }: SecurityGuideProps) {
  const { lng } = await params;

  return (
    <GuideLayout
      lng={lng}
      guideId="security"
      title="help.guides.security.title"
    />
  );
}
