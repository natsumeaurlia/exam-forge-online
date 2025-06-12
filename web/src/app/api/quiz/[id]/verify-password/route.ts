import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Check rate limit for password attempts
    const rateLimitResult = await checkRateLimit({
      identifier: `quiz-password:${params.id}`,
      ...RATE_LIMITS.passwordAttempt,
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Too many password attempts. Please try again later.',
          resetAt: rateLimitResult.resetAt,
        },
        { status: 429 }
      );
    }

    // Verify quiz exists and is published
    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      select: {
        password: true,
        sharingMode: true,
        status: true,
      },
    });

    if (!quiz || quiz.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    if (quiz.sharingMode !== 'PASSWORD' || !quiz.password) {
      return NextResponse.json(
        { error: 'This quiz does not require a password' },
        { status: 400 }
      );
    }

    // Verify password
    const isValid = password === quiz.password;

    if (!isValid) {
      return NextResponse.json(
        {
          error: 'Incorrect password',
          remainingAttempts: rateLimitResult.remainingAttempts,
        },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Password verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
