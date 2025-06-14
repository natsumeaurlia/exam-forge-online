import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { TemplateListHeader } from '@/components/template/TemplateListHeader';
import { TemplateListContent } from '@/components/template/TemplateListContent';
import { TemplateListSkeleton } from '@/components/template/TemplateListSkeleton';

interface TemplatesPageProps {
  params: { lng: string };
  searchParams?: {
    page?: string;
    search?: string;
    category?: string;
    isPublic?: string;
    sort?: string;
    order?: string;
    tags?: string;
  };
}

export async function generateMetadata({
  params,
}: {
  params: { lng: string };
}) {
  const t = await getTranslations('templateManagement.page');

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function TemplatesPage({
  params,
  searchParams = {},
}: TemplatesPageProps) {
  const t = await getTranslations('templateManagement.page');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
      </div>

      {/* Template List Header with Create Button */}
      <TemplateListHeader lng={params.lng} />

      {/* Template List Content */}
      <Suspense
        key={JSON.stringify(searchParams)}
        fallback={<TemplateListSkeleton />}
      >
        <TemplateListContent searchParams={searchParams} lng={params.lng} />
      </Suspense>
    </div>
  );
}
