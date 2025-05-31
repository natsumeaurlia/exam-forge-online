import fs from 'fs';
import path from 'path';
import { fallbackLng } from './settings';

// Load translations from JSON files
const loadTranslations = (locale: string) => {
  try {
    const filePath = path.join(
      process.cwd(),
      'src',
      'i18n',
      'locales',
      `${locale}.json`
    );
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error loading translations for ${locale}:`, error);
    return {};
  }
};

// Simple translation function for server components
export async function useTranslation(
  lng: string,
  ns: string = 'translation',
  options: { keyPrefix?: string } = {}
) {
  const locale = lng || fallbackLng;
  const translations = loadTranslations(locale);

  // Simple translation function
  const t = (key: string) => {
    const keys = key.split('.');
    let value = translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Return the key if translation not found
      }
    }

    return typeof value === 'string' ? value : key;
  };

  return {
    t,
    i18n: {
      language: locale,
    },
  };
}
