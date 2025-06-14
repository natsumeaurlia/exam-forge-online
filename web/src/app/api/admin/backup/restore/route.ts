import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DatabaseRestoreService } from '@/lib/restore';
import { z } from 'zod';

const restoreBackupSchema = z.object({
  backupId: z.string(),
  restoreType: z.enum(['full', 'selective']).default('full'),
  tables: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email || !isAdminUser(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { backupId, restoreType, tables } = restoreBackupSchema.parse(body);

    const restoreService = new DatabaseRestoreService();
    const result = await restoreService.restoreFromBackup(backupId, {
      type: restoreType,
      tables: tables || [],
    });

    return NextResponse.json({
      message: 'Restore completed successfully',
      result,
    });
  } catch (error) {
    console.error('Restore error:', error);
    return NextResponse.json(
      { error: 'Failed to restore backup' },
      { status: 500 }
    );
  }
}

function isAdminUser(email: string): boolean {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  return adminEmails.includes(email);
}
