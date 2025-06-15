import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SettingsClient } from '@/components/settings/SettingsClient';

export async function generateMetadata({
  params: { lng },
}: {
  params: { lng: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: lng });

  return {
    title: t('settings.title'),
    description: t('settings.description'),
  };
}

export default function SettingsPage({
  params: { lng },
}: {
  params: { lng: string };
}) {
  return <SettingsClient lng={lng} />;
}
