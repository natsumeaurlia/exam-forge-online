'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getAvailableLanguages } from '@/constants/languages';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface LanguageSwitcherViewProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  currentLng: string;
  languages: ReturnType<typeof getAvailableLanguages>;
}

export const LanguageSwitcherView = ({
  isOpen,
  setIsOpen,
  currentLng,
  languages,
}: LanguageSwitcherViewProps) => {
  const t = useTranslations('common.languages');
  const pathname = usePathname();

  // Remove the current language code from the pathname to get the base path
  const pathWithoutLang = pathname.replace(`/${currentLng}`, '');
  // If the path is empty or just '/', ensure we have a proper path
  const basePath = pathWithoutLang || '';

  return (
    <DropdownMenu
      open={isOpen}
      onOpenChange={setIsOpen}
      data-testid="language-switcher"
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          data-testid="language-switcher-button"
        >
          <Globe className="h-5 w-5" />
          <span className="sr-only">{t('switchLanguage')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" data-testid="language-switcher-menu">
        {languages.map(lang => (
          <Link
            key={lang.code}
            href={`/${lang.code}${basePath}`}
            onClick={() => setIsOpen(false)}
          >
            <DropdownMenuItem data-testid={`language-option-${lang.code}`}>
              {lang.flag} {lang.name}
            </DropdownMenuItem>
          </Link>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export interface LanguageSwitcherProps {
  lng: string;
}

export const LanguageSwitcher = ({ lng }: LanguageSwitcherProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <LanguageSwitcherView
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      currentLng={lng}
      languages={getAvailableLanguages(lng)}
    />
  );
};
