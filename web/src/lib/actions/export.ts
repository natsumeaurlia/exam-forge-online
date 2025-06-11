'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { ja, enUS } from 'date-fns/locale';

export async function exportAnalyticsToCSV(
  quizId: string,
  range: 'all' | '30d' | '7d' = 'all',
  language: string = 'ja'
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized', data: null } as const;
  }

  try {
    // Verify access to quiz
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        team: {
          members: { some: { userId: session.user.id } },
        },
      },
      select: {
        id: true,
        title: true,
      },
    });

    if (!quiz) {
      return { success: false, error: 'Quiz not found', data: null } as const;
    }

    // Check if user has Pro plan for export feature
    // This check will be done on the client side for now

    // Set date range
    let whereClause: any = { quizId };
    const now = new Date();
    if (range === '30d') {
      whereClause.completedAt = {
        gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      };
    } else if (range === '7d') {
      whereClause.completedAt = {
        gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      };
    }

    // Fetch all responses with related data
    const responses = await prisma.quizResponse.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    // Format date based on language
    const locale = language === 'ja' ? ja : enUS;
    const dateFormat =
      language === 'ja' ? 'yyyy年MM月dd日 HH:mm' : 'MMM dd, yyyy HH:mm';

    // Create CSV header
    const headers =
      language === 'ja'
        ? [
            '回答者名',
            'メールアドレス',
            '開始日時',
            '完了日時',
            'スコア',
            '合格/不合格',
            '回答時間（秒）',
          ]
        : [
            'Respondent Name',
            'Email',
            'Start Time',
            'Completion Time',
            'Score',
            'Pass/Fail',
            'Duration (seconds)',
          ];

    // Create CSV rows
    const rows = responses.map(response => {
      const duration = response.completedAt
        ? Math.round(
            (response.completedAt.getTime() - response.startedAt.getTime()) /
              1000
          )
        : 0;

      const passStatus =
        language === 'ja'
          ? response.isPassed
            ? '合格'
            : '不合格'
          : response.isPassed
            ? 'Pass'
            : 'Fail';

      return [
        response.user?.name || (language === 'ja' ? '匿名' : 'Anonymous'),
        response.user?.email || '-',
        format(response.startedAt, dateFormat, { locale }),
        response.completedAt
          ? format(response.completedAt, dateFormat, { locale })
          : '-',
        response.score?.toString() || '0',
        passStatus,
        duration.toString(),
      ];
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    // Add BOM for Excel compatibility with Japanese characters
    const bom = '\uFEFF';
    const finalContent = bom + csvContent;

    return {
      success: true,
      error: null,
      data: {
        content: finalContent,
        filename: `${quiz.title}_analytics_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`,
        mimeType: 'text/csv;charset=utf-8',
      },
    } as const;
  } catch (error) {
    console.error('Error exporting analytics:', error);
    return {
      success: false,
      error: 'Failed to export analytics',
      data: null,
    } as const;
  }
}
