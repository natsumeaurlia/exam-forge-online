import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { errorTracker } from '@/lib/error-tracking';
import { z } from 'zod';

const errorQuerySchema = z.object({
  resolved: z.coerce.boolean().default(false),
  limit: z.coerce.number().min(1).max(100).default(50),
  fingerprint: z.string().optional(),
});

const resolveErrorSchema = z.object({
  fingerprint: z.string(),
  assignedTo: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email || !isAdminUser(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = errorQuerySchema.parse({
      resolved: searchParams.get('resolved'),
      limit: searchParams.get('limit'),
      fingerprint: searchParams.get('fingerprint'),
    });

    if (query.fingerprint) {
      // Return specific error details
      const errors = await errorTracker.getErrorsByFingerprint(
        query.fingerprint,
        query.limit
      );
      return NextResponse.json({ errors });
    }

    // Return aggregated errors
    const aggregatedErrors = await errorTracker.getAggregatedErrors(
      query.limit,
      query.resolved
    );
    const statistics = await errorTracker.getErrorStatistics(24);

    return NextResponse.json({
      errors: aggregatedErrors,
      statistics,
      meta: {
        limit: query.limit,
        resolved: query.resolved,
        total: aggregatedErrors.length,
      },
    });
  } catch (error) {
    console.error('Error API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch errors' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email || !isAdminUser(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fingerprint, assignedTo } = resolveErrorSchema.parse(body);

    await errorTracker.resolveError(fingerprint, assignedTo);

    return NextResponse.json({
      message: 'Error resolved successfully',
      fingerprint,
      assignedTo,
    });
  } catch (error) {
    console.error('Error resolution error:', error);
    return NextResponse.json(
      { error: 'Failed to resolve error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email || !isAdminUser(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Manual error capture endpoint for testing
    const body = await request.json();
    const { message, level = 'error', context = {} } = body;

    const errorId = await errorTracker.captureError(
      message,
      {
        ...context,
        userId: session.user.id,
        manually_triggered: true,
      },
      level
    );

    return NextResponse.json({
      message: 'Error captured successfully',
      errorId,
    });
  } catch (error) {
    console.error('Manual error capture failed:', error);
    return NextResponse.json(
      { error: 'Failed to capture error' },
      { status: 500 }
    );
  }
}

function isAdminUser(email: string): boolean {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  return adminEmails.includes(email);
}
