'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getAvailableLanguages } from '@/constants/languages';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';

interface LanguageSwitcherViewProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  currentLng: string;
  languages: ReturnType<typeof getAvailableLanguages>;
}

export function LanguageSwitcherView({
  isOpen,
  setIsOpen,
  currentLng,
  languages,
}: LanguageSwitcherViewProps) {
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
          <span className="sr-only">
            {currentLng === 'ja' ? '言語を切り替える' : 'Switch language'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" data-testid="language-switcher-menu">
        {languages.map(lang => (
          <Link
            key={lang.code}
            href={`/${lang.code}`}
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
}

export interface LanguageSwitcherProps {
  lng: string;
}

export function LanguageSwitcher({ lng }: LanguageSwitcherProps) {
  const t = useTranslations('common');
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <LanguageSwitcherView
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      currentLng={lng}
      languages={getAvailableLanguages(lng)}
    />
  );
}
