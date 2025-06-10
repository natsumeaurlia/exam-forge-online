import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { SubscriptionStatus } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = (await headers()).get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  console.log('Checkout session completed:', session.id);

  // Get the subscription and team information from metadata
  const teamId = session.metadata?.teamId;
  const planType = session.metadata?.planType;
  const billingCycle = session.metadata?.billingCycle as 'MONTHLY' | 'YEARLY';

  if (!teamId || !planType) {
    console.error('Missing metadata in checkout session');
    return;
  }

  // Get the subscription object
  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  );

  // Update the subscription in database
  await prisma.subscription.upsert({
    where: { teamId },
    create: {
      teamId,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      stripePriceId: subscription.items.data[0].price.id,
      stripeProductId: subscription.items.data[0].price.product as string,
      status: mapStripeStatus(subscription.status),
      billingCycle,
      memberCount: subscription.items.data[0].quantity || 1,
      pricePerMember: subscription.items.data[0].price.unit_amount || 0,
      currentPeriodStart: new Date(
        (subscription as any).current_period_start * 1000
      ),
      currentPeriodEnd: new Date(
        (subscription as any).current_period_end * 1000
      ),
      planId: (await prisma.plan.findUnique({
        where: { type: planType as any },
      }))!.id,
    },
    update: {
      stripeSubscriptionId: subscription.id,
      status: mapStripeStatus(subscription.status),
      currentPeriodStart: new Date(
        (subscription as any).current_period_start * 1000
      ),
      currentPeriodEnd: new Date(
        (subscription as any).current_period_end * 1000
      ),
    },
  });
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id);

  const dbSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!dbSubscription) {
    console.error('Subscription not found in database:', subscription.id);
    return;
  }

  // Update subscription details
  await prisma.subscription.update({
    where: { id: dbSubscription.id },
    data: {
      status: mapStripeStatus(subscription.status),
      memberCount: subscription.items.data[0].quantity || 1,
      currentPeriodStart: new Date(
        (subscription as any).current_period_start * 1000
      ),
      currentPeriodEnd: new Date(
        (subscription as any).current_period_end * 1000
      ),
      canceledAt: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id);

  const dbSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!dbSubscription) {
    console.error('Subscription not found in database:', subscription.id);
    return;
  }

  // Update subscription status to CANCELED
  await prisma.subscription.update({
    where: { id: dbSubscription.id },
    data: {
      status: 'CANCELED',
      canceledAt: new Date(),
    },
  });

  // Optionally downgrade team to free plan
  const freePlan = await prisma.plan.findUnique({ where: { type: 'FREE' } });
  if (freePlan) {
    await prisma.subscription.update({
      where: { id: dbSubscription.id },
      data: {
        planId: freePlan.id,
        pricePerMember: 0,
        memberCount: 1, // Free plan only allows 1 member
      },
    });
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log('Invoice paid:', invoice.id);

  const teamId = invoice.metadata?.teamId;
  if (!teamId) {
    console.error('Missing teamId in invoice metadata');
    return;
  }

  // Create invoice record
  await prisma.invoice.create({
    data: {
      teamId,
      stripeInvoiceId: invoice.id!,
      stripeCustomerId: invoice.customer as string,
      invoiceNumber: invoice.number || invoice.id || '',
      status: 'PAID',
      subtotal: invoice.subtotal,
      tax: (invoice as any).tax || 0,
      total: invoice.total,
      amountPaid: invoice.amount_paid,
      amountDue: invoice.amount_due,
      currency: invoice.currency,
      paidAt: (invoice as any).paid_at
        ? new Date((invoice as any).paid_at * 1000)
        : new Date(),
      invoicePdf: invoice.invoice_pdf || null,
      hostedInvoiceUrl: invoice.hosted_invoice_url || null,
    },
  });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Invoice payment failed:', invoice.id);

  const subscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: invoice.customer as string },
  });

  if (subscription) {
    // Update subscription status
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'PAST_DUE',
      },
    });

    // TODO: Send notification email to team owner
  }
}

function mapStripeStatus(
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
    paused: 'CANCELED', // Map paused to canceled for simplicity
  };

  return statusMap[stripeStatus] || 'CANCELED';
}
