import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileMenu } from "./MobileMenu";
import { AuthButtons } from "./AuthButtons";
import { useTranslation } from "../../i18n";

export interface NavbarProps {
  lng: string;
}

export async function Navbar({ lng }: NavbarProps) {
  const { t } = await useTranslation(lng);
  
  const translations = {
    features: t('common.features'),
    pricing: t('common.pricing'),
    faq: t('common.faq'),
    login: t('common.login'),
    signup: t('common.signup'),
  };
  
  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b relative">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-examforge-blue to-examforge-blue-dark flex items-center justify-center text-white font-bold text-xl">
            E
          </div>
          <span className="text-xl font-bold">ExamForge</span>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-sm font-medium hover:text-examforge-blue transition-colors">
            {translations.features}
          </a>
          <a href="#pricing" className="text-sm font-medium hover:text-examforge-blue transition-colors">
            {translations.pricing}
          </a>
          <a href="#faq" className="text-sm font-medium hover:text-examforge-blue transition-colors">
            {translations.faq}
          </a>
        </nav>
        
        <div className="hidden md:flex items-center gap-4">
          <LanguageSwitcher lng={lng} />
          <AuthButtons
            loginText={translations.login}
            signupText={translations.signup}
            lng={lng}
          />
        </div>
        
        {/* Mobile menu */}
        <div className="md:hidden flex items-center gap-2">
          <LanguageSwitcher lng={lng} />
          <MobileMenu translations={translations} lng={lng} />
        </div>
      </div>
    </header>
  );
}
