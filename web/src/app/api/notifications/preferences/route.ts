import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const NotificationPreferencesSchema = z.object({
  teamInvitations: z.boolean(),
  subscriptionUpdates: z.boolean(),
  paymentReminders: z.boolean(),
  trialExpirations: z.boolean(),
  memberJoined: z.boolean(),
  memberLeft: z.boolean(),
  quizShared: z.boolean(),
  emailEnabled: z.boolean(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferences = await prisma.notificationPreferences.findUnique({
      where: { userId: session.user.id },
    });

    if (!preferences) {
      // Return default preferences if none exist
      return NextResponse.json({
        teamInvitations: true,
        subscriptionUpdates: true,
        paymentReminders: true,
        trialExpirations: true,
        memberJoined: true,
        memberLeft: false,
        quizShared: true,
        emailEnabled: true,
      });
    }

    return NextResponse.json({
      teamInvitations: preferences.teamInvitations,
      subscriptionUpdates: preferences.subscriptionUpdates,
      paymentReminders: preferences.paymentReminders,
      trialExpirations: preferences.trialExpirations,
      memberJoined: preferences.memberJoined,
      memberLeft: preferences.memberLeft,
      quizShared: preferences.quizShared,
      emailEnabled: preferences.emailEnabled,
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = NotificationPreferencesSchema.parse(body);

    const preferences = await prisma.notificationPreferences.upsert({
      where: { userId: session.user.id },
      update: validatedData,
      create: {
        userId: session.user.id,
        ...validatedData,
      },
    });

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error updating notification preferences:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
