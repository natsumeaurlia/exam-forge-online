import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { GuideLayout } from '@/components/help/GuideLayout';

interface BillingGuideProps {
  params: Promise<{ lng: string }>;
}

export async function generateMetadata({
  params: { lng },
}: {
  params: { lng: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: lng });

  return {
    title: t('help.guides.billing.title'),
    description: t('help.guides.billing.description'),
  };
}

export default async function BillingGuide({ params }: BillingGuideProps) {
  const { lng } = await params;

  return (
    <GuideLayout
      lng={lng}
      guideId="billing"
      title="help.guides.billing.title"
    />
  );
}
