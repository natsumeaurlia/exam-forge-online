import { PlanType } from '@prisma/client';

export function isPlanPro(planType: PlanType | null | undefined): boolean {
  return planType === 'PRO';
}

export function isPlanPremium(planType: PlanType | null | undefined): boolean {
  return planType === 'PREMIUM';
}

export function isPlanPaid(planType: PlanType | null | undefined): boolean {
  return planType === 'PRO' || planType === 'PREMIUM';
}

export function isPlanFree(planType: PlanType | null | undefined): boolean {
  return !planType || planType === 'FREE';
}

export function hasRequiredPlan(
  userPlanType: PlanType | null | undefined,
  requiredPlanType: PlanType
): boolean {
  if (!userPlanType) return false;

  const planHierarchy: Record<PlanType, number> = {
    FREE: 0,
    PRO: 1,
    PREMIUM: 2,
  };

  return planHierarchy[userPlanType] >= planHierarchy[requiredPlanType];
}
