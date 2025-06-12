'use client';

import React, { useEffect, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface DashboardRefresherProps {
  autoRefreshInterval?: number; // in seconds
}

export function DashboardRefresher({
  autoRefreshInterval = 30, // Default 30 seconds
}: DashboardRefresherProps) {
  const router = useRouter();
  const t = useTranslations('dashboard');
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefreshInterval > 0) {
      const interval = setInterval(() => {
        refresh();
      }, autoRefreshInterval * 1000);

      return () => clearInterval(interval);
    }
  }, [autoRefreshInterval, refresh]);

  return (
    <div className="flex items-center justify-end">
      <Button
        variant="outline"
        size="sm"
        onClick={refresh}
        disabled={isPending}
        className="flex items-center gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
        {t('refresh')}
      </Button>
    </div>
  );
}
