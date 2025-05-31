import { create } from 'zustand';

interface PlanComparisonState {
  // 月額/年額表示切替の状態 (true: yearly, false: monthly)
  isYearly: boolean;
  
  // プラン選択状態
  selectedPlanId: string | null;
  
  // アクション
  setIsYearly: (isYearly: boolean) => void;
  setSelectedPlanId: (planId: string | null) => void;
  toggleBillingPeriod: () => void;
}

export const usePlanComparisonStore = create<PlanComparisonState>((set) => ({
  isYearly: false,
  selectedPlanId: null,
  
  setIsYearly: (isYearly) => set({ isYearly }),
  setSelectedPlanId: (planId) => set({ selectedPlanId: planId }),
  toggleBillingPeriod: () => set((state) => ({ isYearly: !state.isYearly })),
}));