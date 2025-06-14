import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Initialize Stripe only if the API key is available
const stripeApiKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeApiKey
  ? new Stripe(stripeApiKey, {
      apiVersion: '2025-05-28.basil',
    })
  : null;

export async function POST(request: NextRequest) {
  // Check if Stripe is properly configured
  if (!stripe) {
    return NextResponse.json(
      { error: 'Payment system is not configured' },
      { status: 500 }
    );
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { immediately, reason, feedback } = body;

    // Get user's team and subscription
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        role: { in: ['OWNER', 'ADMIN'] },
      },
      include: {
        team: {
          include: {
            subscription: true,
          },
        },
      },
    });

    if (!teamMember) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const subscription = teamMember.team.subscription;

    if (!subscription || !subscription.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      );
    }

    // Cancel the subscription in Stripe
    const canceledSubscription = await stripe.subscriptions.cancel(
      subscription.stripeSubscriptionId,
      {
        prorate: immediately,
      }
    );

    // Update subscription in database
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: immediately ? 'CANCELED' : 'ACTIVE',
        canceledAt: new Date(),
        cancelReason: reason,
        cancelFeedback: feedback,
      },
    });

    // Create cancellation record for analytics
    await prisma.cancellationRecord.create({
      data: {
        subscriptionId: subscription.id,
        teamId: teamMember.teamId,
        userId: session.user.id,
        reason,
        feedback,
        immediately,
        canceledAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: canceledSubscription.status,
        cancelAtPeriodEnd: canceledSubscription.cancel_at_period_end,
        canceledAt: canceledSubscription.canceled_at
          ? new Date(canceledSubscription.canceled_at * 1000)
          : null,
        currentPeriodEnd: new Date(
          canceledSubscription.current_period_end * 1000
        ),
      },
    });
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
