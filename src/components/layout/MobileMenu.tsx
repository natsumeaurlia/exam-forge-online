'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export interface MobileMenuProps {
  translations: {
    features: string;
    pricing: string;
    faq: string;
    login: string;
    signup: string;
  };
}

export function MobileMenu({ translations }: MobileMenuProps) {
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
        <div className="absolute top-full left-0 right-0 md:hidden py-4 px-4 border-t bg-white/80 backdrop-blur-md">
          <nav className="flex flex-col gap-4">
            <a 
              href="#features" 
              className="text-sm font-medium hover:text-examforge-blue transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {translations.features}
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium hover:text-examforge-blue transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {translations.pricing}
            </a>
            <a
              href="#faq"
              className="text-sm font-medium hover:text-examforge-blue transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {translations.faq}
            </a>
            <div className="flex flex-col gap-2 pt-2">
              <Button variant="outline" className="w-full justify-center">{translations.login}</Button>
              <Button className="w-full justify-center">{translations.signup}</Button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}