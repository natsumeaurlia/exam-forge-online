'use client';

import React, { useEffect } from 'react';
import { useSidebarStore } from '@/stores/useSidebarStore';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader as UISidebarHeader, // 名前衝突を避けるためエイリアス
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarInset,
  // 必要に応じて他のSidebar関連コンポーネントをインポート
} from '@/components/ui/sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { usePathname } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile'; // useIsMobileフックをインポート
import { useTranslations } from 'next-intl';
import { SkipLinks } from '@/components/accessibility/SkipLink';

interface DashboardLayoutProps {
  children: React.ReactNode;
  lng: string;
}

export function DashboardLayout({ children, lng }: DashboardLayoutProps) {
  const { isOpen, openSidebar, closeSidebar, toggleSidebar } =
    useSidebarStore();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const t = useTranslations('dashboard.navigation');

  // モバイルでページ遷移時にサイドバーを閉じる
  useEffect(() => {
    if (isMobile) {
      closeSidebar();
    }
  }, [pathname, isMobile, closeSidebar]);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      openSidebar();
    } else {
      closeSidebar();
    }
  };

  return (
    <SidebarProvider open={isOpen} onOpenChange={handleOpenChange}>
      <div className="flex min-h-screen flex-col">
        <SkipLinks />
        <DashboardHeader lng={lng} /> {/* onMenuClickは不要なので削除 */}
        <div className="flex flex-1">
          <Sidebar>
            <UISidebarHeader>
              {/* サイドバーヘッダーコンテンツ (例: ロゴやタイトル) */}
              <h2 className="p-4 text-lg font-semibold">{t('menu')}</h2>
            </UISidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  {/* TODO: 実際のナビゲーションリンクに置き換える */}
                  <a
                    href={`/${lng}/dashboard`}
                    className="block rounded-md p-2 hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    {t('dashboard')}
                  </a>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <a
                    href={`/${lng}/dashboard/quizzes`}
                    className="block rounded-md p-2 hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    {t('quizzes')}
                  </a>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <a
                    href={`/${lng}/dashboard/settings`}
                    className="block rounded-md p-2 hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    {t('settings')}
                  </a>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
              {/* サイドバーフッターコンテンツ (例: ログアウトボタン) */}
              <p className="p-4 text-sm text-gray-500">© 2024 ExamForge</p>
            </SidebarFooter>
          </Sidebar>
          <SidebarInset>
            {' '}
            {/* メインコンテンツエリア */}
            <main id="main-content" className="flex-1 p-4 md:p-6 lg:p-8">
              {children}
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
