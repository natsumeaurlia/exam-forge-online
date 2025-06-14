'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Users, FolderOpen } from 'lucide-react';

interface TemplateCardStatsProps {
  category?: string | null;
  usageCount: number;
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  };
}

export function TemplateCardStats({
  category,
  usageCount,
  createdBy,
}: TemplateCardStatsProps) {
  const t = useTranslations('templateManagement.cardStats');

  return (
    <div className="space-y-2">
      <div className="text-muted-foreground flex items-center gap-4 text-sm">
        {category && (
          <div className="flex items-center gap-1">
            <FolderOpen className="h-3 w-3" />
            <span className="capitalize">{category}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          <span>
            {usageCount} {t('usageCount')}
          </span>
        </div>
      </div>

      <div className="text-muted-foreground text-xs">
        {t('createdBy')}: {createdBy.name || createdBy.email}
      </div>
    </div>
  );
}
