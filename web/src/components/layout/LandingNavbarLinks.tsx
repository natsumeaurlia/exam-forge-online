'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface LandingNavbarLinksProps {
  lng: string;
  translations: {
    features: string;
    pricing: string;
    plans: string;
    faq: string;
  };
}

export function LandingNavbarLinks({
  lng,
  translations,
}: LandingNavbarLinksProps) {
  const pathname = usePathname();
  const isLandingPage = pathname === `/${lng}` || pathname === `/${lng}/`;

  const getLinkHref = (anchor: string) => {
    if (isLandingPage) {
      return anchor;
    }
    return `/${lng}${anchor}`;
  };

  return (
    <>
      <Link
        href={getLinkHref('#features')}
        className="hover:text-examforge-blue text-sm font-medium transition-colors"
        data-testid="nav-features"
      >
        {translations.features}
      </Link>
      <Link
        href={getLinkHref('#pricing')}
        className="hover:text-examforge-blue text-sm font-medium transition-colors"
        data-testid="nav-pricing"
      >
        {translations.pricing}
      </Link>
      <Link
        href={`/${lng}/plans`}
        className="hover:text-examforge-blue text-sm font-medium transition-colors"
        data-testid="nav-plans"
      >
        {translations.plans}
      </Link>
      <Link
        href={getLinkHref('#faq')}
        className="hover:text-examforge-blue text-sm font-medium transition-colors"
        data-testid="nav-faq"
      >
        {translations.faq}
      </Link>
    </>
  );
}
