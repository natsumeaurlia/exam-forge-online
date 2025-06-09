import { LanguageSwitcher } from './LanguageSwitcher';
import { MobileMenu } from './MobileMenu';
import { AuthButtons } from '../auth/AuthButtons';
import { getTranslations } from 'next-intl/server';
import { NavbarLogo } from './NavbarLogo';

export interface NavbarProps {
  lng: string;
}

export const Navbar = async ({ lng }: NavbarProps) => {
  const t = await getTranslations();

  const translations = {
    features: t('common.features'),
    pricing: t('common.pricing'),
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

        {/* Desktop Navigation - 空のスペース */}
        <div className="hidden md:flex"></div>

        <div
          className="hidden items-center gap-4 md:flex"
          data-testid="navbar-desktop-actions"
        >
          <LanguageSwitcher lng={lng} />
          <AuthButtons
            loginText={translations.login}
            signupText={translations.signup}
            lng={lng}
          />
        </div>

        {/* Mobile menu */}
        <div
          className="flex items-center gap-2 md:hidden"
          data-testid="navbar-mobile-actions"
        >
          <LanguageSwitcher lng={lng} />
          <MobileMenu
            translations={translations}
            lng={lng}
            isLandingPage={false}
          />
        </div>
      </div>
    </header>
  );
};
