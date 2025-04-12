
import i18n from '../lib/i18n';

export const getAvailableLanguages = () => [
  {
    code: "ja",
    name: i18n.t('common.languages.japanese'),
    flag: "🇯🇵"
  },
  {
    code: "en",
    name: i18n.t('common.languages.english'),
    flag: "🇺🇸"
  }
];

// Export a function to get the current languages to ensure they're translated
export const AVAILABLE_LANGUAGES = getAvailableLanguages();
