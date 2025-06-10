import Stripe from 'stripe';

// Initialize Stripe only if the API key is available
const stripeApiKey = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeApiKey
  ? new Stripe(stripeApiKey, {
      apiVersion: '2025-05-28.basil',
      typescript: true,
    })
  : null;

// Stripe public key for client-side
export const getStripePublishableKey = () => {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
};

/**
 * Calculate the total price for a team subscription
 */
export function calculateSubscriptionPrice(
  memberCount: number,
  pricePerMember: number,
  billingCycle: 'MONTHLY' | 'YEARLY'
): number {
  const total = memberCount * pricePerMember;
  return billingCycle === 'YEARLY' ? total * 12 : total;
}

/**
 * Format price for display
 */
export function formatPrice(amount: number, currency: string = 'jpy'): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get Stripe price ID based on plan and billing cycle
 */
export function getStripePriceId(
  planType: 'PRO' | 'PREMIUM',
  billingCycle: 'MONTHLY' | 'YEARLY'
): string | undefined {
  const priceKey = `STRIPE_${planType}_${billingCycle}_PRICE_ID`;
  return process.env[priceKey];
}
