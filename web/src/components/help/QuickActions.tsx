'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Download,
  MessageCircle,
  Book,
  Video,
  FileText,
  HelpCircle,
  MoreHorizontal,
  ExternalLink,
} from 'lucide-react';

interface QuickActionsProps {
  lng: string;
}

export function QuickActions({ lng }: QuickActionsProps) {
  const t = useTranslations('dashboard.help.quickActions');

  const handleDownloadGuide = (type: string) => {
    // Handle PDF guide download
    console.log('Downloading guide:', type);
  };

  const handleOpenChat = () => {
    // Open chat support widget
    console.log('Opening chat support');
  };

  const handleOpenKnowledgeBase = () => {
    // Open external knowledge base
    window.open('https://help.examforge.com', '_blank');
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={handleOpenChat}
        className="hidden sm:flex"
      >
        <MessageCircle className="mr-2 h-4 w-4" />
        {t('chat')}
      </Button>

      <Button
        variant="outline"
        onClick={() => handleDownloadGuide('quick-start')}
        className="hidden md:flex"
      >
        <Download className="mr-2 h-4 w-4" />
        {t('downloadGuide')}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">{t('moreActions')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={handleOpenChat} className="sm:hidden">
            <MessageCircle className="mr-2 h-4 w-4" />
            {t('chat')}
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleDownloadGuide('quick-start')}
            className="md:hidden"
          >
            <Download className="mr-2 h-4 w-4" />
            {t('downloadGuide')}
          </DropdownMenuItem>

          <DropdownMenuSeparator className="sm:hidden md:hidden" />

          <DropdownMenuItem onClick={() => handleDownloadGuide('user-manual')}>
            <Book className="mr-2 h-4 w-4" />
            {t('userManual')}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => handleDownloadGuide('api-docs')}>
            <FileText className="mr-2 h-4 w-4" />
            {t('apiDocs')}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleOpenKnowledgeBase}>
            <ExternalLink className="mr-2 h-4 w-4" />
            {t('knowledgeBase')}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem>
            <Video className="mr-2 h-4 w-4" />
            {t('videoTutorials')}
          </DropdownMenuItem>

          <DropdownMenuItem>
            <HelpCircle className="mr-2 h-4 w-4" />
            {t('troubleshooting')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
