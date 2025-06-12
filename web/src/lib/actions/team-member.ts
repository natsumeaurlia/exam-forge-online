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

// Get team members
export async function getTeamMembers(teamId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Check if user is a member of this team
  const requestingMember = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId: session.user.id,
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

  return members;
}

// Get user's teams
export async function getUserTeams() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const teams = await prisma.teamMember.findMany({
    where: { userId: session.user.id },
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

  return teams.map(tm => ({
    ...tm.team,
    role: tm.role,
    joinedAt: tm.joinedAt,
  }));
}

// Get team by ID
export async function getTeamById(teamId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Check if user is a member of this team
  const member = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId: session.user.id,
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
    ...team,
    currentUserRole: member.role,
  };
}

// Update team details
interface UpdateTeamParams {
  teamId: string;
  name?: string;
  description?: string;
  logo?: string;
}

export async function updateTeam({
  teamId,
  name,
  description,
  logo,
}: UpdateTeamParams) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Check if user has permission
  const member = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId: session.user.id,
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
}

// Create team invitation
interface CreateInvitationParams {
  teamId: string;
  email: string;
  role: TeamRole;
}

export async function createTeamInvitation({
  teamId,
  email,
  role,
}: CreateInvitationParams) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Check if user has permission
  const member = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId: session.user.id,
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
      invitedById: session.user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  // TODO: Send invitation email

  return { success: true, invitation };
}

// Get pending invitations
export async function getTeamInvitations(teamId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Check if user has permission
  const member = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId: session.user.id,
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

  return invitations;
}

// Cancel invitation
export async function cancelTeamInvitation(invitationId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const invitation = await prisma.teamInvitation.findUnique({
    where: { id: invitationId },
    include: {
      team: {
        include: {
          members: {
            where: {
              userId: session.user.id,
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
}
