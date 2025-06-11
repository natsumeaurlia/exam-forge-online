import type { Page } from '@playwright/test';

export const STRIPE_TEST_CARDS = {
  SUCCESS: '4242424242424242',
  REQUIRES_AUTH: '4000002500003155',
  DECLINED: '4000000000009995',
  INSUFFICIENT_FUNDS: '4000000000009995',
};

export async function fillStripeCheckout(
  page: Page,
  cardNumber: string = STRIPE_TEST_CARDS.SUCCESS
) {
  // Wait for Stripe iframe to load
  const stripeFrame = page
    .frameLocator('iframe[name^="__privateStripeFrame"]')
    .first();

  // Fill card details
  await stripeFrame.locator('[placeholder="Card number"]').fill(cardNumber);
  await stripeFrame.locator('[placeholder="MM / YY"]').fill('12/30');
  await stripeFrame.locator('[placeholder="CVC"]').fill('123');

  // Fill billing details if required
  const emailField = page.locator('input[name="email"]');
  if (await emailField.isVisible()) {
    await emailField.fill('test@example.com');
  }

  const nameField = page.locator('input[name="name"]');
  if (await nameField.isVisible()) {
    await nameField.fill('Test User');
  }

  // Fill address if required
  const addressField = page.locator('input[name="address"]');
  if (await addressField.isVisible()) {
    await addressField.fill('123 Test Street');
    await page.locator('input[name="city"]').fill('Tokyo');
    await page.locator('input[name="postalCode"]').fill('100-0001');
  }
}

export async function completeStripeCheckout(page: Page) {
  // Click submit button
  const submitButton = page.getByRole('button', { name: /Pay|支払う/i });
  await submitButton.click();

  // Wait for redirect or confirmation
  await page.waitForURL(/dashboard|success/, { timeout: 30000 });
}

export function generateStripeWebhookSignature(
  payload: string,
  secret: string,
  timestamp: number = Math.floor(Date.now() / 1000)
): string {
  // This is a simplified version for testing
  // In real tests, you would use Stripe's webhook signature generation
  const crypto = require('crypto');
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  return `t=${timestamp},v1=${signature}`;
}

export function createMockStripeEvent(type: string, data: any) {
  return {
    id: `evt_test_${Date.now()}`,
    object: 'event',
    api_version: '2025-05-28.basil',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: data,
      previous_attributes: {},
    },
    livemode: false,
    pending_webhooks: 0,
    request: {
      id: null,
      idempotency_key: null,
    },
    type,
  };
}

export function createMockCheckoutSession(overrides: any = {}) {
  return {
    id: 'cs_test_123',
    object: 'checkout.session',
    amount_total: 2980,
    currency: 'jpy',
    customer: 'cus_test_123',
    customer_email: 'test@example.com',
    metadata: {
      teamId: 'team_123',
      planType: 'PRO',
      billingCycle: 'MONTHLY',
      ...overrides.metadata,
    },
    mode: 'subscription',
    payment_status: 'paid',
    status: 'complete',
    subscription: 'sub_test_123',
    success_url: 'https://example.com/success',
    ...overrides,
  };
}

export function createMockSubscription(overrides: any = {}) {
  return {
    id: 'sub_test_123',
    object: 'subscription',
    application: null,
    billing_cycle_anchor: Math.floor(Date.now() / 1000),
    cancel_at: null,
    cancel_at_period_end: false,
    canceled_at: null,
    collection_method: 'charge_automatically',
    created: Math.floor(Date.now() / 1000),
    currency: 'jpy',
    current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    current_period_start: Math.floor(Date.now() / 1000),
    customer: 'cus_test_123',
    items: {
      object: 'list',
      data: [
        {
          id: 'si_test_123',
          object: 'subscription_item',
          created: Math.floor(Date.now() / 1000),
          price: {
            id: 'price_test_123',
            object: 'price',
            active: true,
            currency: 'jpy',
            product: 'prod_test_123',
            recurring: {
              interval: 'month',
              interval_count: 1,
            },
            unit_amount: 2980,
          },
          quantity: 1,
          subscription: 'sub_test_123',
        },
      ],
    },
    livemode: false,
    metadata: {},
    status: 'active',
    ...overrides,
  };
}

export function createMockInvoice(overrides: any = {}) {
  return {
    id: 'in_test_123',
    object: 'invoice',
    amount_due: 2980,
    amount_paid: 2980,
    amount_remaining: 0,
    attempt_count: 1,
    attempted: true,
    billing_reason: 'subscription_cycle',
    charge: 'ch_test_123',
    collection_method: 'charge_automatically',
    created: Math.floor(Date.now() / 1000),
    currency: 'jpy',
    customer: 'cus_test_123',
    customer_email: 'test@example.com',
    hosted_invoice_url: 'https://invoice.stripe.com/i/test_123',
    invoice_pdf: 'https://invoice.stripe.com/i/test_123/pdf',
    lines: {
      object: 'list',
      data: [
        {
          id: 'il_test_123',
          object: 'line_item',
          amount: 2980,
          amount_excluding_tax: 2980,
          currency: 'jpy',
          description: 'Pro Plan (1 × ¥2,980)',
          price: {
            id: 'price_test_123',
            object: 'price',
            unit_amount: 2980,
          },
          quantity: 1,
        },
      ],
    },
    metadata: {
      teamId: 'team_123',
    },
    number: 'INV-0001',
    paid: true,
    payment_intent: 'pi_test_123',
    status: 'paid',
    subscription: 'sub_test_123',
    subtotal: 2980,
    tax: 0,
    total: 2980,
    ...overrides,
  };
}
