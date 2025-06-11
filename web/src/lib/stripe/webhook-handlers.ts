import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { SubscriptionStatus } from '@prisma/client';

// Idempotency key tracking
const processedEvents = new Map<string, Date>();
const EVENT_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// Clean up old processed events periodically
setInterval(
  () => {
    const now = Date.now();
    for (const [eventId, timestamp] of processedEvents.entries()) {
      if (now - timestamp.getTime() > EVENT_EXPIRY_MS) {
        processedEvents.delete(eventId);
      }
    }
  },
  60 * 60 * 1000
); // Run every hour

export async function ensureIdempotent(
  eventId: string,
  handler: () => Promise<void>
): Promise<void> {
  // Check if we've already processed this event
  if (processedEvents.has(eventId)) {
    console.log(`Event ${eventId} already processed, skipping`);
    return;
  }

  // Check database for processed events
  const existingEvent = await prisma.stripeEvent.findUnique({
    where: { eventId },
  });

  if (existingEvent) {
    console.log(`Event ${eventId} found in database, skipping`);
    processedEvents.set(eventId, existingEvent.processedAt);
    return;
  }

  try {
    // Process the event
    await handler();

    // Mark as processed
    await prisma.stripeEvent.create({
      data: {
        eventId,
        processedAt: new Date(),
      },
    });
    processedEvents.set(eventId, new Date());
  } catch (error) {
    console.error(`Error processing event ${eventId}:`, error);
    throw error;
  }
}

export async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  stripe: Stripe
): Promise<void> {
  console.log('Processing checkout session:', session.id);

  const { teamId, planType, billingCycle } = session.metadata || {};

  if (!teamId || !planType || !billingCycle) {
    throw new Error('Missing required metadata in checkout session');
  }

  // Retrieve the subscription with retry logic
  let subscription: Stripe.Subscription;
  let retries = 3;

  while (retries > 0) {
    try {
      subscription = await stripe.subscriptions.retrieve(
        session.subscription as string,
        { expand: ['items.data.price.product'] }
      );
      break;
    } catch (error) {
      retries--;
      if (retries === 0) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    }
  }

  // Get team member count for pricing
  const teamMemberCount = await prisma.teamMember.count({
    where: { teamId },
  });

  // Find the plan
  const plan = await prisma.plan.findUnique({
    where: { type: planType as any },
  });

  if (!plan) {
    throw new Error(`Plan not found: ${planType}`);
  }

  // Create or update subscription
  await prisma.subscription.upsert({
    where: { teamId },
    create: {
      teamId,
      stripeSubscriptionId: subscription!.id,
      stripeCustomerId: subscription!.customer as string,
      stripePriceId: subscription!.items.data[0].price.id,
      stripeProductId: subscription!.items.data[0].price.product as string,
      status: mapStripeStatus(subscription!.status),
      billingCycle: billingCycle as any,
      memberCount: teamMemberCount,
      pricePerMember: subscription!.items.data[0].price.unit_amount || 0,
      currentPeriodStart: new Date(subscription!.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription!.current_period_end * 1000),
      planId: plan.id,
    },
    update: {
      stripeSubscriptionId: subscription!.id,
      stripePriceId: subscription!.items.data[0].price.id,
      stripeProductId: subscription!.items.data[0].price.product as string,
      status: mapStripeStatus(subscription!.status),
      billingCycle: billingCycle as any,
      memberCount: teamMemberCount,
      pricePerMember: subscription!.items.data[0].price.unit_amount || 0,
      currentPeriodStart: new Date(subscription!.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription!.current_period_end * 1000),
      planId: plan.id,
    },
  });

  // Update subscription quantity based on team members
  if (subscription!.items.data[0].quantity !== teamMemberCount) {
    await stripe.subscriptionItems.update(subscription!.items.data[0].id, {
      quantity: teamMemberCount,
    });
  }
}

export async function handleSubscriptionUpdate(
  subscription: Stripe.Subscription
): Promise<void> {
  console.log('Updating subscription:', subscription.id);

  const dbSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
    include: { team: true },
  });

  if (!dbSubscription) {
    console.warn('Subscription not found in database:', subscription.id);
    return;
  }

  // Get current team member count
  const teamMemberCount = await prisma.teamMember.count({
    where: { teamId: dbSubscription.teamId },
  });

  // Update subscription
  await prisma.subscription.update({
    where: { id: dbSubscription.id },
    data: {
      status: mapStripeStatus(subscription.status),
      memberCount: teamMemberCount,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      canceledAt: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });

  // Update usage if member count changed
  if (teamMemberCount !== subscription.items.data[0].quantity) {
    await prisma.usageRecord.create({
      data: {
        teamId: dbSubscription.teamId,
        subscriptionId: dbSubscription.id,
        resourceType: 'MEMBER',
        quantity: teamMemberCount,
        recordedAt: new Date(),
      },
    });
  }
}

export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  console.log('Canceling subscription:', subscription.id);

  const dbSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!dbSubscription) {
    console.warn('Subscription not found in database:', subscription.id);
    return;
  }

  // Update subscription status
  await prisma.subscription.update({
    where: { id: dbSubscription.id },
    data: {
      status: 'CANCELED',
      canceledAt: new Date(),
    },
  });

  // Switch to free plan
  const freePlan = await prisma.plan.findUnique({
    where: { type: 'FREE' },
  });

  if (freePlan) {
    await prisma.subscription.update({
      where: { id: dbSubscription.id },
      data: {
        planId: freePlan.id,
        pricePerMember: 0,
        memberCount: 1,
      },
    });

    // TODO: Notify team about downgrade
    // TODO: Restrict features based on free plan limits
  }
}

export async function handleInvoicePaid(
  invoice: Stripe.Invoice
): Promise<void> {
  console.log('Recording paid invoice:', invoice.id);

  // Get subscription and team info
  const subscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: invoice.customer as string },
  });

  if (!subscription) {
    console.error('Subscription not found for customer:', invoice.customer);
    return;
  }

  // Create invoice record
  await prisma.invoice.create({
    data: {
      teamId: subscription.teamId,
      stripeInvoiceId: invoice.id,
      stripeCustomerId: invoice.customer as string,
      invoiceNumber: invoice.number || invoice.id,
      status: 'PAID',
      subtotal: invoice.subtotal,
      tax: invoice.tax || 0,
      total: invoice.total,
      amountPaid: invoice.amount_paid,
      amountDue: 0,
      currency: invoice.currency,
      paidAt: invoice.status_transitions?.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000)
        : new Date(),
      invoicePdf: invoice.invoice_pdf || null,
      hostedInvoiceUrl: invoice.hosted_invoice_url || null,
      metadata: {
        lines: invoice.lines.data.map(line => ({
          description: line.description,
          amount: line.amount,
          quantity: line.quantity,
        })),
      },
    },
  });

  // Update subscription status if needed
  if (subscription.status === 'PAST_DUE') {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'ACTIVE' },
    });
  }
}

export async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice
): Promise<void> {
  console.log('Invoice payment failed:', invoice.id);

  const subscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: invoice.customer as string },
    include: {
      team: {
        include: {
          members: {
            where: { role: 'OWNER' },
            include: { user: true },
          },
        },
      },
    },
  });

  if (!subscription) {
    console.error('Subscription not found for customer:', invoice.customer);
    return;
  }

  // Update subscription status
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { status: 'PAST_DUE' },
  });

  // Create failed invoice record
  await prisma.invoice.create({
    data: {
      teamId: subscription.teamId,
      stripeInvoiceId: invoice.id,
      stripeCustomerId: invoice.customer as string,
      invoiceNumber: invoice.number || invoice.id,
      status: 'PAYMENT_FAILED',
      subtotal: invoice.subtotal,
      tax: invoice.tax || 0,
      total: invoice.total,
      amountPaid: 0,
      amountDue: invoice.amount_due,
      currency: invoice.currency,
      invoicePdf: invoice.invoice_pdf || null,
      hostedInvoiceUrl: invoice.hosted_invoice_url || null,
    },
  });

  // TODO: Send payment failure notification
  const teamOwner = subscription.team.members[0]?.user;
  if (teamOwner?.email) {
    // Send email notification
    console.log(
      `Payment failed notification should be sent to ${teamOwner.email}`
    );
  }
}

export function mapStripeStatus(
  stripeStatus: Stripe.Subscription.Status
): SubscriptionStatus {
  const statusMap: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
    active: 'ACTIVE',
    past_due: 'PAST_DUE',
    canceled: 'CANCELED',
    incomplete: 'INCOMPLETE',
    incomplete_expired: 'INCOMPLETE_EXPIRED',
    trialing: 'TRIALING',
    unpaid: 'UNPAID',
    paused: 'CANCELED',
  };

  return statusMap[stripeStatus] || 'CANCELED';
}
