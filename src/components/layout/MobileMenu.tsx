'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { AuthButtons } from '../auth/AuthButtons';

export interface MobileMenuProps {
  translations: {
    features: string;
    pricing: string;
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

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="p-2 md:hidden"
      >
        {mobileMenuOpen ? <X /> : <Menu />}
      </button>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="absolute top-full right-0 left-0 border-t bg-white/80 px-4 py-4 backdrop-blur-md md:hidden">
          <nav className="flex flex-col gap-4">
            {isLandingPage && (
              <>
                <a
                  href="#features"
                  className="hover:text-examforge-blue text-sm font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {translations.features}
                </a>
                <a
                  href="#pricing"
                  className="hover:text-examforge-blue text-sm font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {translations.pricing}
                </a>
                <a
                  href="#faq"
                  className="hover:text-examforge-blue text-sm font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {translations.faq}
                </a>
              </>
            )}
            <div className="pt-2">
              <AuthButtons
                loginText={translations.login}
                signupText={translations.signup}
                lng={lng}
              />
            </div>
          </nav>
        </div>
      )}
    </>
  );
};
