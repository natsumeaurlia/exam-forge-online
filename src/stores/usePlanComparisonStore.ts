import { create } from 'zustand';

/**
 * Billing cycle type for plan comparison
 */
export type BillingCycle = 'monthly' | 'yearly';

/**
 * Plan comparison store state interface
 */
interface PlanComparisonState {
  /** Current billing cycle selection */
  billingCycle: BillingCycle;
  /** Currently selected plan ID */
  selectedPlanId: string | null;
}

/**
 * Plan comparison store actions interface
 */
interface PlanComparisonActions {
  /** Set the billing cycle (monthly or yearly) */
  setBillingCycle: (cycle: BillingCycle) => void;
  /** Set the selected plan ID */
  setSelectedPlan: (planId: string | null) => void;
  /** Reset store to initial state */
  reset: () => void;
}

/**
 * Combined store interface
 */
export type PlanComparisonStore = PlanComparisonState & PlanComparisonActions;

/**
 * Initial state for the plan comparison store
 */
const initialState: PlanComparisonState = {
  billingCycle: 'monthly',
  selectedPlanId: null,
};

/**
 * Zustand store for managing plan comparison state
 *
 * This store handles:
 * - Billing cycle toggle (monthly/yearly)
 * - Plan selection state
 * - State reset functionality
 *
 * @example
 * ```typescript
 * import { usePlanComparisonStore } from '@/stores/usePlanComparisonStore';
 *
 * function PlanToggle() {
 *   const { billingCycle, setBillingCycle } = usePlanComparisonStore();
 *
 *   return (
 *     <button
 *       onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
 *       data-testid="billing-cycle-toggle"
 *     >
 *       {billingCycle === 'monthly' ? 'Switch to Yearly' : 'Switch to Monthly'}
 *     </button>
 *   );
 * }
 *
 * function PlanCard({ planId }: { planId: string }) {
 *   const { selectedPlanId, setSelectedPlan } = usePlanComparisonStore();
 *
 *   return (
 *     <div
 *       className={selectedPlanId === planId ? 'selected' : ''}
 *       data-testid={`plan-card-${planId}`}
 *     >
 *       <button
 *         onClick={() => setSelectedPlan(planId)}
 *         data-testid={`select-plan-${planId}`}
 *       >
 *         Select Plan
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export const usePlanComparisonStore = create<PlanComparisonStore>(set => ({
  ...initialState,

  setBillingCycle: (cycle: BillingCycle) => {
    set({ billingCycle: cycle });
  },

  setSelectedPlan: (planId: string | null) => {
    set({ selectedPlanId: planId });
  },

  reset: () => {
    set(initialState);
  },
}));
