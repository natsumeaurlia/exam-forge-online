import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import { authAction } from '@/lib/actions/auth';
import { prisma } from '@/lib/prisma';
import { handleTeamMemberChange } from '@/lib/stripe/pricing';
import { revalidatePath } from 'next/cache';
import { TeamRole } from '@prisma/client';

const addTeamMemberSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
  email: z.string().email('Valid email is required'),
  role: z.nativeEnum(TeamRole),
});

export const addTeamMember = authAction
  .inputSchema(addTeamMemberSchema)
  .action(async ({ parsedInput: { teamId, email, role }, ctx }) => {
    const { userId } = ctx;

    // Check if user has permission to add members
    const requestingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
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
  });

const removeTeamMemberSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
  userId: z.string().min(1, 'User ID is required'),
});

export const removeTeamMember = authAction
  .inputSchema(removeTeamMemberSchema)
  .action(async ({ parsedInput: { teamId, userId: targetUserId }, ctx }) => {
    const { userId } = ctx;

    // Check if user has permission
    const requestingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
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
    if (targetUserId === userId && requestingMember.role === 'OWNER') {
      throw new Error('Owner cannot remove themselves');
    }

    // Remove team member
    await prisma.teamMember.delete({
      where: {
        teamId_userId: {
          teamId,
          userId: targetUserId,
        },
      },
    });

    // Update subscription quantity
    await handleTeamMemberChange(teamId, 'removed');

    revalidatePath('/dashboard/team');
    return { success: true };
  });

const updateTeamMemberRoleSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  role: z.nativeEnum(TeamRole),
});

export const updateTeamMemberRole = authAction
  .inputSchema(updateTeamMemberRoleSchema)
  .action(
    async ({ parsedInput: { teamId, userId: targetUserId, role }, ctx }) => {
      const { userId } = ctx;

      // Only owners can change roles
      const requestingMember = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId,
            userId,
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
            userId: targetUserId,
          },
        },
        data: { role },
      });

      revalidatePath('/dashboard/team');
      return { success: true, member };
    }
  );
