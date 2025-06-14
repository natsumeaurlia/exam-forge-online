import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { initializeBackupService } from '@/lib/backup';
import { z } from 'zod';

const createBackupSchema = z.object({
  type: z.enum(['full', 'incremental']).default('full'),
});

const restoreBackupSchema = z.object({
  backupId: z.string(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email || !isAdminUser(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const backupService = await initializeBackupService();
    const backups = await backupService.listBackups();

    return NextResponse.json({ backups });
  } catch (error) {
    console.error('Backup list error:', error);
    return NextResponse.json(
      { error: 'Failed to list backups' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email || !isAdminUser(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type } = createBackupSchema.parse(body);

    const backupService = await initializeBackupService();
    const backup = await backupService.scheduleBackup(type);

    return NextResponse.json({
      message: 'Backup created successfully',
      backup,
    });
  } catch (error) {
    console.error('Backup creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create backup' },
      { status: 500 }
    );
  }
}

function isAdminUser(email: string): boolean {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  return adminEmails.includes(email);
}
