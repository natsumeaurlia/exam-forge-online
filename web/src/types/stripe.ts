import Stripe from 'stripe';
import { BillingCycle, PlanType } from '@prisma/client';

// Extended types for better type safety
export interface CheckoutSessionWithMetadata extends Stripe.Checkout.Session {
  metadata: {
    teamId: string;
    planType: PlanType;
    billingCycle: BillingCycle;
  };
}

export interface SubscriptionWithExpandedData extends Stripe.Subscription {
  items: Stripe.ApiList<Stripe.SubscriptionItem> & {
    data: Array<{
      id: string;
      price: {
        id: string;
        unit_amount: number | null;
        product: string;
      };
      quantity: number;
    }>;
  };
  current_period_start: number;
  current_period_end: number;
}

export interface InvoiceWithTaxInfo extends Stripe.Invoice {
  tax: number;
}

// Webhook event types
export type StripeWebhookEvent =
  | {
      type: 'checkout.session.completed';
      data: { object: CheckoutSessionWithMetadata };
    }
  | {
      type: 'customer.subscription.updated';
      data: { object: SubscriptionWithExpandedData };
    }
  | {
      type: 'customer.subscription.deleted';
      data: { object: SubscriptionWithExpandedData };
    }
  | { type: 'invoice.payment_succeeded'; data: { object: InvoiceWithTaxInfo } }
  | { type: 'invoice.payment_failed'; data: { object: InvoiceWithTaxInfo } };

// Type guards
export function isCheckoutSessionCompleted(
  event: Stripe.Event
): event is Stripe.CheckoutSessionCompletedEvent {
  return event.type === 'checkout.session.completed';
}

export function isSubscriptionUpdated(
  event: Stripe.Event
): event is Stripe.CustomerSubscriptionUpdatedEvent {
  return event.type === 'customer.subscription.updated';
}

export function isSubscriptionDeleted(
  event: Stripe.Event
): event is Stripe.CustomerSubscriptionDeletedEvent {
  return event.type === 'customer.subscription.deleted';
}

export function isInvoicePaymentSucceeded(
  event: Stripe.Event
): event is Stripe.InvoicePaymentSucceededEvent {
  return event.type === 'invoice.payment_succeeded';
}

export function isInvoicePaymentFailed(
  event: Stripe.Event
): event is Stripe.InvoicePaymentFailedEvent {
  return event.type === 'invoice.payment_failed';
}
