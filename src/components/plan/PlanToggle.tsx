'use client';

import { Switch } from '@/components/ui/switch';
import { usePlanComparisonStore } from '@/stores/usePlanComparisonStore';
import { cn } from '@/lib/utils';

interface PlanToggleProps {
  className?: string;
}

export function PlanToggle({ className }: PlanToggleProps) {
  const { isYearly, toggleBillingPeriod } = usePlanComparisonStore();

  return (
    <div 
      className={cn(
        'flex flex-col items-center space-y-4 sm:flex-row sm:space-x-6 sm:space-y-0',
        className
      )}
      data-testid="plan-toggle-container"
    >
      <div className="flex items-center space-x-3">
        <span 
          className={cn(
            'text-sm font-medium transition-colors',
            !isYearly ? 'text-foreground' : 'text-muted-foreground'
          )}
          data-testid="plan-toggle-monthly-label"
        >
          月額
        </span>
        
        <Switch
          checked={isYearly}
          onCheckedChange={toggleBillingPeriod}
          className="data-[state=checked]:bg-primary"
          data-testid="plan-toggle-switch"
        />
        
        <span 
          className={cn(
            'text-sm font-medium transition-colors',
            isYearly ? 'text-foreground' : 'text-muted-foreground'
          )}
          data-testid="plan-toggle-yearly-label"
        >
          年額
        </span>
      </div>
      
      {isYearly && (
        <div 
          className="flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
          data-testid="plan-toggle-discount-badge"
        >
          <span>約17%割引</span>
        </div>
      )}
    </div>
  );
}