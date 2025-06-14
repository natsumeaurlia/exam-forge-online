'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useQuizPreviewStore } from '@/stores/useQuizPreviewStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Monitor, Smartphone, Play } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface QuizPreviewHeaderProps {
  quizId: string;
  lng: string;
}

export function QuizPreviewHeader({ quizId, lng }: QuizPreviewHeaderProps) {
  const t = useTranslations('quiz.preview');
  const { deviceMode, setDeviceMode } = useQuizPreviewStore();

  const handleTakeQuiz = () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const takeUrl = `${baseUrl}/quiz/${quizId}`;
    window.open(takeUrl, '_blank');
  };

  return (
    <div className="sticky top-0 z-50 border-b bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left section - Back button and badge */}
          <div className="flex min-w-0 items-center gap-2">
            <Link href={`/${lng}/dashboard/quizzes/${quizId}/edit`}>
              <Button variant="ghost" size="icon" className="sm:hidden">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="hidden sm:flex">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('backToEdit')}
              </Button>
            </Link>

            <Badge
              variant="secondary"
              className="hidden whitespace-nowrap sm:flex"
            >
              {t('previewMode')}
            </Badge>
          </div>

          {/* Right section - Take Quiz button, Device selector and preview link */}
          <div className="flex items-center gap-2">
            {/* Take Quiz Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleTakeQuiz}
              className="hidden sm:flex"
            >
              <Play className="mr-2 h-4 w-4" />
              {t('takeQuiz')}
            </Button>

            {/* Mobile: Take Quiz Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleTakeQuiz}
              className="sm:hidden"
            >
              <Play className="h-4 w-4" />
            </Button>

            {/* Desktop: Show buttons side by side */}
            <div className="hidden items-center rounded-lg bg-gray-100 p-1 sm:flex">
              <Button
                variant={deviceMode === 'desktop' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDeviceMode('desktop')}
                className="h-8 px-3"
              >
                <Monitor className="mr-2 h-4 w-4" />
                {t('desktop')}
              </Button>
              <Button
                variant={deviceMode === 'mobile' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDeviceMode('mobile')}
                className="h-8 px-3"
              >
                <Smartphone className="mr-2 h-4 w-4" />
                {t('mobile')}
              </Button>
            </div>

            {/* Mobile: Show dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="sm:hidden">
                <Button variant="outline" size="sm">
                  {deviceMode === 'desktop' ? (
                    <Monitor className="h-4 w-4" />
                  ) : (
                    <Smartphone className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setDeviceMode('desktop')}
                  className="flex items-center gap-2"
                >
                  <Monitor className="h-4 w-4" />
                  {t('desktop')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeviceMode('mobile')}
                  className="flex items-center gap-2"
                >
                  <Smartphone className="h-4 w-4" />
                  {t('mobile')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
