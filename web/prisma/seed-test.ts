import {
  PrismaClient,
  QuizStatus,
  ScoringType,
  SharingMode,
  QuestionType,
  TeamRole,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

/**
 * テストデータのシード
 * 開発・テスト用のサンプルデータを投入
 */
export async function seedTestData(prisma: PrismaClient) {
  try {
    console.log('🧪 テストデータのシード開始...');

    // テスト用ユーザーを作成または取得
    let testUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
    });

    if (!testUser) {
      // パスワードをハッシュ化 (統一パスワード)
      const hashedPassword = await bcrypt.hash('TestPassword123!', 10);

      testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'テストユーザー',
          image: null,
          stripeCustomerId: `cus_test_${Date.now()}`,
        },
      });
      console.log('✅ テストユーザー作成:', testUser.email);
      console.log('   パスワード: TestPassword123!');
    }

    // E2E認証テスト用の追加ユーザー
    const e2eUsers = [
      {
        email: 'userA@example.com',
        name: 'User A (E2E Test)',
        password: 'TestPassword123!',
      },
      {
        email: 'userB@example.com',
        name: 'User B (E2E Test)',
        password: 'TestPassword123!',
      },
      {
        email: 'security-test@example.com',
        name: 'Security Test User',
        password: 'TestPassword123!',
      },
    ];

    const createdE2EUsers = [];
    for (const userData of e2eUsers) {
      let user = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (!user) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        user = await prisma.user.create({
          data: {
            email: userData.email,
            name: userData.name,
            image: null,
            stripeCustomerId: `cus_e2e_${Date.now()}_${userData.email.split('@')[0]}`,
          },
        });
      }
      createdE2EUsers.push(user);
    }
    console.log(
      '✅ E2E認証テスト用ユーザー作成:',
      createdE2EUsers.length,
      '名'
    );
    // 追加のユーザーを作成（チームメンバー用）
    const teamMembers = [];
    for (let i = 1; i <= 3; i++) {
      let member = await prisma.user.findUnique({
        where: { email: `member${i}@example.com` },
      });

      if (!member) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        member = await prisma.user.create({
          data: {
            email: `member${i}@example.com`,
            name: `チームメンバー${i}`,
            image: null,
          },
        });
      }
      teamMembers.push(member);
    }
    console.log('✅ チームメンバー作成:', teamMembers.length, '名');

    // テスト用チームを作成
    let testTeam = await prisma.team.findUnique({
      where: { slug: 'test-team' },
    });

    if (!testTeam) {
      testTeam = await prisma.team.create({
        data: {
          name: 'テストチーム',
          slug: 'test-team',
          description: '開発テスト用のチームです',
          creatorId: testUser.id,
          members: {
            create: [
              {
                userId: testUser.id,
                role: TeamRole.OWNER,
              },
              ...teamMembers.map((member, index) => ({
                userId: member.id,
                role: index === 0 ? TeamRole.ADMIN : TeamRole.MEMBER,
              })),
            ],
          },
          teamSettings: {
            create: {
              maxMembers: 10,
              allowMemberInvite: true,
              requireApproval: false,
            },
          },
        },
      });
      console.log('✅ テストチーム作成:', testTeam.name);
    }

    // プロプランのサブスクリプションを作成または取得
    const proPlan = await prisma.plan.findUnique({
      where: { type: 'PRO' },
    });

    if (proPlan) {
      const existingSubscription = await prisma.subscription.findUnique({
        where: { teamId: testTeam.id },
      });

      if (!existingSubscription) {
        const memberCount = 4; // チームメンバー数
        const pricePerMember = proPlan.yearlyPricePerMember || 29760; // 年額29,760円/人

        await prisma.subscription.create({
          data: {
            teamId: testTeam.id,
            planId: proPlan.id,
            stripeSubscriptionId: `sub_test_${Date.now()}`,
            stripeCustomerId:
              testUser.stripeCustomerId || `cus_test_${Date.now()}`,
            stripePriceId: `price_test_${Date.now()}`,
            stripeProductId: `prod_test_${Date.now()}`,
            status: 'ACTIVE',
            billingCycle: 'YEARLY',
            memberCount: memberCount,
            pricePerMember: pricePerMember,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1年後
          },
        });
        console.log(
          '✅ プロプランサブスクリプション作成（年額契約: 4名 × 29,760円 = 119,040円/年）'
        );
      } else {
        console.log('⏭️ サブスクリプション既存');
      }
    }

    // タグを作成
    const tagData = [
      { name: '数学', color: '#3B82F6' },
      { name: '英語', color: '#10B981' },
      { name: '歴史', color: '#F59E0B' },
      { name: '科学', color: '#8B5CF6' },
      { name: '一般常識', color: '#EF4444' },
    ];

    const tags = await Promise.all(
      tagData.map(tag =>
        prisma.tag.upsert({
          where: {
            teamId_name: {
              teamId: testTeam.id,
              name: tag.name,
            },
          },
          update: {},
          create: {
            name: tag.name,
            color: tag.color,
            team: {
              connect: { id: testTeam.id },
            },
          },
        })
      )
    );
    console.log(`✅ タグ作成: ${tags.length}件`);

    // テスト用クイズデータ
    const quizzes = [
      {
        title: '基本的な数学問題',
        description:
          '小学校レベルの算数問題です。四則演算の基本を確認しましょう。',
        status: QuizStatus.PUBLISHED,
        scoringType: ScoringType.AUTO,
        sharingMode: SharingMode.URL,
        subdomain: 'basic-math',
        publishedAt: new Date('2024-01-15'),
        tags: ['数学'],
      },
      {
        title: '英単語テスト - 初級',
        description: '基本的な英単語の理解度をチェックします。',
        status: QuizStatus.PUBLISHED,
        scoringType: ScoringType.AUTO,
        sharingMode: SharingMode.URL,
        subdomain: 'english-basic',
        publishedAt: new Date('2024-01-20'),
        tags: ['英語'],
      },
      {
        title: '日本の歴史 - 戦国時代',
        description: '戦国時代の出来事や人物に関する問題です。',
        status: QuizStatus.DRAFT,
        scoringType: ScoringType.MANUAL,
        sharingMode: SharingMode.PASSWORD,
        password: 'history123',
        tags: ['歴史'],
      },
      {
        title: '理科の基礎知識',
        description: '物理・化学・生物の基本的な知識を問います。',
        status: QuizStatus.PUBLISHED,
        scoringType: ScoringType.AUTO,
        sharingMode: SharingMode.URL,
        subdomain: 'science-basic',
        publishedAt: new Date('2024-02-01'),
        tags: ['科学'],
      },
      {
        title: '一般常識クイズ',
        description: '日常生活で役立つ一般常識を確認しましょう。',
        status: QuizStatus.PUBLISHED,
        scoringType: ScoringType.AUTO,
        sharingMode: SharingMode.URL,
        publishedAt: new Date('2024-02-10'),
        tags: ['一般常識'],
        timeLimit: 30, // 30分
      },
      {
        title: '上級数学 - 微分積分',
        description: '高校・大学レベルの微分積分問題です。',
        status: QuizStatus.ARCHIVED,
        scoringType: ScoringType.AUTO,
        sharingMode: SharingMode.URL,
        tags: ['数学', '科学'],
      },
      // E2Eテスト専用のクイズ
      {
        title: 'E2E Test Quiz',
        description: 'End-to-End testing用のクイズです。',
        status: QuizStatus.PUBLISHED,
        scoringType: ScoringType.AUTO,
        sharingMode: SharingMode.URL,
        subdomain: 'e2e-test-quiz',
        publishedAt: new Date(),
        tags: ['テスト'],
      },
    ];

    // クイズを作成
    for (const quizData of quizzes) {
      const existingQuiz = await prisma.quiz.findFirst({
        where: {
          title: quizData.title,
          teamId: testTeam.id,
        },
      });

      if (!existingQuiz) {
        const { tags: tagNames, ...quiz } = quizData;
        const quizTags = tags.filter(tag => tagNames.includes(tag.name));

        const createdQuiz = await prisma.quiz.create({
          data: {
            ...quiz,
            teamId: testTeam.id,
            createdById: testUser.id,
            tags: {
              create: quizTags.map(tag => ({
                tagId: tag.id,
              })),
            },
            questions: {
              create: getQuestionsForQuiz(quiz.title),
            },
          },
          include: {
            questions: true,
            tags: true,
          },
        });

        console.log(
          `✅ クイズ作成: ${createdQuiz.title} (${createdQuiz.questions.length}問)`
        );
      }
    }

    // 回答データの作成（E2Eテスト対応版）
    const publishedQuizzes = await prisma.quiz.findMany({
      where: {
        teamId: testTeam.id,
        status: QuizStatus.PUBLISHED,
      },
      include: {
        questions: true,
      },
    });

    // テスト用の参加者情報
    const testParticipants = [
      { name: 'テスト参加者', email: 'participant@example.com' },
      { name: '匿名参加者', email: 'anonymous@example.com' },
      { name: 'E2E参加者', email: 'e2e-participant@example.com' },
    ];

    for (const quiz of publishedQuizzes.slice(0, 3)) {
      // 各クイズに対して詳細な回答データを生成
      const responseCount = Math.floor(Math.random() * 6) + 5;

      for (let i = 0; i < responseCount; i++) {
        const totalPoints = quiz.questions.reduce(
          (sum, q) => sum + q.points,
          0
        );
        const score = Math.floor(
          Math.random() * totalPoints * 0.4 + totalPoints * 0.6
        ); // 60-100%のスコア

        const participant = testParticipants[i % testParticipants.length];
        const duration = Math.floor(Math.random() * 600) + 120; // 2-12分

        await prisma.quizResponse.create({
          data: {
            quizId: quiz.id,
            userId: i % 2 === 0 ? testUser.id : null, // 一部は匿名回答
            score,
            totalPoints,
            isPassed: score >= totalPoints * 0.7,
            startedAt: new Date(
              Date.now() -
                Math.random() * 30 * 24 * 60 * 60 * 1000 -
                duration * 1000
            ),
            completedAt: new Date(
              Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
            ), // 過去30日以内
            responses: {
              create: quiz.questions.map((question, qIndex) => {
                const isCorrect = Math.random() > 0.3; // 70%の確率で正解
                return {
                  question: {
                    connect: { id: question.id },
                  },
                  answer: getDetailedAnswer(question.type, isCorrect),
                  score: isCorrect ? question.points : 0,
                  isCorrect,
                };
              }),
            },
          },
        });
      }

      // 完璧スコア（100%）のテストデータを追加
      const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);
      await prisma.quizResponse.create({
        data: {
          quizId: quiz.id,
          userId: null, // 匿名回答
          score: totalPoints,
          totalPoints,
          isPassed: true,
          startedAt: new Date(Date.now() - 300000), // 5分前開始
          completedAt: new Date(),
          responses: {
            create: quiz.questions.map((question, qIndex) => ({
              question: {
                connect: { id: question.id },
              },
              answer: getCorrectAnswer(question),
              score: question.points,
              isCorrect: true,
            })),
          },
        },
      });
    }

    console.log('✅ 回答データ作成完了');

    // 保留中の招待を作成
    const pendingInvitation = await prisma.teamInvitation.create({
      data: {
        email: 'newmember@example.com',
        teamId: testTeam.id,
        invitedById: testUser.id,
        role: TeamRole.MEMBER,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7日後
      },
    });
    console.log('✅ チーム招待作成:', pendingInvitation.email);

    // 個人利用のFreeプランユーザーを作成
    let personalUser = await prisma.user.findUnique({
      where: { email: 'personal@example.com' },
    });

    if (!personalUser) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      personalUser = await prisma.user.create({
        data: {
          email: 'personal@example.com',
          name: '個人ユーザー',
          image: null,
        },
      });
    }

    // 個人チーム（Freeプラン）を作成
    let personalTeam = await prisma.team.findUnique({
      where: { slug: 'personal-team' },
    });

    if (!personalTeam) {
      personalTeam = await prisma.team.create({
        data: {
          name: '個人ユーザーの個人チーム',
          slug: 'personal-team',
          description: '個人利用のためのチーム',
          creatorId: personalUser.id,
          members: {
            create: {
              userId: personalUser.id,
              role: TeamRole.OWNER,
            },
          },
          teamSettings: {
            create: {
              maxMembers: 1,
              allowMemberInvite: false,
              requireApproval: false,
            },
          },
        },
      });
      console.log('✅ 個人チーム作成（Freeプラン）:', personalTeam.name);

      // Freeプランのサブスクリプションを作成
      const freePlan = await prisma.plan.findUnique({
        where: { type: 'FREE' },
      });

      if (freePlan) {
        await prisma.subscription.create({
          data: {
            teamId: personalTeam.id,
            planId: freePlan.id,
            stripeSubscriptionId: `sub_free_${Date.now()}`,
            stripeCustomerId:
              personalUser.stripeCustomerId || `cus_free_${Date.now()}`,
            stripePriceId: `price_free_${Date.now()}`,
            stripeProductId: `prod_free_${Date.now()}`,
            status: 'ACTIVE',
            billingCycle: 'MONTHLY',
            memberCount: 1,
            pricePerMember: 0,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30日後
          },
        });
        console.log('✅ Freeプランサブスクリプション作成（個人利用）');
      }
    }

    console.log('✅ テストデータのシード完了');
  } catch (error) {
    console.error('❌ テストデータのシードエラー:', error);
    throw error;
  }
}

// クイズタイトルに基づいて問題を生成
function getQuestionsForQuiz(title: string) {
  const questionsByQuiz: Record<string, any[]> = {
    基本的な数学問題: [
      {
        type: QuestionType.MULTIPLE_CHOICE,
        text: '12 + 8 = ?',
        points: 1,
        order: 1,
        correctAnswer: '20',
        options: {
          create: [
            { text: '18', isCorrect: false, order: 1 },
            { text: '19', isCorrect: false, order: 2 },
            { text: '20', isCorrect: true, order: 3 },
            { text: '21', isCorrect: false, order: 4 },
          ],
        },
      },
      {
        type: QuestionType.TRUE_FALSE,
        text: '5 × 6 = 30',
        points: 1,
        order: 2,
        correctAnswer: true,
      },
      {
        type: QuestionType.SHORT_ANSWER,
        text: '100 ÷ 5 = ?',
        points: 2,
        order: 3,
        correctAnswer: '20',
        hint: '5 × ? = 100',
      },
    ],
    '英単語テスト - 初級': [
      {
        type: QuestionType.MULTIPLE_CHOICE,
        text: '"Apple"の日本語訳は？',
        points: 1,
        order: 1,
        correctAnswer: 'りんご',
        options: {
          create: [
            { text: 'みかん', isCorrect: false, order: 1 },
            { text: 'りんご', isCorrect: true, order: 2 },
            { text: 'ぶどう', isCorrect: false, order: 3 },
            { text: 'もも', isCorrect: false, order: 4 },
          ],
        },
      },
      {
        type: QuestionType.TRUE_FALSE,
        text: '"Dog"は「猫」という意味である',
        points: 1,
        order: 2,
        correctAnswer: false,
      },
      {
        type: QuestionType.CHECKBOX,
        text: '次のうち、動物を表す英単語を選んでください',
        points: 2,
        order: 3,
        correctAnswer: ['Cat', 'Dog'],
        options: {
          create: [
            { text: 'Cat', isCorrect: true, order: 1 },
            { text: 'Table', isCorrect: false, order: 2 },
            { text: 'Dog', isCorrect: true, order: 3 },
            { text: 'Chair', isCorrect: false, order: 4 },
          ],
        },
      },
    ],
    理科の基礎知識: [
      {
        type: QuestionType.MULTIPLE_CHOICE,
        text: '水の化学式は？',
        points: 1,
        order: 1,
        correctAnswer: 'H2O',
        options: {
          create: [
            { text: 'CO2', isCorrect: false, order: 1 },
            { text: 'H2O', isCorrect: true, order: 2 },
            { text: 'O2', isCorrect: false, order: 3 },
            { text: 'N2', isCorrect: false, order: 4 },
          ],
        },
      },
      {
        type: QuestionType.TRUE_FALSE,
        text: '光は真空中で最も速く伝わる',
        points: 1,
        order: 2,
        correctAnswer: true,
        explanation: '光の速度は真空中で約30万km/秒です。',
      },
    ],
    'E2E Test Quiz': [
      {
        type: QuestionType.MULTIPLE_CHOICE,
        text: 'TypeScriptはJavaScriptのスーパーセットですか？',
        points: 1,
        order: 1,
        correctAnswer: 'はい',
        options: {
          create: [
            { text: 'はい', isCorrect: true, order: 1 },
            { text: 'いいえ', isCorrect: false, order: 2 },
          ],
        },
      },
      {
        type: QuestionType.TRUE_FALSE,
        text: 'Next.js 15はApp Routerを使用していますか？',
        points: 1,
        order: 2,
        correctAnswer: true,
      },
    ],
  };

  // デフォルトの問題セット
  const defaultQuestions = [
    {
      type: QuestionType.MULTIPLE_CHOICE,
      text: '次のうち正しいものはどれですか？',
      points: 1,
      order: 1,
      correctAnswer: 'A',
      options: {
        create: [
          { text: 'A', isCorrect: true, order: 1 },
          { text: 'B', isCorrect: false, order: 2 },
          { text: 'C', isCorrect: false, order: 3 },
          { text: 'D', isCorrect: false, order: 4 },
        ],
      },
    },
    {
      type: QuestionType.TRUE_FALSE,
      text: 'この文章は正しい',
      points: 1,
      order: 2,
      correctAnswer: true,
    },
  ];

  return questionsByQuiz[title] || defaultQuestions;
}

// ランダムな回答を生成
function getRandomAnswer(
  type: QuestionType
): string | boolean | string[] | Record<string, string> {
  switch (type) {
    case QuestionType.TRUE_FALSE:
      return Math.random() > 0.5;
    case QuestionType.MULTIPLE_CHOICE:
      return ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)];
    case QuestionType.CHECKBOX:
      const options = ['A', 'B', 'C', 'D'];
      const selected = options.filter(() => Math.random() > 0.5);
      return selected.length > 0 ? selected : ['A'];
    case QuestionType.SHORT_ANSWER:
      return 'サンプル回答';
    case QuestionType.FILL_IN_BLANK:
      return '答え';
    case QuestionType.NUMERIC:
      return '42';
    case QuestionType.SORTING:
      return ['1', '2', '3', '4'];
    case QuestionType.MATCHING:
      return { A: '1', B: '2', C: '3' };
    case QuestionType.DIAGRAM:
      return 'ダイアグラムの回答';
    default:
      return 'デフォルト回答';
  }
}

// E2Eテスト用の詳細な回答を生成
function getDetailedAnswer(
  type: QuestionType,
  isCorrect: boolean = false
): string | boolean | string[] | Record<string, string> {
  switch (type) {
    case QuestionType.TRUE_FALSE:
      return isCorrect ? true : false;
    case QuestionType.MULTIPLE_CHOICE:
      return isCorrect ? 'りんご' : 'みかん'; // 実際の選択肢に基づく
    case QuestionType.CHECKBOX:
      return isCorrect ? ['Cat', 'Dog'] : ['Table', 'Chair'];
    case QuestionType.SHORT_ANSWER:
      return isCorrect ? '20' : '18';
    case QuestionType.FILL_IN_BLANK:
      return isCorrect ? 'H2O' : 'CO2';
    case QuestionType.NUMERIC:
      return isCorrect ? '20' : '25';
    default:
      return isCorrect ? '正解' : '不正解';
  }
}

// 問題の正解を取得
function getCorrectAnswer(
  question: any
): string | boolean | string[] | Record<string, string> {
  if (question.correctAnswer) {
    return question.correctAnswer;
  }

  // 問題タイプに基づいてデフォルトの正解を返す
  switch (question.type) {
    case QuestionType.TRUE_FALSE:
      return true;
    case QuestionType.MULTIPLE_CHOICE:
      return '20'; // 基本的な数学問題の正解
    case QuestionType.CHECKBOX:
      return ['Cat', 'Dog'];
    case QuestionType.SHORT_ANSWER:
      return '20';
    default:
      return '正解';
  }
}
