'use server';

import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPriceIds } from '@/lib/stripe/pricing';
import Stripe from 'stripe';
import { authAction } from './auth-action';

// Initialize Stripe only if the API key is available
const stripeApiKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeApiKey
  ? new Stripe(stripeApiKey, {
      apiVersion: '2025-05-28.basil',
    })
  : null;

// Schema for creating checkout session
const createCheckoutSessionSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
  planType: z.enum(['PRO', 'PREMIUM']),
  billingCycle: z.enum(['MONTHLY', 'YEARLY']),
});

/**
 * Create Stripe checkout session - replaces /api/stripe/checkout
 */
export const createCheckoutSession = authAction
  .inputSchema(createCheckoutSessionSchema)
  .action(async ({ parsedInput: { teamId, planType, billingCycle }, ctx }) => {
    const { userId } = ctx;

    // Check if Stripe is properly configured
    if (!stripe) {
      throw new Error('Payment system is not configured');
    }

    // Validate team ownership
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
      include: {
        team: true,
      },
    });

    if (!teamMember || !['OWNER', 'ADMIN'].includes(teamMember.role)) {
      throw new Error('Insufficient permissions');
    }

    // Get plan and price information
    const plan = await prisma.plan.findUnique({
      where: { type: planType },
    });

    if (!plan) {
      throw new Error('Invalid plan');
    }

    // Get current team member count
    const memberCount = await prisma.teamMember.count({
      where: { teamId },
    });

    // Get price IDs from configuration
    const priceIds = getPriceIds();
    const planKey = planType.toLowerCase() as 'pro' | 'premium';
    const cycleKey = billingCycle.toLowerCase() as 'monthly' | 'yearly';

    const priceId = priceIds[planKey]?.[cycleKey];

    if (!priceId) {
      throw new Error('Price not configured');
    }

    // Get user's Stripe customer ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true, email: true, name: true },
    });

    let stripeCustomerId = user?.stripeCustomerId || null;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user?.email || '',
        name: user?.name || undefined,
        metadata: {
          userId,
          teamId,
        },
      });
      stripeCustomerId = customer.id;

      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId },
      });
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: memberCount,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/plans`,
      subscription_data: {
        metadata: {
          teamId,
          planType,
          billingCycle,
        },
      },
      metadata: {
        teamId,
        planType,
        billingCycle,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
      tax_id_collection: {
        enabled: true,
      },
    });

    return {
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    };
  });

// Schema for creating portal session
const createPortalSessionSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
});

/**
 * Create Stripe customer portal session - replaces /api/stripe/portal
 */
export const createPortalSession = authAction
  .inputSchema(createPortalSessionSchema)
  .action(async ({ parsedInput: { teamId }, ctx }) => {
    const { userId } = ctx;

    // Check if Stripe is properly configured
    if (!stripe) {
      throw new Error('Payment system is not configured');
    }

    // Validate team ownership
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
      include: {
        team: {
          include: {
            subscription: true,
          },
        },
      },
    });

    if (!teamMember || !['OWNER', 'ADMIN'].includes(teamMember.role)) {
      throw new Error('Insufficient permissions');
    }

    if (!teamMember.team.subscription?.stripeCustomerId) {
      throw new Error('No active subscription');
    }

    // Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: teamMember.team.subscription.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });

    return { url: portalSession.url };
  });
