'use client';

import React from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { SideNavigation } from '@/components/dashboard/SideNavigation';
import { DashboardProvider } from '@/hooks/use-dashboard';
import { UserPlanProvider } from '@/components/providers/UserPlanProvider';
import { useSidebarStore } from '@/stores/useSidebarStore';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  lng: string;
}

export function DashboardLayout({ children, lng }: DashboardLayoutProps) {
  const { isOpen: isSidebarOpen } = useSidebarStore();

  return (
    <UserPlanProvider>
      <DashboardProvider>
        <div className="min-h-screen bg-gray-50">
          {/* ダッシュボードヘッダー */}
          <DashboardHeader lng={lng} />

          {/* メインレイアウト */}
          <div className="flex h-[calc(100vh-4rem)]">
            {/* サイドナビゲーション */}
            <SideNavigation lng={lng} />

            {/* メインコンテンツエリア */}
            <main
              className={cn(
                'flex-1 overflow-auto transition-all duration-300',
                isSidebarOpen ? 'lg:ml-0' : 'lg:ml-0'
              )}
            >
              {children}
            </main>
          </div>
        </div>
      </DashboardProvider>
    </UserPlanProvider>
  );
}
