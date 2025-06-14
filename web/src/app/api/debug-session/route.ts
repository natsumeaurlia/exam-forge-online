import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    // Get all users from database
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    // Check if session user exists in database
    const sessionUserId = session.user?.id;
    const userExists = sessionUserId
      ? await prisma.user.findUnique({
          where: { id: sessionUserId },
          select: { id: true, email: true, name: true },
        })
      : null;

    return NextResponse.json({
      session: {
        user: session.user,
        expires: session.expires,
      },
      sessionUserId,
      userExistsInDb: !!userExists,
      userInDb: userExists,
      allUsersInDb: users,
    });
  } catch (error) {
    console.error('Debug session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
