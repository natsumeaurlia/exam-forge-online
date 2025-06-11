'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { handleTeamMemberChange } from '@/lib/stripe/pricing';
import { revalidatePath } from 'next/cache';
import { TeamRole } from '@prisma/client';

interface AddTeamMemberParams {
  teamId: string;
  email: string;
  role: TeamRole;
}

export async function addTeamMember({
  teamId,
  email,
  role,
}: AddTeamMemberParams) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Check if user has permission to add members
  const requestingMember = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId: session.user.id,
      },
    },
  });

  if (
    !requestingMember ||
    !['OWNER', 'ADMIN'].includes(requestingMember.role)
  ) {
    throw new Error('Insufficient permissions');
  }

  // Find or create user
  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Create invited user
    user = await prisma.user.create({
      data: {
        email,
        name: email.split('@')[0],
      },
    });
  }

  // Check if user is already a member
  const existingMember = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId: user.id,
      },
    },
  });

  if (existingMember) {
    throw new Error('User is already a team member');
  }

  // Add team member
  const member = await prisma.teamMember.create({
    data: {
      teamId,
      userId: user.id,
      role,
    },
  });

  // Update subscription quantity
  await handleTeamMemberChange(teamId, 'added');

  revalidatePath('/dashboard/team');
  return { success: true, member };
}

interface RemoveTeamMemberParams {
  teamId: string;
  userId: string;
}

export async function removeTeamMember({
  teamId,
  userId,
}: RemoveTeamMemberParams) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Check if user has permission
  const requestingMember = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId: session.user.id,
      },
    },
  });

  if (
    !requestingMember ||
    !['OWNER', 'ADMIN'].includes(requestingMember.role)
  ) {
    throw new Error('Insufficient permissions');
  }

  // Prevent owner from removing themselves
  if (userId === session.user.id && requestingMember.role === 'OWNER') {
    throw new Error('Owner cannot remove themselves');
  }

  // Remove team member
  await prisma.teamMember.delete({
    where: {
      teamId_userId: {
        teamId,
        userId,
      },
    },
  });

  // Update subscription quantity
  await handleTeamMemberChange(teamId, 'removed');

  revalidatePath('/dashboard/team');
  return { success: true };
}

interface UpdateTeamMemberRoleParams {
  teamId: string;
  userId: string;
  role: TeamRole;
}

export async function updateTeamMemberRole({
  teamId,
  userId,
  role,
}: UpdateTeamMemberRoleParams) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Only owners can change roles
  const requestingMember = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId: session.user.id,
      },
    },
  });

  if (!requestingMember || requestingMember.role !== 'OWNER') {
    throw new Error('Only owners can change member roles');
  }

  // Update role
  const member = await prisma.teamMember.update({
    where: {
      teamId_userId: {
        teamId,
        userId,
      },
    },
    data: { role },
  });

  revalidatePath('/dashboard/team');
  return { success: true, member };
}
