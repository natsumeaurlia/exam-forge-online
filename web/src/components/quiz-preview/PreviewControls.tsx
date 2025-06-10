'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuizPreviewStore } from '@/stores/useQuizPreviewStore';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { RotateCcw, Settings, Languages, SkipForward } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function PreviewControls() {
  const t = useTranslations('quiz.preview');
  const { resetPreview, navigateToQuestion } = useQuizPreviewStore();
  const [language, setLanguage] = useState('ja');

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          className="fixed right-6 bottom-6 rounded-full shadow-lg"
          size="icon"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t('controls.title')}</SheetTitle>
          <SheetDescription>{t('controls.description')}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div>
            <h4 className="mb-2 text-sm font-medium">
              {t('controls.actions')}
            </h4>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={resetPreview}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                {t('controls.resetPreview')}
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigateToQuestion(0)}
              >
                <SkipForward className="mr-2 h-4 w-4" />
                {t('controls.jumpToQuestion')}
              </Button>
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium">
              {t('controls.language')}
            </h4>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <Languages className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ja">日本語</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-muted-foreground pt-4 text-sm">
            <p>{t('controls.note')}</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
