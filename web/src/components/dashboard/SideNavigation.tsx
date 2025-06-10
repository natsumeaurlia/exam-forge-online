'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useDashboard } from '@/hooks/use-dashboard';
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
} from 'lucide-react';
import { CreateQuizModal } from '@/components/quiz/CreateQuizModal';

interface SideNavigationProps {
  lng: string;
}

export function SideNavigation({ lng }: SideNavigationProps) {
  const t = useTranslations('dashboard');
  const { isSidebarOpen, closeSidebar } = useDashboard();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
      href: `/${lng}/dashboard/members`,
      icon: Users,
      label: t('navigation.members'),
    },
    {
      href: `/${lng}/dashboard/settings`,
      icon: Settings,
      label: t('navigation.settings'),
    },
  ];

  return (
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
          'fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out lg:static lg:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* ヘッダー */}
        <div className="flex h-16 items-center justify-between border-b px-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('navigation.menu')}
          </h2>
          <button
            onClick={closeSidebar}
            className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ナビゲーションメニュー */}
        <nav className="flex-1 space-y-1 px-4 py-6">
          {navigationItems.map(item => {
            const Icon = item.icon;
            
            if (item.onClick) {
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    item.onClick();
                    closeSidebar();
                  }}
                  className="group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
                  {item.label}
                </button>
              );
            }
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                className="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                <Icon className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* フッター */}
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
      </aside>

      {/* Create Quiz Modal */}
      <CreateQuizModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
}
