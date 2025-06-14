'use server';

import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import { authAction } from '@/lib/actions/auth-action';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { ja, enUS } from 'date-fns/locale';

const exportAnalyticsToCSVSchema = z.object({
  quizId: z.string().min(1, 'Quiz ID is required'),
  range: z.enum(['all', '30d', '7d']).default('all'),
  language: z.string().default('ja'),
});

// Team analytics export schema
const exportTeamAnalyticsToCSVSchema = z.object({
  range: z.enum(['7d', '30d', '90d', 'all']).default('30d'),
  language: z.string().default('ja'),
  exportType: z.enum(['overview', 'responses', 'rankings']).default('overview'),
});

export const exportTeamAnalyticsToCSV = authAction
  .inputSchema(exportTeamAnalyticsToCSVSchema)
  .action(async ({ parsedInput: { range, language, exportType }, ctx }) => {
    const { userId } = ctx;

    try {
      // Get user's teams
      const userTeams = await prisma.teamMember.findMany({
        where: { userId },
        select: { teamId: true },
      });
      const teamIds = userTeams.map(tm => tm.teamId);

      if (teamIds.length === 0) {
        throw new Error('No teams found for user');
      }

      // Set date range
      const now = new Date();
      let startDate: Date;

      switch (range) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'all':
        default:
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
      }

      const locale = language === 'ja' ? ja : enUS;
      const dateFormat =
        language === 'ja' ? 'yyyy年MM月dd日 HH:mm' : 'MMM dd, yyyy HH:mm';

      let csvContent = '';
      let filename = '';

      if (exportType === 'responses') {
        // Export all responses
        const responses = await prisma.quizResponse.findMany({
          where: {
            quiz: { teamId: { in: teamIds } },
            completedAt: { gte: startDate },
          },
          include: {
            user: { select: { name: true, email: true } },
            quiz: { select: { title: true } },
          },
          orderBy: { completedAt: 'desc' },
        });

        const headers =
          language === 'ja'
            ? [
                'クイズ名',
                '回答者名',
                'メールアドレス',
                '開始日時',
                '完了日時',
                'スコア',
                '合格/不合格',
                '回答時間（秒）',
              ]
            : [
                'Quiz Title',
                'Respondent Name',
                'Email',
                'Start Time',
                'Completion Time',
                'Score',
                'Pass/Fail',
                'Duration (seconds)',
              ];

        const rows = responses.map(response => {
          const duration = response.completedAt
            ? Math.round(
                (response.completedAt.getTime() -
                  response.startedAt.getTime()) /
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
            response.quiz.title,
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

        csvContent = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
        ].join('\n');
        filename = `team_responses_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
      } else if (exportType === 'rankings') {
        // Export quiz rankings
        const quizStats = await prisma.quiz.findMany({
          where: { teamId: { in: teamIds }, status: 'PUBLISHED' },
          select: {
            id: true,
            title: true,
            responses: {
              where: { completedAt: { not: null } },
              select: { score: true, totalPoints: true, isPassed: true },
            },
          },
        });

        const headers =
          language === 'ja'
            ? ['クイズ名', '回答数', '平均スコア', '合格率']
            : ['Quiz Title', 'Response Count', 'Average Score', 'Pass Rate'];

        const rows = quizStats.map(quiz => {
          const responses = quiz.responses;
          const responseCount = responses.length;
          const validResponses = responses.filter(
            r => r.score !== null && r.totalPoints > 0
          );
          const avgScore =
            validResponses.length > 0
              ? validResponses.reduce(
                  (sum, r) => sum + (r.score! / r.totalPoints) * 100,
                  0
                ) / validResponses.length
              : 0;
          const passRate =
            responseCount > 0
              ? (responses.filter(r => r.isPassed).length / responseCount) * 100
              : 0;

          return [
            quiz.title,
            responseCount.toString(),
            avgScore.toFixed(1),
            passRate.toFixed(1),
          ];
        });

        csvContent = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
        ].join('\n');
        filename = `team_rankings_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
      } else {
        // Export overview statistics
        const [allQuizzes, allResponses] = await Promise.all([
          prisma.quiz.findMany({
            where: { teamId: { in: teamIds } },
            select: { status: true, _count: { select: { questions: true } } },
          }),
          prisma.quizResponse.findMany({
            where: {
              quiz: { teamId: { in: teamIds } },
              completedAt: { not: null },
            },
            select: {
              score: true,
              totalPoints: true,
              isPassed: true,
              participantEmail: true,
            },
          }),
        ]);

        const totalQuizzes = allQuizzes.length;
        const totalParticipants = new Set(
          allResponses.map(r => r.participantEmail).filter(Boolean)
        ).size;
        const totalResponses = allResponses.length;
        const totalQuestions = allQuizzes.reduce(
          (sum, quiz) => sum + quiz._count.questions,
          0
        );

        const validScores = allResponses.filter(
          r => r.score !== null && r.totalPoints > 0
        );
        const averageScore =
          validScores.length > 0
            ? validScores.reduce(
                (sum, r) => sum + (r.score! / r.totalPoints) * 100,
                0
              ) / validScores.length
            : 0;

        const overallPassRate =
          allResponses.length > 0
            ? (allResponses.filter(r => r.isPassed).length /
                allResponses.length) *
              100
            : 0;

        const headers =
          language === 'ja' ? ['項目', '値'] : ['Metric', 'Value'];

        const rows = [
          [
            language === 'ja' ? '総クイズ数' : 'Total Quizzes',
            totalQuizzes.toString(),
          ],
          [
            language === 'ja' ? '総参加者数' : 'Total Participants',
            totalParticipants.toString(),
          ],
          [
            language === 'ja' ? '総回答数' : 'Total Responses',
            totalResponses.toString(),
          ],
          [
            language === 'ja' ? '総問題数' : 'Total Questions',
            totalQuestions.toString(),
          ],
          [
            language === 'ja' ? '平均スコア' : 'Average Score',
            `${averageScore.toFixed(1)}%`,
          ],
          [
            language === 'ja' ? '全体合格率' : 'Overall Pass Rate',
            `${overallPassRate.toFixed(1)}%`,
          ],
        ];

        csvContent = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
        ].join('\n');
        filename = `team_overview_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
      }

      // Add BOM for Excel compatibility
      const bom = '\uFEFF';
      const finalContent = bom + csvContent;

      return {
        content: finalContent,
        filename,
        mimeType: 'text/csv;charset=utf-8',
      };
    } catch (error) {
      console.error('Error exporting team analytics:', error);
      throw new Error('Failed to export team analytics');
    }
  });

export const exportAnalyticsToCSV = authAction
  .inputSchema(exportAnalyticsToCSVSchema)
  .action(async ({ parsedInput: { quizId, range, language }, ctx }) => {
    const { userId } = ctx;

    try {
      // Verify access to quiz
      const quiz = await prisma.quiz.findFirst({
        where: {
          id: quizId,
          team: {
            members: { some: { userId } },
          },
        },
        select: {
          id: true,
          title: true,
        },
      });

      if (!quiz) {
        throw new Error('Quiz not found');
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
        content: finalContent,
        filename: `${quiz.title}_analytics_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`,
        mimeType: 'text/csv;charset=utf-8',
      };
    } catch (error) {
      console.error('Error exporting analytics:', error);
      throw new Error('Failed to export analytics');
    }
  });
