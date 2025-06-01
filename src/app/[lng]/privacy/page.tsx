'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { DefaultLayout } from '@/components/layout/DefaultLayout';
import { useParams } from 'next/navigation';

export default function PrivacyPage() {
  const t = useTranslations('privacy');
  const params = useParams();
  const lng = params.lng as string;

  return (
    <DefaultLayout lng={lng}>
      <div className="container mx-auto px-4 py-12">
        <h1 className="mb-6 text-3xl font-bold">{t('title')}</h1>
        <div className="prose max-w-none">
          <p>{t('lastUpdated')}</p>

          <h2>{t('sections.introduction.title')}</h2>
          <p>{t('sections.introduction.content')}</p>

          <h2>{t('sections.collection.title')}</h2>
          <p>{t('sections.collection.content')}</p>

          <h2>{t('sections.usage.title')}</h2>
          <p>{t('sections.usage.content')}</p>

          <h2>{t('sections.security.title')}</h2>
          <p>{t('sections.security.content')}</p>

          <h2>{t('sections.rights.title')}</h2>
          <p>{t('sections.rights.content')}</p>

          <h2>{t('sections.changes.title')}</h2>
          <p>{t('sections.changes.content')}</p>
        </div>
      </div>
    </DefaultLayout>
  );
}
