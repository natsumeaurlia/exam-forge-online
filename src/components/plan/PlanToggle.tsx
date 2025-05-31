'use client';

import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';
import { usePlanComparisonStore } from '@/lib/stores/usePlanComparisonStore';

export function PlanToggle() {
  const t = useTranslations('pricing.toggle');
  const { isAnnual, toggleBilling } = usePlanComparisonStore();

  return (
    <div className="flex items-center justify-center gap-4 mb-8">
      <span 
        className={`text-sm font-medium transition-colors ${
          !isAnnual ? 'text-foreground' : 'text-muted-foreground'
        }`}
        data-testid="plan-toggle-monthly-label"
      >
        {t('monthly')}
      </span>
      
      <Switch
        checked={isAnnual}
        onCheckedChange={toggleBilling}
        data-testid="plan-toggle-switch"
        aria-label={isAnnual ? t('annually') : t('monthly')}
      />
      
      <div className="flex items-center gap-2">
        <span 
          className={`text-sm font-medium transition-colors ${
            isAnnual ? 'text-foreground' : 'text-muted-foreground'
          }`}
          data-testid="plan-toggle-annual-label"
        >
          {t('annually')}
        </span>
        
        {isAnnual && (
          <Badge 
            variant="secondary" 
            className="text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            data-testid="plan-toggle-discount-badge"
          >
            {t('discount')}
          </Badge>
        )}
      </div>
    </div>
  );
}