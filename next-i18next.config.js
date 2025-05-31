/** @type {import('next-i18next').UserConfig} */
const config = {
  i18n: {
    defaultLocale: 'ja',
    locales: ['en', 'ja'],
    localeDetection: true,
  },
  localePath: './src/i18n/locales',
  reloadOnPrerender: process.env.NODE_ENV === 'development',
}

module.exports = config;