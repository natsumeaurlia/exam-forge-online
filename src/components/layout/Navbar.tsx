
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Navbar() {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b">
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
            {t('common.features')}
          </a>
          <a href="#pricing" className="text-sm font-medium hover:text-examforge-blue transition-colors">
            {t('common.pricing')}
          </a>
          <a href="#faq" className="text-sm font-medium hover:text-examforge-blue transition-colors">
            {t('common.faq')}
          </a>
        </nav>
        
        <div className="hidden md:flex items-center gap-4">
          <LanguageSwitcher />
          <Button variant="ghost">{t('common.login')}</Button>
          <Button>{t('common.signup')}</Button>
        </div>
        
        {/* Mobile menu button */}
        <div className="md:hidden flex items-center gap-2">
          <LanguageSwitcher />
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="p-2"
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden py-4 px-4 border-t">
          <nav className="flex flex-col gap-4">
            <a 
              href="#features" 
              className="text-sm font-medium hover:text-examforge-blue transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('common.features')}
            </a>
            <a 
              href="#pricing" 
              className="text-sm font-medium hover:text-examforge-blue transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('common.pricing')}
            </a>
            <a 
              href="#faq" 
              className="text-sm font-medium hover:text-examforge-blue transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('common.faq')}
            </a>
            <div className="flex flex-col gap-2 pt-2">
              <Button variant="outline" className="w-full justify-center">{t('common.login')}</Button>
              <Button className="w-full justify-center">{t('common.signup')}</Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
