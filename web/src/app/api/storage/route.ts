import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserStorage } from '@/lib/actions/storage';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user storage information
    const storageResult = await getUserStorage();

    if (!storageResult.success || !storageResult.data) {
      return NextResponse.json(
        { error: 'Failed to get storage info' },
        { status: 500 }
      );
    }

    // Calculate additional properties
    const storageUsedGB = storageResult.data.storageUsed / (1024 * 1024 * 1024);
    const storageLimitGB =
      storageResult.data.storageLimit / (1024 * 1024 * 1024);
    const percentageUsed =
      (storageResult.data.storageUsed / storageResult.data.storageLimit) * 100;

    // Return storage info with the expected structure
    return NextResponse.json({
      storageUsed: storageResult.data.storageUsed,
      storageLimit: storageResult.data.storageLimit,
      storageUsedGB: parseFloat(storageUsedGB.toFixed(2)),
      storageLimitGB: parseFloat(storageLimitGB.toFixed(2)),
      percentageUsed: parseFloat(percentageUsed.toFixed(2)),
    });
  } catch (error) {
    console.error('Storage API error:', error);
    return NextResponse.json(
      { error: 'Failed to get storage info' },
      { status: 500 }
    );
  }
}
