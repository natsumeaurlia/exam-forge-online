
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AVAILABLE_LANGUAGES } from "@/constants/languages";

interface LanguageSwitcherViewProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  changeLanguage: (lng: string) => void;
  languages: typeof AVAILABLE_LANGUAGES;
}

export function LanguageSwitcherView({ isOpen, setIsOpen, changeLanguage, languages }: LanguageSwitcherViewProps) {
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Globe className="h-5 w-5" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map(lang => (
          <DropdownMenuItem key={lang.code} onClick={() => changeLanguage(lang.code)}>
            {lang.flag} {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng); // 明示的にlocalStorageに保存
    setIsOpen(false);
    console.log('Language changed to:', lng);
    // 言語変更後にページをリロードして全てのコンポーネントに反映させる
    window.location.reload();
  };
  
  return (
    <LanguageSwitcherView
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      changeLanguage={changeLanguage}
      languages={AVAILABLE_LANGUAGES}
    />
  );
}
