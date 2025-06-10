import { LanguageSwitcher } from './LanguageSwitcher';
import { MobileMenu } from './MobileMenu';
import { AuthButtons } from '../auth/AuthButtons';
import { UserMenu } from './UserMenu';
import { LandingNavbarActions } from './LandingNavbarActions';
import { LandingNavbarLinks } from './LandingNavbarLinks';
import { getTranslations } from 'next-intl/server';
import { NavbarLogo } from './NavbarLogo';

export interface LandingNavbarProps {
  lng: string;
}

export const LandingNavbar = async ({ lng }: LandingNavbarProps) => {
  const t = await getTranslations();

  const translations = {
    features: t('common.features'),
    pricing: t('common.pricing'),
    plans: t('common.plans.details'),
    faq: t('common.faq'),
    login: t('common.login'),
    signup: t('common.signup'),
  };

  return (
    <header
      className="relative sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md"
      data-testid="navbar"
    >
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <NavbarLogo lng={lng} />

        {/* Desktop Navigation */}
        <nav
          className="hidden items-center gap-6 md:flex"
          data-testid="navbar-desktop-nav"
        >
          <LandingNavbarLinks
            lng={lng}
            translations={{
              features: translations.features,
              pricing: translations.pricing,
              plans: translations.plans,
              faq: translations.faq,
            }}
          />
        </nav>

        <div
          className="hidden items-center gap-4 md:flex"
          data-testid="navbar-desktop-actions"
        >
          <LandingNavbarActions
            lng={lng}
            translations={{
              login: translations.login,
              signup: translations.signup,
            }}
          />
        </div>

        {/* Mobile menu */}
        <div
          className="flex items-center gap-2 md:hidden"
          data-testid="navbar-mobile-actions"
        >
          <LanguageSwitcher lng={lng} />
          <MobileMenu
            translations={{
              features: translations.features,
              pricing: translations.pricing,
              plans: translations.plans,
              faq: translations.faq,
              login: translations.login,
              signup: translations.signup,
            }}
            lng={lng}
            isLandingPage={true}
          />
        </div>
      </div>
    </header>
  );
};
