import React from 'react';
import { useTranslations } from 'next-intl';

export default function TermsPage() {
  const t = useTranslations('terms');

  return (
    <div className="container mx-auto px-4 py-12" data-testid="terms-page">
      <h1 className="mb-6 text-3xl font-bold" data-testid="terms-title">
        {t('title')}
      </h1>
      <div className="prose max-w-none" data-testid="terms-content">
        <p data-testid="last-updated">{t('lastUpdated')}</p>

        <h2 data-testid="section-acceptance">
          {t('sections.acceptance.title')}
        </h2>
        <p data-testid="acceptance-content">
          {t('sections.acceptance.content')}
        </p>

        <h2 data-testid="section-use">{t('sections.use.title')}</h2>
        <p data-testid="use-content">{t('sections.use.content')}</p>

        <h2 data-testid="section-accounts">{t('sections.accounts.title')}</h2>
        <p data-testid="accounts-content">{t('sections.accounts.content')}</p>

        <h2 data-testid="section-ip">{t('sections.ip.title')}</h2>
        <p data-testid="ip-content">{t('sections.ip.content')}</p>

        <h2 data-testid="section-termination">
          {t('sections.termination.title')}
        </h2>
        <p data-testid="termination-content">
          {t('sections.termination.content')}
        </p>

        <h2 data-testid="section-changes">{t('sections.changes.title')}</h2>
        <p data-testid="changes-content">{t('sections.changes.content')}</p>
      </div>
    </div>
  );
}
