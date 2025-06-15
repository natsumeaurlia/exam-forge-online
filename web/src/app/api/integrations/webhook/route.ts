/**
 * Webhook Integration API Routes
 * Handles webhook configuration and delivery endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  WebhookManager,
  WebhookEventEmitter,
} from '@/lib/integrations/webhook/webhook-manager';
import { WebhookIntegration, WebhookPayload } from '@/types/integrations';
import { z } from 'zod';

const createWebhookSchema = z.object({
  name: z.string().min(1),
  deliveryUrl: z.string().url(),
  events: z.array(z.string()),
  config: z.object({
    retryAttempts: z.number().min(0).max(10).default(3),
    retryDelay: z.number().min(1).max(300).default(5),
    timeout: z.number().min(1).max(30).default(10),
    verifySSL: z.boolean().default(true),
    customHeaders: z.record(z.string()).optional(),
    authType: z.enum(['none', 'bearer', 'basic', 'hmac']).default('none'),
    authValue: z.string().optional(),
  }),
});

const updateWebhookSchema = createWebhookSchema.partial();

// GET /api/integrations/webhook - List webhook integrations
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

    // Get webhook integrations for user's teams
    const webhooks = await prisma.integration.findMany({
      where: {
        type: 'webhook',
        teamId: { in: teamIds },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: webhooks,
    });
  } catch (error) {
    console.error('Get webhooks error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch webhooks' },
      { status: 500 }
    );
  }
}

// POST /api/integrations/webhook - Create webhook integration
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createWebhookSchema.parse(body);

    // Verify user has permission to create integrations for the team
    const teamId = body.teamId;
    const teamMembership = await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        teamId,
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

    // Generate webhook secret
    const secret = generateWebhookSecret();

    // Create webhook integration
    const webhook = await prisma.integration.create({
      data: {
        name: data.name,
        type: 'webhook',
        status: 'pending',
        teamId,
        config: data.config,
        credentials: { secret },
        deliveryUrl: data.deliveryUrl,
        events: data.events,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Initialize webhook manager
    const manager = new WebhookManager(webhook as WebhookIntegration);

    // Test connection
    const connected = await manager.connect();

    if (connected) {
      await WebhookEventEmitter.addIntegration(webhook as WebhookIntegration);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...webhook,
        secret, // Include secret in response for initial setup
      },
    });
  } catch (error) {
    console.error('Create webhook error:', error);

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
      { success: false, error: 'Failed to create webhook' },
      { status: 500 }
    );
  }
}

// PUT /api/integrations/webhook/[id] - Update webhook integration
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const webhookId = params.id;
    const body = await request.json();
    const data = updateWebhookSchema.parse(body);

    // Verify webhook exists and user has permission
    const webhook = await prisma.integration.findFirst({
      where: {
        id: webhookId,
        type: 'webhook',
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

    if (!webhook) {
      return NextResponse.json(
        { error: 'Webhook not found or insufficient permissions' },
        { status: 404 }
      );
    }

    // Update webhook
    const updatedWebhook = await prisma.integration.update({
      where: { id: webhookId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    // Update webhook manager
    const manager = new WebhookManager(updatedWebhook as WebhookIntegration);
    await manager.connect();
    await WebhookEventEmitter.addIntegration(
      updatedWebhook as WebhookIntegration
    );

    return NextResponse.json({
      success: true,
      data: updatedWebhook,
    });
  } catch (error) {
    console.error('Update webhook error:', error);

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
      { success: false, error: 'Failed to update webhook' },
      { status: 500 }
    );
  }
}

// DELETE /api/integrations/webhook/[id] - Delete webhook integration
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const webhookId = params.id;

    // Verify webhook exists and user has permission
    const webhook = await prisma.integration.findFirst({
      where: {
        id: webhookId,
        type: 'webhook',
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

    if (!webhook) {
      return NextResponse.json(
        { error: 'Webhook not found or insufficient permissions' },
        { status: 404 }
      );
    }

    // Delete webhook
    await prisma.integration.delete({
      where: { id: webhookId },
    });

    // Remove from webhook manager
    await WebhookEventEmitter.removeIntegration(webhookId);

    return NextResponse.json({
      success: true,
      message: 'Webhook deleted successfully',
    });
  } catch (error) {
    console.error('Delete webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete webhook' },
      { status: 500 }
    );
  }
}

// POST /api/integrations/webhook/[id]/test - Test webhook delivery
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const webhookId = params.id;

    // Verify webhook exists and user has permission
    const webhook = await prisma.integration.findFirst({
      where: {
        id: webhookId,
        type: 'webhook',
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

    if (!webhook) {
      return NextResponse.json(
        { error: 'Webhook not found or insufficient permissions' },
        { status: 404 }
      );
    }

    // Test webhook delivery
    const manager = new WebhookManager(webhook as WebhookIntegration);
    const success = await manager.testConnection();

    return NextResponse.json({
      success: true,
      data: { connected: success },
    });
  } catch (error) {
    console.error('Test webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to test webhook' },
      { status: 500 }
    );
  }
}

// GET /api/integrations/webhook/[id]/deliveries - Get webhook delivery history
export async function GET_DELIVERIES(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const webhookId = params.id;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // Verify webhook exists and user has permission
    const webhook = await prisma.integration.findFirst({
      where: {
        id: webhookId,
        type: 'webhook',
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

    if (!webhook) {
      return NextResponse.json(
        { error: 'Webhook not found or insufficient permissions' },
        { status: 404 }
      );
    }

    // Get delivery history
    const manager = new WebhookManager(webhook as WebhookIntegration);
    const deliveries = await manager.getDeliveryHistory(limit);
    const stats = await manager.getDeliveryStats();

    return NextResponse.json({
      success: true,
      data: {
        deliveries,
        stats,
      },
    });
  } catch (error) {
    console.error('Get webhook deliveries error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch delivery history' },
      { status: 500 }
    );
  }
}

function generateWebhookSecret(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}
