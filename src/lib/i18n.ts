
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import translationEN from '../locales/en.json';
import translationJA from '../locales/ja.json';

// Available languages
const resources = {
  en: {
    translation: translationEN
  },
  ja: {
    translation: translationJA
  }
};

// Initialize i18n instance if it hasn't been initialized yet
if (!i18n.isInitialized) {
  i18n
    // Use language detection plugin
    .use(LanguageDetector)
    // Connect i18next with React
    .use(initReactI18next)
    // Initialize
    .init({
      resources,
      fallbackLng: 'ja',
      lng: typeof localStorage !== 'undefined' ? localStorage.getItem('i18nextLng') || 'ja' : 'ja',
      interpolation: {
        escapeValue: false, // Not needed for React
      },
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
      },
      react: {
        useSuspense: false // Don't use Suspense
      }
    });

  console.log('i18n initialized with language:', i18n.language);
}

export default i18n;
