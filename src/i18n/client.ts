'use client';

import { useEffect, useState } from 'react';
import i18next from 'i18next';
import {
  initReactI18next,
  useTranslation as useTranslationOrg,
} from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { getOptions, languages } from './settings';

// Import translations directly to ensure consistency between server and client
import enTranslations from './locales/en.json';
import jaTranslations from './locales/ja.json';

const runsOnServerSide = typeof window === 'undefined';

// Initialize i18next for client side
i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    ...getOptions(),
    lng: undefined, // Let the language detector decide
    detection: {
      order: ['path', 'htmlTag', 'cookie', 'navigator'],
    },
    resources: {
      en: {
        translation: enTranslations,
      },
      ja: {
        translation: jaTranslations,
      },
    },
    preload: runsOnServerSide ? languages : [],
  });

export function useTranslation(
  lng: string,
  ns?: string,
  options?: { keyPrefix?: string }
) {
  const [mounted, setMounted] = useState(false);
  const ret = useTranslationOrg(ns, options);
  const { i18n } = ret;

  useEffect(() => {
    if (lng && i18n.resolvedLanguage !== lng) {
      i18n.changeLanguage(lng);
    }
    setMounted(true);
  }, [lng, i18n]);

  // When mounted on client, return the translation function
  if (mounted || runsOnServerSide) {
    return ret;
  }

  // When rendering on server, return a dummy function that returns the key
  return {
    ...ret,
    t: (key: string) => key,
  };
}
