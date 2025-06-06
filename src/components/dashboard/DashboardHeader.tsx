'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Bell, Settings, LogOut, User, Globe, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { UserMenu } from '@/components/layout/UserMenu';
import { useRouter } from 'next/navigation';
import { useDashboard } from '@/hooks/use-dashboard';

interface DashboardHeaderProps {
  lng: string;
}

export function DashboardHeader({ lng }: DashboardHeaderProps) {
  const { data: session } = useSession();
  const { toggleSidebar } = useDashboard();
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const router = useRouter();

  const handleLogoClick = () => {
    if (session) {
      router.push(`/${lng}/dashboard`);
    } else {
      router.push(`/${lng}`);
    }
  };

  const unreadNotifications = 3; // モックデータ

  return (
    <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* ExamForgeロゴ */}
          <div className="flex items-center space-x-4">
            {/* モバイルハンバーガーメニュー */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={toggleSidebar}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">メニューを開く</span>
            </Button>

            <button
              onClick={handleLogoClick}
              className="flex cursor-pointer items-center gap-2 transition-opacity hover:opacity-80"
              data-testid="dashboard-logo"
            >
              <div className="from-examforge-blue to-examforge-blue-dark flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br text-xl font-bold text-white">
                E
              </div>
              <span className="text-xl font-bold">ExamForge</span>
            </button>
          </div>

          {/* 右側のアクション */}
          <div className="flex items-center space-x-4">
            {/* 言語切り替え */}
            <LanguageSwitcher lng={lng} />

            {/* 通知ベル */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
                >
                  {unreadNotifications}
                </Badge>
              )}
              <span className="sr-only">通知</span>
            </Button>

            {/* ユーザーメニュー */}
            <UserMenu lng={lng} showDashboardLink={false} />
          </div>
        </div>
      </div>
    </header>
  );
}
