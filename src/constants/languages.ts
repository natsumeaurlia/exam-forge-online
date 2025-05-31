'use client';

export const getAvailableLanguages = (currentLng: string = 'ja') => [
  {
    code: "ja",
    name: currentLng === 'ja' ? '日本語' : 'Japanese',
    flag: "🇯🇵"
  },
  {
    code: "en",
    name: currentLng === 'ja' ? '英語' : 'English',
    flag: "🇺🇸"
  }
];

// Export the languages with default translations
export const AVAILABLE_LANGUAGES = getAvailableLanguages();
