import { LanguageSwitcher } from './LanguageSwitcher';
import { MobileMenu } from './MobileMenu';
import { AuthButtons } from '../auth/AuthButtons';
import { getTranslations } from 'next-intl/server';

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
        <div className="flex items-center gap-2" data-testid="navbar-logo">
          <div className="from-examforge-blue to-examforge-blue-dark flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br text-xl font-bold text-white">
            E
          </div>
          <span className="text-xl font-bold">ExamForge</span>
        </div>

        {/* Desktop Navigation */}
        <nav
          className="hidden items-center gap-6 md:flex"
          data-testid="navbar-desktop-nav"
        >
          <a
            href="#features"
            className="hover:text-examforge-blue text-sm font-medium transition-colors"
            data-testid="nav-features"
          >
            {translations.features}
          </a>
          <a
            href="#pricing"
            className="hover:text-examforge-blue text-sm font-medium transition-colors"
            data-testid="nav-pricing"
          >
            {translations.pricing}
          </a>
          <a
            href="#faq"
            className="hover:text-examforge-blue text-sm font-medium transition-colors"
            data-testid="nav-faq"
          >
            {translations.faq}
          </a>
        </nav>

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
          <MobileMenu translations={translations} lng={lng} />
        </div>
      </div>
    </header>
  );
};
