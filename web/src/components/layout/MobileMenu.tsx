'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { AuthButtons } from '../auth/AuthButtons';
import { UserMenu } from './UserMenu';
import Link from 'next/link';

export interface MobileMenuProps {
  translations: {
    features: string;
    pricing: string;
    plans?: string;
    faq: string;
    login: string;
    signup: string;
  };
  lng: string;
  isLandingPage?: boolean;
}

export const MobileMenu = ({
  translations,
  lng,
  isLandingPage = false,
}: MobileMenuProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();
  const isActuallyLandingPage =
    pathname === `/${lng}` || pathname === `/${lng}/`;

  const getLinkHref = (anchor: string) => {
    if (isActuallyLandingPage) {
      return anchor;
    }
    return `/${lng}${anchor}`;
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="p-2 md:hidden"
        aria-expanded={mobileMenuOpen}
        aria-controls="mobile-navigation"
        aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
      >
        {mobileMenuOpen ? (
          <X aria-hidden="true" />
        ) : (
          <Menu aria-hidden="true" />
        )}
      </button>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="absolute top-full right-0 left-0 border-t bg-white/80 px-4 py-4 backdrop-blur-md md:hidden">
          <nav
            id="mobile-navigation"
            className="flex flex-col gap-4"
            aria-label="Mobile navigation"
          >
            <Link
              href={getLinkHref('#features')}
              className="hover:text-examforge-blue text-sm font-medium transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {translations.features}
            </Link>
            <Link
              href={getLinkHref('#pricing')}
              className="hover:text-examforge-blue text-sm font-medium transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {translations.pricing}
            </Link>
            <Link
              href={`/${lng}/plans`}
              className="hover:text-examforge-blue text-sm font-medium transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {translations.plans || 'Plans'}
            </Link>
            <Link
              href={getLinkHref('#faq')}
              className="hover:text-examforge-blue text-sm font-medium transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {translations.faq}
            </Link>
            <div className="pt-2">
              {session ? (
                <UserMenu lng={lng} showDashboardLink={true} />
              ) : (
                <AuthButtons
                  loginText={translations.login}
                  signupText={translations.signup}
                  lng={lng}
                />
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
};
