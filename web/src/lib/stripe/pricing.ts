import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

interface PricingConfig {
  perMemberPrice: number;
  billingCycle: 'MONTHLY' | 'YEARLY';
  planType: string;
}

export async function calculateTeamPrice(
  teamId: string,
  config: PricingConfig
): Promise<number> {
  // Get current team member count
  const memberCount = await prisma.teamMember.count({
    where: { teamId },
  });

  // Calculate total price
  const totalPrice = config.perMemberPrice * memberCount;

  return totalPrice;
}

export async function syncSubscriptionQuantity(
  stripe: Stripe,
  subscriptionId: string,
  teamId: string
): Promise<void> {
  // Get current team member count
  const memberCount = await prisma.teamMember.count({
    where: { teamId },
  });

  // Get the subscription from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['items'],
  });

  // Update quantity if different
  const currentQuantity = subscription.items.data[0].quantity || 1;
  if (currentQuantity !== memberCount) {
    await stripe.subscriptionItems.update(subscription.items.data[0].id, {
      quantity: memberCount,
    });

    // Update database
    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscriptionId },
      data: { memberCount },
    });

    // Create usage record
    const dbSubscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscriptionId },
    });

    if (dbSubscription) {
      await prisma.usageRecord.create({
        data: {
          teamId,
          resourceType: 'MEMBER',
          count: memberCount,
          periodStart: new Date(),
          periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });
    }
  }
}

export async function handleTeamMemberChange(
  teamId: string,
  changeType: 'added' | 'removed'
): Promise<void> {
  // Get the team's subscription
  const subscription = await prisma.subscription.findFirst({
    where: {
      teamId,
      status: { in: ['ACTIVE', 'TRIALING'] },
    },
  });

  if (!subscription || !subscription.stripeSubscriptionId) {
    return; // No active subscription to update
  }

  // Check if it's a paid plan
  const plan = await prisma.plan.findUnique({
    where: { id: subscription.planId },
  });

  if (!plan || plan.type === 'FREE') {
    return; // Free plan doesn't need quantity updates
  }

  // Initialize Stripe
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-05-28.basil',
  });

  // Sync the subscription quantity
  await syncSubscriptionQuantity(
    stripe,
    subscription.stripeSubscriptionId,
    teamId
  );
}

export function getPriceIds() {
  const env = process.env.NODE_ENV || 'development';

  return {
    pro: {
      monthly:
        process.env[`STRIPE_PRO_MONTHLY_PRICE_ID_${env.toUpperCase()}`] ||
        process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
      yearly:
        process.env[`STRIPE_PRO_YEARLY_PRICE_ID_${env.toUpperCase()}`] ||
        process.env.STRIPE_PRO_YEARLY_PRICE_ID,
    },
    premium: {
      monthly:
        process.env[`STRIPE_PREMIUM_MONTHLY_PRICE_ID_${env.toUpperCase()}`] ||
        process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
      yearly:
        process.env[`STRIPE_PREMIUM_YEARLY_PRICE_ID_${env.toUpperCase()}`] ||
        process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID,
    },
  };
}

export function getStripeConfig() {
  const env = process.env.NODE_ENV || 'development';

  return {
    apiKey: process.env.STRIPE_SECRET_KEY!,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY!,
    webhookSecret:
      process.env[`STRIPE_WEBHOOK_SECRET_${env.toUpperCase()}`] ||
      process.env.STRIPE_WEBHOOK_SECRET!,
    portalConfigurationId: process.env.STRIPE_PORTAL_CONFIGURATION_ID,
  };
}
