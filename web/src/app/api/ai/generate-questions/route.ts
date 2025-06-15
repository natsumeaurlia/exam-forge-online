import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { aiQuestionService } from '@/lib/services/ai';
import { canUseFeature, incrementUsage, FEATURES } from '@/lib/feature-flags';
import { generationRequestSchema } from '@/lib/services/ai/schemas';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '認証が必要です' },
        { status: 401 }
      );
    }

    // Get user's team
    const teamMember = await prisma.teamMember.findFirst({
      where: { userId: session.user.id },
      include: { team: true },
    });

    if (!teamMember) {
      return NextResponse.json(
        { success: false, error: 'チームメンバーシップが必要です' },
        { status: 403 }
      );
    }

    const teamId = teamMember.teamId;

    // Check feature access
    const canUse = await canUseFeature(teamId, FEATURES.AI_GENERATION);
    if (!canUse) {
      return NextResponse.json(
        {
          success: false,
          error: 'AI問題生成機能はProプランでご利用いただけます',
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = generationRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'リクエストパラメータが無効です',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const params = validation.data;

    // Generate questions
    const result = await aiQuestionService.generateQuestions(params);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'AI問題生成に失敗しました',
        },
        { status: 500 }
      );
    }

    // Save questions to database
    const savedQuestions = [];

    for (const question of result.questions) {
      try {
        const bankQuestion = await prisma.bankQuestion.create({
          data: {
            teamId,
            createdById: session.user.id,
            type: question.type,
            text: question.text,
            points: question.points,
            hint: question.hint,
            explanation: question.explanation,
            difficulty: question.difficulty,
            aiGenerated: true,
            aiMetadata: {
              generatedAt: new Date().toISOString(),
              model: result.metadata.model,
              providerId: result.metadata.providerId,
              generationParams: params,
              tokensUsed: Math.ceil(
                result.metadata.tokensUsed / result.questions.length
              ),
            },
            options: question.options
              ? {
                  create: question.options.map((option, index) => ({
                    text: option.text,
                    isCorrect: option.isCorrect,
                    order: index + 1,
                  })),
                }
              : undefined,
          },
          include: {
            options: {
              orderBy: { order: 'asc' },
            },
          },
        });

        savedQuestions.push(bankQuestion);
      } catch (questionError) {
        console.error('Failed to save generated question:', questionError);
      }
    }

    // Track usage
    try {
      await incrementUsage(
        teamId,
        FEATURES.AI_GENERATION,
        savedQuestions.length
      );
    } catch (usageError) {
      console.error('Failed to track AI generation usage:', usageError);
    }

    return NextResponse.json({
      success: true,
      questions: savedQuestions,
      metadata: {
        generated: result.questions.length,
        saved: savedQuestions.length,
        tokensUsed: result.metadata.tokensUsed,
        generationTime: result.metadata.generationTime,
        model: result.metadata.model,
      },
    });
  } catch (error) {
    console.error('AI generation API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'サーバーエラーが発生しました',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '認証が必要です' },
        { status: 401 }
      );
    }

    // Get available AI providers
    const providers = await aiQuestionService.getAvailableProviders();

    return NextResponse.json({
      success: true,
      providers,
    });
  } catch (error) {
    console.error('AI providers API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'サーバーエラーが発生しました',
      },
      { status: 500 }
    );
  }
}
