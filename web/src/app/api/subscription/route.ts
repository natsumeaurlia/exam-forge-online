import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-05-28.basil',
    })
  : null;

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's current team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        role: { in: ['OWNER', 'ADMIN'] },
      },
      include: {
        team: {
          include: {
            subscription: {
              include: {
                plan: true,
              },
            },
          },
        },
      },
    });

    if (!teamMember) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const subscription = teamMember.team.subscription;

    if (!subscription) {
      // Return free plan data
      return NextResponse.json({
        id: teamMember.teamId,
        status: 'ACTIVE',
        planType: 'FREE',
        billingCycle: 'MONTHLY',
        memberCount: 1,
        pricePerMember: 0,
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        cancelAtPeriodEnd: false,
      });
    }

    // Get member count
    const memberCount = await prisma.teamMember.count({
      where: { teamId: teamMember.teamId },
    });

    // If there's a Stripe subscription, get updated info
    let stripeSubscription: any = null;
    if (subscription.stripeSubscriptionId && stripe) {
      try {
        stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripeSubscriptionId
        );
      } catch (error) {
        console.error('Error fetching Stripe subscription:', error);
      }
    }

    return NextResponse.json({
      id: subscription.id,
      status: stripeSubscription?.status.toUpperCase() || subscription.status,
      planType: subscription.plan.type,
      billingCycle: subscription.billingCycle,
      memberCount,
      pricePerMember: subscription.plan.type === 'PRO' ? 2980 : 4980,
      currentPeriodStart: stripeSubscription?.current_period_start
        ? new Date(stripeSubscription.current_period_start * 1000).toISOString()
        : subscription.currentPeriodStart?.toISOString() ||
          new Date().toISOString(),
      currentPeriodEnd: stripeSubscription?.current_period_end
        ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
        : subscription.currentPeriodEnd?.toISOString() ||
          new Date().toISOString(),
      cancelAtPeriodEnd: stripeSubscription?.cancel_at_period_end || false,
      canceledAt: subscription.canceledAt?.toISOString(),
      trialEnd: stripeSubscription?.trial_end
        ? new Date(stripeSubscription.trial_end * 1000).toISOString()
        : subscription.trialEnd?.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
