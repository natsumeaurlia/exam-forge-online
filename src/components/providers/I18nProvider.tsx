'use client';

import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { getOptions } from '../../i18n/settings';

// Initialize i18next for client side
const i18n = i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(resourcesToBackend((language: string, namespace: string) => 
    import(`../../i18n/locales/${language}.json`).then(m => m.default)
  ))
  .init({
    ...getOptions(),
    lng: undefined, // Let the language detector decide
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export function I18nProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Handle client-side i18n initialization
  useEffect(() => {
    // Any client-side i18n initialization if needed
  }, []);

  return <I18nextProvider i18n={i18next}>{children}</I18nextProvider>;
}