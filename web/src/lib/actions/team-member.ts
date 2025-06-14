'use server';

import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import { authAction } from './auth-action';
import { prisma } from '../prisma';
import { handleTeamMemberChange } from '../stripe/pricing';
import { revalidatePath } from 'next/cache';
import { TeamRole } from '@prisma/client';

const addTeamMemberSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
  email: z.string().email('Valid email is required'),
  role: z.nativeEnum(TeamRole),
});

export const addTeamMember = authAction
  .schema(addTeamMemberSchema)
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
  .schema(removeTeamMemberSchema)
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
  .schema(updateTeamMemberRoleSchema)
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

// Get team members
const getTeamMembersSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
});

export const getTeamMembers = authAction
  .schema(getTeamMembersSchema)
  .action(async ({ parsedInput: { teamId }, ctx }) => {
    const { userId } = ctx;

    // Check if user is a member of this team
    const requestingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    if (!requestingMember) {
      throw new Error('You are not a member of this team');
    }

    const members = await prisma.teamMember.findMany({
      where: { teamId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: [
        {
          role: 'asc',
        },
        {
          joinedAt: 'asc',
        },
      ],
    });

    return { members };
  });

// Get user's teams
const getUserTeamsSchema = z.object({});

export const getUserTeams = authAction
  .schema(getUserTeamsSchema)
  .action(async ({ ctx }) => {
    const { userId } = ctx;

    const teams = await prisma.teamMember.findMany({
      where: { userId },
      include: {
        team: {
          include: {
            _count: {
              select: {
                members: true,
                quizzes: true,
              },
            },
          },
        },
      },
      orderBy: {
        joinedAt: 'asc',
      },
    });

    const result = teams.map(tm => ({
      ...tm.team,
      role: tm.role,
      joinedAt: tm.joinedAt,
    }));

    return { teams: result };
  });

// Get team by ID
const getTeamByIdSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
});

export const getTeamById = authAction
  .schema(getTeamByIdSchema)
  .action(async ({ parsedInput: { teamId }, ctx }) => {
    const { userId } = ctx;

    // Check if user is a member of this team
    const member = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    if (!member) {
      throw new Error('You are not a member of this team');
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        _count: {
          select: {
            members: true,
            quizzes: true,
          },
        },
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!team) {
      throw new Error('Team not found');
    }

    return {
      team: {
        ...team,
        currentUserRole: member.role,
      },
    };
  });

// Update team details
const updateTeamSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
  name: z.string().optional(),
  description: z.string().optional(),
  logo: z.string().optional(),
});

export const updateTeam = authAction
  .schema(updateTeamSchema)
  .action(async ({ parsedInput: { teamId, name, description, logo }, ctx }) => {
    const { userId } = ctx;

    // Check if user has permission
    const member = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
      throw new Error('Insufficient permissions');
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (logo !== undefined) updateData.logo = logo;

    const team = await prisma.team.update({
      where: { id: teamId },
      data: updateData,
    });

    revalidatePath('/dashboard/team');
    return { success: true, team };
  });

// Create team invitation
const createTeamInvitationSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
  email: z.string().email('Valid email is required'),
  role: z.nativeEnum(TeamRole),
});

export const createTeamInvitation = authAction
  .schema(createTeamInvitationSchema)
  .action(async ({ parsedInput: { teamId, email, role }, ctx }) => {
    const { userId } = ctx;

    // Check if user has permission
    const member = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
      throw new Error('Insufficient permissions');
    }

    // Check if invitation already exists
    const existingInvitation = await prisma.teamInvitation.findFirst({
      where: {
        teamId,
        email,
        status: 'PENDING',
      },
    });

    if (existingInvitation) {
      throw new Error('An invitation for this email already exists');
    }

    // Create invitation with 7 day expiry
    const invitation = await prisma.teamInvitation.create({
      data: {
        teamId,
        email,
        role,
        invitedById: userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // TODO: Send invitation email

    return { success: true, invitation };
  });

// Get pending invitations
const getTeamInvitationsSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
});

export const getTeamInvitations = authAction
  .schema(getTeamInvitationsSchema)
  .action(async ({ parsedInput: { teamId }, ctx }) => {
    const { userId } = ctx;

    // Check if user has permission
    const member = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
      throw new Error('Insufficient permissions');
    }

    const invitations = await prisma.teamInvitation.findMany({
      where: {
        teamId,
        status: 'PENDING',
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        invitedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return { invitations };
  });

// Cancel invitation
const cancelTeamInvitationSchema = z.object({
  invitationId: z.string().min(1, 'Invitation ID is required'),
});

export const cancelTeamInvitation = authAction
  .schema(cancelTeamInvitationSchema)
  .action(async ({ parsedInput: { invitationId }, ctx }) => {
    const { userId } = ctx;

    const invitation = await prisma.teamInvitation.findUnique({
      where: { id: invitationId },
      include: {
        team: {
          include: {
            members: {
              where: {
                userId,
              },
            },
          },
        },
      },
    });

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    const member = invitation.team.members[0];
    if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
      throw new Error('Insufficient permissions');
    }

    await prisma.teamInvitation.update({
      where: { id: invitationId },
      data: { status: 'EXPIRED' },
    });

    revalidatePath('/dashboard/team');
    return { success: true };
  });
