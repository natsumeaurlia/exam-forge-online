'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '../auth';
import { prisma } from '../prisma';

export async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !session.user.email) {
    console.warn('No user session found or user email is missing', session);
    throw new Error('INVALID_USER:認証が必要です');
  }
  return prisma.user.findUniqueOrThrow({
    where: { email: session.user.email },
  });
}
