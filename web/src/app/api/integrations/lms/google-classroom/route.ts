/**
 * Google Classroom LMS Integration API Routes
 * Handles OAuth flow, sync operations, and grade passback
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GoogleClassroomProvider } from '@/lib/integrations/lms/google-classroom';
import { LMSIntegration, SyncOperation } from '@/types/integrations';
import { z } from 'zod';

const createLMSIntegrationSchema = z.object({
  name: z.string().min(1),
  teamId: z.string().cuid(),
  config: z.object({
    syncInterval: z.number().min(5).max(1440).default(60), // minutes
    autoSync: z.boolean().default(true),
    syncRosters: z.boolean().default(true),
    syncGrades: z.boolean().default(true),
    syncAssignments: z.boolean().default(true),
    gradeMappingRules: z
      .array(
        z.object({
          examForgeScore: z.number().min(0).max(100),
          lmsGrade: z.union([z.string(), z.number()]),
          condition: z.enum(['gte', 'lte', 'eq']).optional(),
        })
      )
      .default([]),
  }),
});

const syncRequestSchema = z.object({
  type: z.enum(['roster', 'courses', 'assignments', 'grades']),
  direction: z
    .enum(['inbound', 'outbound', 'bidirectional'])
    .default('inbound'),
});

// GET /api/integrations/lms/google-classroom - List Google Classroom integrations
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's team memberships
    const teamMemberships = await prisma.teamMember.findMany({
      where: {
        userId: session.user.id,
        status: 'ACTIVE',
      },
      include: {
        team: true,
      },
    });

    const teamIds = teamMemberships.map(tm => tm.teamId);

    // Get Google Classroom integrations for user's teams
    const integrations = await prisma.integration.findMany({
      where: {
        type: 'lms',
        provider: 'google-classroom',
        teamId: { in: teamIds },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        team: {
          select: { id: true, name: true },
        },
        syncOperations: {
          orderBy: { startedAt: 'desc' },
          take: 5,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: integrations,
    });
  } catch (error) {
    console.error('Get Google Classroom integrations error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch integrations' },
      { status: 500 }
    );
  }
}

// POST /api/integrations/lms/google-classroom - Create Google Classroom integration
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createLMSIntegrationSchema.parse(body);

    // Verify user has permission to create integrations for the team
    const teamMembership = await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        teamId: data.teamId,
        status: 'ACTIVE',
        role: { in: ['OWNER', 'ADMIN'] },
      },
    });

    if (!teamMembership) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Create LMS integration record
    const integration = await prisma.integration.create({
      data: {
        name: data.name,
        type: 'lms',
        provider: 'google-classroom',
        status: 'pending',
        teamId: data.teamId,
        config: data.config,
        credentials: {}, // Will be populated during OAuth flow
        features: [
          'roster_sync',
          'grade_passback',
          'assignment_sync',
          'course_sync',
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Generate OAuth authorization URL
    const authUrl = generateGoogleOAuthUrl(integration.id);

    return NextResponse.json({
      success: true,
      data: {
        integration,
        authUrl,
      },
    });
  } catch (error) {
    console.error('Create Google Classroom integration error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create integration' },
      { status: 500 }
    );
  }
}

// POST /api/integrations/lms/google-classroom/[id]/sync - Trigger sync operation
export async function POST_SYNC(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const integrationId = params.id;
    const body = await request.json();
    const { type, direction } = syncRequestSchema.parse(body);

    // Verify integration exists and user has permission
    const integration = await prisma.integration.findFirst({
      where: {
        id: integrationId,
        type: 'lms',
        provider: 'google-classroom',
        team: {
          members: {
            some: {
              userId: session.user.id,
              status: 'ACTIVE',
              role: { in: ['OWNER', 'ADMIN', 'MEMBER'] },
            },
          },
        },
      },
    });

    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found or insufficient permissions' },
        { status: 404 }
      );
    }

    // Create sync operation record
    const syncOperation = await prisma.syncOperation.create({
      data: {
        integrationId,
        type,
        status: 'pending',
        direction,
        recordsProcessed: 0,
        recordsSucceeded: 0,
        recordsFailed: 0,
        errors: [],
        startedAt: new Date(),
      },
    });

    // Initialize Google Classroom provider and start sync
    const provider = new GoogleClassroomProvider(integration as LMSIntegration);

    // Run sync in background
    provider
      .sync(syncOperation)
      .then(async result => {
        await prisma.syncOperation.update({
          where: { id: syncOperation.id },
          data: {
            status: result.status,
            recordsProcessed: result.recordsProcessed,
            recordsSucceeded: result.recordsSucceeded,
            recordsFailed: result.recordsFailed,
            errors: result.errors,
            completedAt: result.completedAt,
          },
        });
      })
      .catch(async error => {
        await prisma.syncOperation.update({
          where: { id: syncOperation.id },
          data: {
            status: 'failed',
            errors: [
              {
                message: error.message,
                code: 'SYNC_ERROR',
              },
            ],
            completedAt: new Date(),
          },
        });
      });

    return NextResponse.json({
      success: true,
      data: syncOperation,
    });
  } catch (error) {
    console.error('Sync Google Classroom error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to start sync' },
      { status: 500 }
    );
  }
}

// GET /api/integrations/lms/google-classroom/[id]/sync - Get sync status
export async function GET_SYNC(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const integrationId = params.id;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Verify integration exists and user has permission
    const integration = await prisma.integration.findFirst({
      where: {
        id: integrationId,
        type: 'lms',
        provider: 'google-classroom',
        team: {
          members: {
            some: {
              userId: session.user.id,
              status: 'ACTIVE',
            },
          },
        },
      },
    });

    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found or insufficient permissions' },
        { status: 404 }
      );
    }

    // Get sync operations
    const syncOperations = await prisma.syncOperation.findMany({
      where: { integrationId },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: syncOperations,
    });
  } catch (error) {
    console.error('Get sync status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sync status' },
      { status: 500 }
    );
  }
}

// POST /api/integrations/lms/google-classroom/oauth/callback - OAuth callback
export async function POST_OAUTH_CALLBACK(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, state, integrationId } = body;

    if (!code || !integrationId) {
      return NextResponse.json(
        { error: 'Missing authorization code or integration ID' },
        { status: 400 }
      );
    }

    // Exchange authorization code for access token
    const tokenResponse = await exchangeCodeForTokens(code);

    if (!tokenResponse.access_token) {
      return NextResponse.json(
        { error: 'Failed to obtain access token' },
        { status: 400 }
      );
    }

    // Update integration with credentials
    const integration = await prisma.integration.update({
      where: { id: integrationId },
      data: {
        credentials: {
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
          expiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000),
        },
        status: 'active',
        updatedAt: new Date(),
      },
    });

    // Test connection
    const provider = new GoogleClassroomProvider(integration as LMSIntegration);
    const connected = await provider.connect();

    if (!connected) {
      await prisma.integration.update({
        where: { id: integrationId },
        data: { status: 'error' },
      });

      return NextResponse.json(
        { error: 'Failed to connect to Google Classroom' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { connected: true },
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.json(
      { success: false, error: 'OAuth callback failed' },
      { status: 500 }
    );
  }
}

// DELETE /api/integrations/lms/google-classroom/[id] - Delete integration
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const integrationId = params.id;

    // Verify integration exists and user has permission
    const integration = await prisma.integration.findFirst({
      where: {
        id: integrationId,
        type: 'lms',
        provider: 'google-classroom',
        team: {
          members: {
            some: {
              userId: session.user.id,
              status: 'ACTIVE',
              role: { in: ['OWNER', 'ADMIN'] },
            },
          },
        },
      },
    });

    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found or insufficient permissions' },
        { status: 404 }
      );
    }

    // Disconnect and delete integration
    const provider = new GoogleClassroomProvider(integration as LMSIntegration);
    await provider.disconnect();

    await prisma.integration.delete({
      where: { id: integrationId },
    });

    return NextResponse.json({
      success: true,
      message: 'Integration deleted successfully',
    });
  } catch (error) {
    console.error('Delete Google Classroom integration error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete integration' },
      { status: 500 }
    );
  }
}

// Helper functions

function generateGoogleOAuthUrl(integrationId: string): string {
  const clientId = process.env.GOOGLE_CLASSROOM_CLIENT_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/lms/google-classroom/oauth/callback`;

  const scopes = [
    'https://www.googleapis.com/auth/classroom.courses.readonly',
    'https://www.googleapis.com/auth/classroom.rosters.readonly',
    'https://www.googleapis.com/auth/classroom.coursework.students',
    'https://www.googleapis.com/auth/classroom.student-submissions.students.readonly',
  ].join(' ');

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId!);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scopes);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  authUrl.searchParams.set('state', integrationId);

  return authUrl.toString();
}

async function exchangeCodeForTokens(code: string): Promise<any> {
  const clientId = process.env.GOOGLE_CLASSROOM_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLASSROOM_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/lms/google-classroom/oauth/callback`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: clientId!,
      client_secret: clientSecret!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Token exchange failed: ${error.error_description || error.error}`
    );
  }

  return await response.json();
}
