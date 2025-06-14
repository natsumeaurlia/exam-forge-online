import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { HelpClient } from '@/components/help/HelpClient';

export async function generateMetadata({
  params: { lng },
}: {
  params: { lng: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: lng });

  return {
    title: t('help.title'),
    description: t('help.description'),
  };
}

export default function HelpPage({
  params: { lng },
}: {
  params: { lng: string };
}) {
  return <HelpClient lng={lng} />;
}
