import {
  PrismaClient,
  QuizStatus,
  ScoringType,
  SharingMode,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // テスト用ユーザーを作成または取得
  let testUser = await prisma.user.findUnique({
    where: { email: 'test@example.com' },
  });

  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'テストユーザー',
        image: null,
      },
    });
  }

  console.log({ testUser });

  // タグを作成
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { name: '数学' },
      update: {},
      create: { name: '数学', color: '#3B82F6' },
    }),
    prisma.tag.upsert({
      where: { name: '英語' },
      update: {},
      create: { name: '英語', color: '#10B981' },
    }),
    prisma.tag.upsert({
      where: { name: '歴史' },
      update: {},
      create: { name: '歴史', color: '#F59E0B' },
    }),
    prisma.tag.upsert({
      where: { name: '科学' },
      update: {},
      create: { name: '科学', color: '#8B5CF6' },
    }),
    prisma.tag.upsert({
      where: { name: '一般常識' },
      update: {},
      create: { name: '一般常識', color: '#EF4444' },
    }),
  ]);

  console.log({ tags });

  // クイズを作成
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
      title: '英語基礎単語テスト',
      description:
        '中学1年生レベルの英単語テストです。基本的な単語を覚えているかチェックしましょう。',
      status: QuizStatus.PUBLISHED,
      scoringType: ScoringType.AUTO,
      sharingMode: SharingMode.URL,
      subdomain: 'english-basic',
      publishedAt: new Date('2024-02-01'),
      tags: ['英語'],
    },
    {
      title: '日本史クイズ',
      description: '江戸時代から明治時代にかけての歴史問題です。',
      status: QuizStatus.DRAFT,
      scoringType: ScoringType.AUTO,
      sharingMode: SharingMode.URL,
      tags: ['歴史'],
    },
    {
      title: '理科実験クイズ',
      description:
        '中学理科の実験に関する問題集です。実験の手順や結果について学びましょう。',
      status: QuizStatus.PUBLISHED,
      scoringType: ScoringType.MANUAL,
      sharingMode: SharingMode.PASSWORD,
      password: 'science123',
      subdomain: 'science-quiz',
      publishedAt: new Date('2024-03-10'),
      tags: ['科学'],
    },
    {
      title: '一般常識テスト',
      description: '社会人として知っておきたい一般常識問題です。',
      status: QuizStatus.DRAFT,
      scoringType: ScoringType.AUTO,
      sharingMode: SharingMode.URL,
      tags: ['一般常識'],
    },
    {
      title: '高校数学 - 二次関数',
      description:
        '高校数学の二次関数に関する問題です。グラフの性質や計算問題を含みます。',
      status: QuizStatus.PUBLISHED,
      scoringType: ScoringType.AUTO,
      sharingMode: SharingMode.URL,
      subdomain: 'quadratic-functions',
      publishedAt: new Date('2024-04-05'),
      tags: ['数学'],
    },
  ];

  for (const quizData of quizzes) {
    const { tags: quizTags, ...quizInfo } = quizData;

    // 既存のクイズをチェック
    const existingQuiz = await prisma.quiz.findFirst({
      where: {
        userId: testUser.id,
        title: quizInfo.title,
      },
    });

    const quiz =
      existingQuiz ||
      (await prisma.quiz.create({
        data: {
          ...quizInfo,
          userId: testUser.id,
        },
      }));

    // タグを関連付け
    for (const tagName of quizTags) {
      const tag = tags.find(t => t.name === tagName);
      if (tag) {
        await prisma.quizTag.upsert({
          where: {
            quizId_tagId: {
              quizId: quiz.id,
              tagId: tag.id,
            },
          },
          update: {},
          create: {
            quizId: quiz.id,
            tagId: tag.id,
          },
        });
      }
    }

    // 問題を作成（各クイズに3-5問）
    const questionCount = Math.floor(Math.random() * 3) + 3; // 3-5問
    for (let i = 1; i <= questionCount; i++) {
      const question = await prisma.question.create({
        data: {
          quizId: quiz.id,
          type: QuestionType.MULTIPLE_CHOICE,
          text: `${quiz.title} - 問題${i}`,
          points: 10,
          hint: `問題${i}のヒントです`,
          explanation: `問題${i}の解説です`,
          order: i,
        },
      });

      // 選択肢を作成
      const options = [
        { text: '選択肢A', isCorrect: i === 1 },
        { text: '選択肢B', isCorrect: i === 2 },
        { text: '選択肢C', isCorrect: i === 3 },
        { text: '選択肢D', isCorrect: i === 4 },
      ];

      for (let j = 0; j < options.length; j++) {
        await prisma.questionOption.create({
          data: {
            questionId: question.id,
            text: options[j].text,
            isCorrect: options[j].isCorrect,
            order: j + 1,
          },
        });
      }
    }

    // ダミーの回答データを作成
    const responseCount = Math.floor(Math.random() * 50) + 10; // 10-59回答
    for (let i = 0; i < responseCount; i++) {
      await prisma.quizResponse.create({
        data: {
          quizId: quiz.id,
          score: Math.floor(Math.random() * 100),
          totalPoints: questionCount * 10,
          completedAt: new Date(
            Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
          ), // 過去30日以内
        },
      });
    }

    console.log(
      `Created quiz: ${quiz.title} with ${questionCount} questions and ${responseCount} responses`
    );
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async e => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
