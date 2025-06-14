'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useDashboard } from '@/hooks/use-dashboard';
import { useSidebarStore } from '@/stores/useSidebarStore';
import { useUserPlan } from '@/hooks/use-user-plan';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  BookOpen,
  FileText,
  Home,
  PlusCircle,
  Settings,
  Users,
  X,
  ChevronLeft,
  ChevronRight,
  Image,
  HelpCircle,
} from 'lucide-react';
import { CreateQuizModal } from '@/components/quiz/CreateQuizModal';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SideNavigationProps {
  lng: string;
}

export function SideNavigation({ lng }: SideNavigationProps) {
  const t = useTranslations('dashboard');
  const { isSidebarOpen, closeSidebar } = useDashboard();
  const { isOpen: isDesktopSidebarOpen, toggleSidebar } = useSidebarStore();
  const { isPro, isPremium } = useUserPlan();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const hasPaidPlan = isPro || isPremium;

  const navigationItems = [
    {
      href: `/${lng}/dashboard`,
      icon: Home,
      label: t('navigation.dashboard'),
    },
    {
      href: `/${lng}/dashboard/quizzes`,
      icon: BookOpen,
      label: t('navigation.quizzes'),
    },
    {
      href: '#',
      icon: PlusCircle,
      label: t('navigation.createQuiz'),
      onClick: () => setIsCreateModalOpen(true),
    },
    {
      href: `/${lng}/dashboard/analytics`,
      icon: BarChart3,
      label: t('navigation.analytics'),
    },
    {
      href: `/${lng}/dashboard/templates`,
      icon: FileText,
      label: t('navigation.templates'),
    },
    {
      href: `/${lng}/dashboard/media`,
      icon: Image,
      label: t('navigation.media'),
    },
    {
      href: `/${lng}/dashboard/team/members`,
      icon: Users,
      label: t('navigation.members'),
    },
    {
      href: `/${lng}/dashboard/team/settings`,
      icon: Settings,
      label: t('navigation.teamSettings'),
    },
    {
      href: `/${lng}/help`,
      icon: HelpCircle,
      label: t('navigation.help'),
    },
  ];

  return (
    <TooltipProvider>
      <>
        {/* モバイル用オーバーレイ */}
        {isSidebarOpen && (
          <div
            className="bg-opacity-50 fixed inset-0 z-40 bg-black lg:hidden"
            onClick={closeSidebar}
          />
        )}

        {/* サイドバー */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 transform bg-white shadow-lg transition-all duration-300 ease-in-out lg:static',
            // モバイル
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
            // デスクトップ
            'lg:translate-x-0',
            isDesktopSidebarOpen ? 'lg:w-64' : 'lg:w-16'
          )}
        >
          {/* ヘッダー */}
          <div className="flex h-16 items-center justify-between border-b px-6">
            {isDesktopSidebarOpen && (
              <h2 className="text-lg font-semibold text-gray-900">
                {t('navigation.menu')}
              </h2>
            )}
            <div className="flex items-center gap-2">
              {/* デスクトップ用折り畳みボタン */}
              <button
                onClick={toggleSidebar}
                className={cn(
                  'hidden rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:block',
                  !isDesktopSidebarOpen && 'mx-auto'
                )}
              >
                {isDesktopSidebarOpen ? (
                  <ChevronLeft className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </button>
              {/* モバイル用閉じるボタン */}
              <button
                onClick={closeSidebar}
                className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:hidden"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* ナビゲーションメニュー */}
          <nav
            className={cn(
              'flex-1 space-y-1 py-6',
              isDesktopSidebarOpen ? 'px-4' : 'px-2'
            )}
          >
            {navigationItems.map(item => {
              const Icon = item.icon;

              if (item.onClick) {
                const button = (
                  <button
                    key={item.label}
                    onClick={() => {
                      item.onClick();
                      closeSidebar();
                    }}
                    className={cn(
                      'group flex w-full items-center rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900',
                      isDesktopSidebarOpen
                        ? 'px-3 py-2'
                        : 'justify-center px-2 py-2'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500',
                        isDesktopSidebarOpen && 'mr-3'
                      )}
                    />
                    {isDesktopSidebarOpen && item.label}
                  </button>
                );

                return isDesktopSidebarOpen ? (
                  button
                ) : (
                  <Tooltip key={item.label}>
                    <TooltipTrigger asChild>{button}</TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{item.label}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              const link = (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeSidebar}
                  className={cn(
                    'group flex items-center rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900',
                    isDesktopSidebarOpen
                      ? 'px-3 py-2'
                      : 'justify-center px-2 py-2'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500',
                      isDesktopSidebarOpen && 'mr-3'
                    )}
                  />
                  {isDesktopSidebarOpen && item.label}
                </Link>
              );

              return isDesktopSidebarOpen ? (
                link
              ) : (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </nav>

          {/* フッター */}
          {isDesktopSidebarOpen && !hasPaidPlan && (
            <div className="border-t p-4">
              <div className="rounded-lg bg-blue-50 p-3">
                <p className="text-xs text-blue-700">
                  {t('navigation.upgradePrompt')}
                </p>
                <Link
                  href={`/${lng}/pricing`}
                  className="mt-2 inline-block text-xs font-medium text-blue-600 hover:text-blue-500"
                >
                  {t('navigation.upgradeCta')}
                </Link>
              </div>
            </div>
          )}
        </aside>

        {/* Create Quiz Modal */}
        <CreateQuizModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      </>
    </TooltipProvider>
  );
}
