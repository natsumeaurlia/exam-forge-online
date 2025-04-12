
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 翻訳ファイルをインポート
import translationEN from '../locales/en.json';
import translationJA from '../locales/ja.json';

// 利用可能な言語
const resources = {
  en: {
    translation: translationEN
  },
  ja: {
    translation: translationJA
  }
};

// i18nインスタンスの初期化
i18n
  // 言語検出プラグインを使う
  .use(LanguageDetector)
  // i18nextとReactを連携
  .use(initReactI18next)
  // 初期化
  .init({
    resources,
    fallbackLng: 'ja',
    lng: localStorage.getItem('i18nextLng') || 'ja', // デフォルト言語を明示的に設定
    interpolation: {
      escapeValue: false, // Reactでは必要ない
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    react: {
      useSuspense: false // Suspenseを使用しない設定
    }
  });

console.log('i18n initialized with language:', i18n.language);

export default i18n;
