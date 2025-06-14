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

export async function GET(request: NextRequest) {
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

    if (!subscription || !subscription.stripeCustomerId) {
      return NextResponse.json({
        invoices: [],
      });
    }

    // Get invoices from Stripe
    const invoices = await stripe.invoices.list({
      customer: subscription.stripeCustomerId,
      limit: 50,
      expand: ['data.subscription'],
    });

    // Transform invoices to our format
    const formattedInvoices = invoices.data.map(invoice => ({
      id: invoice.id,
      number: invoice.number || invoice.id,
      status: invoice.status,
      amount: invoice.amount_paid || invoice.total,
      currency: invoice.currency,
      created: new Date(invoice.created * 1000).toISOString(),
      periodStart: invoice.period_start
        ? new Date(invoice.period_start * 1000).toISOString()
        : new Date(invoice.created * 1000).toISOString(),
      periodEnd: invoice.period_end
        ? new Date(invoice.period_end * 1000).toISOString()
        : new Date(invoice.created * 1000).toISOString(),
      invoicePdf: invoice.invoice_pdf,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      description: invoice.description,
      planName: invoice.lines.data[0]?.description || 'Subscription',
    }));

    return NextResponse.json({
      invoices: formattedInvoices,
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}
