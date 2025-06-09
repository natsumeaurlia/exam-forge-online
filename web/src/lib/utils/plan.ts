import { PlanType } from '@prisma/client';

export function isPlanPro(planType: PlanType | null | undefined): boolean {
  return planType === 'PRO';
}

export function isPlanEnterprise(
  planType: PlanType | null | undefined
): boolean {
  return planType === 'ENTERPRISE';
}

export function isPlanPaid(planType: PlanType | null | undefined): boolean {
  return planType === 'PRO' || planType === 'ENTERPRISE';
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
    ENTERPRISE: 2,
  };

  return planHierarchy[userPlanType] >= planHierarchy[requiredPlanType];
}
