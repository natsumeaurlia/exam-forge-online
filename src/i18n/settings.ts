export const fallbackLng = 'ja' as const;
export const languages = ['en', 'ja'] as const;
export const defaultNS = 'common' as const;

export type Language = typeof languages[number];

export function getOptions(lng = fallbackLng, ns = defaultNS) {
  return {
    // debug: true,
    supportedLngs: languages,
    fallbackLng,
    lng,
    fallbackNS: defaultNS,
    defaultNS,
    ns,
  };
}
