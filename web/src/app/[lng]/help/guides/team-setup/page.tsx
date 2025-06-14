import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { GuideLayout } from '@/components/help/GuideLayout';

interface TeamSetupGuideProps {
  params: Promise<{ lng: string }>;
}

export async function generateMetadata({
  params: { lng },
}: {
  params: { lng: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: lng });

  return {
    title: t('help.guides.teamSetup.title'),
    description: t('help.guides.teamSetup.description'),
  };
}

export default async function TeamSetupGuide({ params }: TeamSetupGuideProps) {
  const { lng } = await params;

  return (
    <GuideLayout
      lng={lng}
      guideId="team-setup"
      title="help.guides.teamSetup.title"
    />
  );
}
