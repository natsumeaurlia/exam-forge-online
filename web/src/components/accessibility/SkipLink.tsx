'use client';

import { useTranslations } from 'next-intl';

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
}

export function SkipLink({ href, children }: SkipLinkProps) {
  return (
    <a
      href={href}
      className="absolute top-auto left-[-10000px] z-[9999] h-[1px] w-[1px] overflow-hidden focus:top-2 focus:left-2 focus:h-auto focus:w-auto focus:bg-white focus:p-2 focus:text-black focus:underline focus:shadow-lg"
    >
      {children}
    </a>
  );
}

export function SkipLinks() {
  const t = useTranslations('accessibility');

  return (
    <>
      <SkipLink href="#main-content">
        {t('skipToMain', { fallback: 'Skip to main content' })}
      </SkipLink>
      <SkipLink href="#navigation">
        {t('skipToNavigation', { fallback: 'Skip to navigation' })}
      </SkipLink>
    </>
  );
}
