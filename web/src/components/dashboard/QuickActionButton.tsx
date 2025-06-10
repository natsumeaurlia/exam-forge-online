'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Plus,
  UserPlus,
  BarChart3,
  Settings,
  FileText,
  Users,
  Download,
  Palette,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreateQuizModal } from '@/components/quiz/CreateQuizModal';

interface QuickAction {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  description: string;
  href?: string;
  onClick?: () => void;
}

interface QuickActionButtonProps {
  lng: string;
}

export function QuickActionButton({ lng }: QuickActionButtonProps) {
  const t = useTranslations('dashboard.quickActions');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const quickActions: QuickAction[] = [
    {
      key: 'createQuiz',
      icon: Plus,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      description: t('createQuiz.description'),
      onClick: () => setIsCreateModalOpen(true),
    },
    {
      key: 'inviteUsers',
      icon: UserPlus,
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100',
      description: t('inviteUsers.description'),
      onClick: () => {
        // Open invite modal
        console.log('Open invite modal');
      },
    },
    {
      key: 'viewReports',
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100',
      description: t('viewReports.description'),
      href: `/${lng}/reports`,
    },
    {
      key: 'manageSettings',
      icon: Settings,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 hover:bg-orange-100',
      description: t('manageSettings.description'),
      href: `/${lng}/settings`,
    },
  ];

  // 追加のアクション（プロプラン限定など）
  const additionalActions: QuickAction[] = [
    {
      key: 'questionBank',
      icon: FileText,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 hover:bg-indigo-100',
      description: t('questionBank.description'),
      href: `/${lng}/question-bank`,
    },
    {
      key: 'memberManagement',
      icon: Users,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50 hover:bg-pink-100',
      description: t('memberManagement.description'),
      href: `/${lng}/members`,
    },
    {
      key: 'exportData',
      icon: Download,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50 hover:bg-teal-100',
      description: t('exportData.description'),
      onClick: () => {
        // Export data
        console.log('Export data');
      },
    },
    {
      key: 'customizeTheme',
      icon: Palette,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50 hover:bg-rose-100',
      description: t('customizeTheme.description'),
      href: `/${lng}/customize`,
    },
  ];

  const handleActionClick = (action: QuickAction) => {
    if (action.onClick) {
      action.onClick();
    } else if (action.href) {
      window.location.href = action.href;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* メインアクション */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {quickActions.map(action => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.key}
                  variant="ghost"
                  className={`flex h-auto flex-col items-center space-y-2 p-4 ${action.bgColor} border border-gray-200 transition-all duration-200 hover:scale-105`}
                  onClick={() => handleActionClick(action)}
                >
                  <div className={`rounded-full bg-white p-3 shadow-sm`}>
                    <Icon className={`h-6 w-6 ${action.color}`} />
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-gray-900">
                      {t(`${action.key}.label`)}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {action.description}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>

          {/* 追加アクション */}
          <div className="border-t pt-4">
            <h4 className="mb-3 text-sm font-medium text-gray-700">
              {t('moreActions')}
            </h4>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {additionalActions.map(action => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.key}
                    variant="ghost"
                    size="sm"
                    className={`flex h-auto flex-col items-center space-y-1 p-3 ${action.bgColor} transition-all duration-200`}
                    onClick={() => handleActionClick(action)}
                  >
                    <Icon className={`h-4 w-4 ${action.color}`} />
                    <span className="text-center text-xs leading-tight text-gray-700">
                      {t(`${action.key}.label`)}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* ヘルプリンク */}
          <div className="mt-6 border-t pt-4 text-center">
            <p className="mb-2 text-sm text-gray-500">{t('needHelp')}</p>
            <Button variant="link" size="sm" className="text-blue-600">
              {t('helpCenter')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Create Quiz Modal */}
      <CreateQuizModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
}
