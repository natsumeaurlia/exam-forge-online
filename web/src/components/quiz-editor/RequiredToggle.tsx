'use client';

import { useTranslations } from 'next-intl';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface RequiredToggleProps {
  isRequired: boolean;
  onChange: (isRequired: boolean) => void;
}

export function RequiredToggle({ isRequired, onChange }: RequiredToggleProps) {
  const t = useTranslations('quizManagement.editor.questions');

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="space-y-0.5">
        <Label htmlFor="required-toggle" className="text-base font-medium">
          {t('isRequired')}
        </Label>
        <div className="text-muted-foreground text-sm">
          {t('isRequiredDescription')}
        </div>
      </div>
      <Switch
        id="required-toggle"
        checked={isRequired}
        onCheckedChange={onChange}
      />
    </div>
  );
}
