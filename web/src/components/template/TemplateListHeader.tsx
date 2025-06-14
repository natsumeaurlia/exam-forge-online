'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CreateTemplateModal } from './CreateTemplateModal';

interface TemplateListHeaderProps {
  lng: string;
}

export function TemplateListHeader({ lng }: TemplateListHeaderProps) {
  const t = useTranslations('templateManagement.header');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {/* Search and Filter components will be added here */}
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('createTemplate')}
          </Button>
        </div>
      </div>

      <CreateTemplateModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        lng={lng}
      />
    </>
  );
}
