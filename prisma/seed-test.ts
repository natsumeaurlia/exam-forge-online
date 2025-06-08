import {
  PrismaClient,
  QuizStatus,
  ScoringType,
  SharingMode,
  QuestionType,
} from '@prisma/client';

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
      testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'テストユーザー',
          image: null,
        },
      });
      console.log('✅ テストユーザー作成:', testUser.email);
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
          where: { name: tag.name },
          update: {},
          create: tag,
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

    // クイズの作成
    for (const quizData of quizzes) {
      const { tags: quizTags, ...quizInfo } = quizData;

      // 既存のクイズをチェック
      const existingQuiz = await prisma.quiz.findFirst({
        where: {
          userId: testUser.id,
          title: quizInfo.title,
        },
      });

      if (existingQuiz) {
        console.log(`⏭️ クイズ既存: ${quizInfo.title}`);
        continue;
      }

      const quiz = await prisma.quiz.create({
        data: {
          ...quizInfo,
          userId: testUser.id,
        },
      });

      // タグを関連付け
      for (const tagName of quizTags) {
        const tag = tags.find(t => t.name === tagName);
        if (tag) {
          await prisma.quizTag.create({
            data: {
              quizId: quiz.id,
              tagId: tag.id,
            },
          });
        }
      }

      // 問題を作成（各クイズに3-5問）
      const questionCount = Math.floor(Math.random() * 3) + 3;
      const sampleQuestions = getSampleQuestions(quiz.title, questionCount);

      for (let i = 0; i < sampleQuestions.length; i++) {
        const questionData = sampleQuestions[i];
        const question = await prisma.question.create({
          data: {
            quizId: quiz.id,
            type: questionData.type,
            text: questionData.text,
            points: questionData.points,
            hint: questionData.hint,
            explanation: questionData.explanation,
            order: i + 1,
          },
        });

        // 選択肢を作成
        if (questionData.options) {
          for (let j = 0; j < questionData.options.length; j++) {
            await prisma.questionOption.create({
              data: {
                questionId: question.id,
                text: questionData.options[j].text,
                isCorrect: questionData.options[j].isCorrect,
                order: j + 1,
              },
            });
          }
        }
      }

      // ダミーの回答データを作成（公開されたクイズのみ）
      if (quiz.status === QuizStatus.PUBLISHED) {
        const responseCount = Math.floor(Math.random() * 50) + 10;
        for (let i = 0; i < responseCount; i++) {
          const score = Math.floor(Math.random() * 100);
          await prisma.quizResponse.create({
            data: {
              quizId: quiz.id,
              score: score,
              totalPoints: questionCount * 10,
              isPassed: score >= 70,
              completedAt: new Date(
                Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
              ),
            },
          });
        }
        console.log(
          `✅ クイズ作成: ${quiz.title} (問題数: ${sampleQuestions.length}, 回答数: ${responseCount})`
        );
      } else {
        console.log(
          `✅ クイズ作成: ${quiz.title} (問題数: ${sampleQuestions.length})`
        );
      }
    }

    console.log('✨ テストデータのシード完了！');
  } catch (error) {
    console.error('❌ テストデータのシードでエラー:', error);
    throw error;
  }
}

/**
 * クイズタイトルに応じたサンプル問題を生成
 */
function getSampleQuestions(quizTitle: string, count: number) {
  const questionTemplates = {
    基本的な数学問題: [
      {
        type: QuestionType.MULTIPLE_CHOICE,
        text: '12 + 8 = ?',
        points: 10,
        hint: '10の位に注意しましょう',
        explanation: '12 + 8 = 20です。',
        options: [
          { text: '18', isCorrect: false },
          { text: '19', isCorrect: false },
          { text: '20', isCorrect: true },
          { text: '21', isCorrect: false },
        ],
      },
      {
        type: QuestionType.MULTIPLE_CHOICE,
        text: '15 × 4 = ?',
        points: 10,
        hint: '15を10と5に分けて考えてみましょう',
        explanation: '15 × 4 = 60です。',
        options: [
          { text: '55', isCorrect: false },
          { text: '60', isCorrect: true },
          { text: '65', isCorrect: false },
          { text: '70', isCorrect: false },
        ],
      },
      {
        type: QuestionType.TRUE_FALSE,
        text: '100 ÷ 4 = 25',
        points: 10,
        hint: '実際に計算してみましょう',
        explanation: '100 ÷ 4 = 25なので、正しいです。',
        options: [
          { text: '正しい', isCorrect: true },
          { text: '誤り', isCorrect: false },
        ],
      },
    ],
    英語基礎単語テスト: [
      {
        type: QuestionType.MULTIPLE_CHOICE,
        text: '「犬」を英語で何と言いますか？',
        points: 10,
        hint: '「d」で始まる単語です',
        explanation: '犬は英語で「dog」です。',
        options: [
          { text: 'cat', isCorrect: false },
          { text: 'dog', isCorrect: true },
          { text: 'bird', isCorrect: false },
          { text: 'fish', isCorrect: false },
        ],
      },
      {
        type: QuestionType.MULTIPLE_CHOICE,
        text: '「apple」の意味は何ですか？',
        points: 10,
        hint: '赤い果物です',
        explanation: 'appleは「りんご」という意味です。',
        options: [
          { text: 'みかん', isCorrect: false },
          { text: 'ぶどう', isCorrect: false },
          { text: 'りんご', isCorrect: true },
          { text: 'バナナ', isCorrect: false },
        ],
      },
    ],
  };

  // デフォルトの問題テンプレート
  const defaultQuestions = Array.from({ length: count }, (_, i) => ({
    type: QuestionType.MULTIPLE_CHOICE,
    text: `${quizTitle} - 問題${i + 1}`,
    points: 10,
    hint: `問題${i + 1}のヒントです`,
    explanation: `問題${i + 1}の解説です`,
    options: [
      { text: '選択肢A', isCorrect: i === 0 },
      { text: '選択肢B', isCorrect: i === 1 },
      { text: '選択肢C', isCorrect: i === 2 },
      { text: '選択肢D', isCorrect: i !== 0 && i !== 1 && i !== 2 },
    ],
  }));

  // タイトルに応じた問題があればそれを使用、なければデフォルト
  const templates = Object.entries(questionTemplates).find(([key]) =>
    quizTitle.includes(key)
  );

  if (templates && templates[1]) {
    // テンプレートから必要な数だけ取得（足りない場合はデフォルトで補完）
    const selectedQuestions = [...templates[1]];
    while (selectedQuestions.length < count) {
      selectedQuestions.push(defaultQuestions[selectedQuestions.length]);
    }
    return selectedQuestions.slice(0, count);
  }

  return defaultQuestions;
}
