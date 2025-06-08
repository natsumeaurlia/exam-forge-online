import { create } from 'zustand';

interface PlanComparisonState {
  isAnnual: boolean;
  toggleBilling: () => void;
  setBilling: (isAnnual: boolean) => void;
}

export const usePlanComparisonStore = create<PlanComparisonState>(set => ({
  isAnnual: true,
  toggleBilling: () => set(state => ({ isAnnual: !state.isAnnual })),
  setBilling: (isAnnual: boolean) => set({ isAnnual }),
}));
