'use client';

import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Bell, Settings, LogOut, User, Globe, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
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

  const handleSignOut = () => {
    signOut({ callbackUrl: `/${lng}` });
  };

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
              className="flex items-center gap-2 transition-opacity hover:opacity-80"
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={session?.user?.image || ''}
                      alt={session?.user?.name || ''}
                    />
                    <AvatarFallback>
                      {session?.user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {session?.user?.name && (
                      <p className="font-medium">{session.user.name}</p>
                    )}
                    {session?.user?.email && (
                      <p className="text-muted-foreground w-[200px] truncate text-sm">
                        {session.user.email}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>{t('profile')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>{t('settings')}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t('logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
