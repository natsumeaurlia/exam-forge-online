import React from 'react';
import { usePlanComparisonStore } from './usePlanComparisonStore';

/**
 * Example component demonstrating billing cycle toggle
 */
export function BillingCycleToggle() {
  const { billingCycle, setBillingCycle } = usePlanComparisonStore();

  const handleToggle = () => {
    setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly');
  };

  return (
    <div className="flex items-center space-x-4">
      <span className={billingCycle === 'monthly' ? 'font-bold' : ''}>
        Monthly
      </span>
      <button
        onClick={handleToggle}
        className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
        data-testid="billing-cycle-toggle"
      >
        <span
          className={`${
            billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
        />
      </button>
      <span className={billingCycle === 'yearly' ? 'font-bold' : ''}>
        Yearly
      </span>
    </div>
  );
}

/**
 * Example component demonstrating plan selection
 */
interface PlanCardProps {
  planId: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  isPopular?: boolean;
}

export function PlanCard({
  planId,
  name,
  monthlyPrice,
  yearlyPrice,
  isPopular = false,
}: PlanCardProps) {
  const { billingCycle, selectedPlanId, setSelectedPlan } =
    usePlanComparisonStore();

  const price = billingCycle === 'monthly' ? monthlyPrice : yearlyPrice;
  const isSelected = selectedPlanId === planId;

  return (
    <div
      className={`rounded-lg border p-6 ${
        isSelected
          ? 'border-indigo-500 ring-2 ring-indigo-500'
          : 'border-gray-200'
      } ${isPopular ? 'ring-2 ring-yellow-400' : ''}`}
      data-testid={`plan-card-${planId}`}
    >
      {isPopular && (
        <div className="mb-2 rounded bg-yellow-100 px-2 py-1 text-xs font-bold text-yellow-800">
          Most Popular
        </div>
      )}
      <h3 className="mb-2 text-lg font-bold">{name}</h3>
      <div className="mb-4 text-3xl font-bold">
        ${price}
        <span className="text-sm font-normal">
          /{billingCycle === 'monthly' ? 'month' : 'year'}
        </span>
      </div>
      <button
        onClick={() => setSelectedPlan(planId)}
        className={`w-full rounded px-4 py-2 font-medium ${
          isSelected
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
        }`}
        data-testid={`select-plan-${planId}`}
      >
        {isSelected ? 'Selected' : 'Select Plan'}
      </button>
    </div>
  );
}

/**
 * Example component demonstrating plan comparison page
 */
export function PlanComparisonExample() {
  const { reset } = usePlanComparisonStore();

  const plans = [
    {
      id: 'free',
      name: 'Free Plan',
      monthlyPrice: 0,
      yearlyPrice: 0,
    },
    {
      id: 'pro',
      name: 'Pro Plan',
      monthlyPrice: 29,
      yearlyPrice: 290,
      isPopular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise Plan',
      monthlyPrice: 99,
      yearlyPrice: 990,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-8 text-center text-3xl font-bold">Choose Your Plan</h1>

      <div className="mb-8 flex justify-center">
        <BillingCycleToggle />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        {plans.map(plan => (
          <PlanCard
            key={plan.id}
            planId={plan.id}
            name={plan.name}
            monthlyPrice={plan.monthlyPrice}
            yearlyPrice={plan.yearlyPrice}
            isPopular={plan.isPopular}
          />
        ))}
      </div>

      <div className="text-center">
        <button
          onClick={reset}
          className="text-gray-500 underline hover:text-gray-700"
          data-testid="reset-selection"
        >
          Reset Selection
        </button>
      </div>
    </div>
  );
}

/**
 * Example usage with state access
 */
export function PlanSelectionStatus() {
  const { billingCycle, selectedPlanId } = usePlanComparisonStore();

  return (
    <div className="rounded-lg bg-gray-50 p-4" data-testid="plan-status">
      <h3 className="mb-2 font-medium">Current Selection:</h3>
      <p>Billing Cycle: {billingCycle}</p>
      <p>Selected Plan: {selectedPlanId || 'None'}</p>
    </div>
  );
}
