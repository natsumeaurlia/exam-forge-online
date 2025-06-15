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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const invoiceId = params.id;

    // Get user's team and subscription to verify access
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
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 400 }
      );
    }

    // Get the invoice from Stripe
    const invoice = await stripe.invoices.retrieve(invoiceId);

    // Verify the invoice belongs to this customer
    if (invoice.customer !== subscription.stripeCustomerId) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // If the invoice has a PDF URL, redirect to it
    if (invoice.invoice_pdf) {
      // Fetch the PDF from Stripe
      const pdfResponse = await fetch(invoice.invoice_pdf);

      if (!pdfResponse.ok) {
        throw new Error('Failed to fetch PDF from Stripe');
      }

      const pdfBuffer = await pdfResponse.arrayBuffer();

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="invoice-${invoice.number || invoice.id}.pdf"`,
        },
      });
    } else {
      return NextResponse.json(
        { error: 'PDF not available for this invoice' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error downloading invoice PDF:', error);
    return NextResponse.json(
      { error: 'Failed to download invoice PDF' },
      { status: 500 }
    );
  }
}
