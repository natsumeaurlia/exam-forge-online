import { NextRequest, NextResponse } from 'next/server';
import { verifyCertificate } from '@/lib/actions/certificate';

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? undefined;
    const userAgent = request.headers.get('user-agent') ?? undefined;

    const result = await verifyCertificate({
      code: params.code,
      ip,
      userAgent,
    });

    if (!result.success) {
      return NextResponse.json({ success: false }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Certificate verification error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
