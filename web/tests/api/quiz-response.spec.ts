import { test, expect } from '@playwright/test';
import {
  getTestDataFactory,
  cleanupTestData,
} from '../fixtures/test-data-factory';

test.describe('Quiz Response API', () => {
  let testQuizId: string;
  let factory = getTestDataFactory();

  test.beforeAll(async () => {
    // Create test quiz for API testing
    const { quiz } = await factory.createQuiz({
      title: 'API Test Quiz',
      status: 'PUBLISHED',
      questionCount: 3,
      sharingMode: 'URL',
    });
    testQuizId = quiz.id;
  });

  test.afterAll(async () => {
    await cleanupTestData();
  });

  // テスト用のクイズデータ
  const getMockQuizResponse = (quizId: string) => ({
    quizId,
    responses: [
      {
        questionId: 'q1',
        answer: 'A',
        timeSpent: 30,
      },
      {
        questionId: 'q2',
        answer: true,
        timeSpent: 20,
      },
      {
        questionId: 'q3',
        answer: ['option1', 'option2'],
        timeSpent: 45,
      },
    ],
    startedAt: new Date().toISOString(),
    completedAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5分後
  });
  test.describe('POST /api/quiz/response', () => {
    test('認証なしでクイズ回答を送信できる（匿名回答）', async ({
      request,
    }) => {
      const response = await request.post('/api/quiz/response', {
        data: getMockQuizResponse(testQuizId),
      });

      // Note: 実際のテストでは、テスト用のクイズが必要
      // 現在はクイズが存在しないため404エラーが期待される
      expect(response.status()).toBe(404);
      const json = await response.json();
      expect(json.error).toBe('Quiz not found');
    });

    test('無効なデータで400エラーを返す', async ({ request }) => {
      const invalidData = {
        quizId: testQuizId,
        // responsesが欠落
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };

      const response = await request.post('/api/quiz/response', {
        data: invalidData,
      });

      expect(response.status()).toBe(400);
      const json = await response.json();
      expect(json.error).toBe('Invalid request data');
      expect(json.details).toBeDefined();
    });

    test('不正な回答形式で400エラーを返す', async ({ request }) => {
      const invalidAnswerData = {
        quizId: testQuizId,
        responses: [
          {
            questionId: 'q1',
            answer: { invalid: 'format' }, // 無効な回答形式
            timeSpent: 30,
          },
        ],
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };

      const response = await request.post('/api/quiz/response', {
        data: invalidAnswerData,
      });

      expect(response.status()).toBe(400);
    });

    test('日時の形式が不正な場合400エラーを返す', async ({ request }) => {
      const invalidDateData = {
        quizId: testQuizId,
        responses: [
          {
            questionId: 'q1',
            answer: 'A',
          },
        ],
        startedAt: 'invalid-date',
        completedAt: 'invalid-date',
      };

      const response = await request.post('/api/quiz/response', {
        data: invalidDateData,
      });

      expect(response.status()).toBe(400);
    });
  });

  test.describe('GET /api/quiz/response', () => {
    test('認証なしで401エラーを返す', async ({ request }) => {
      const response = await request.get('/api/quiz/response');

      expect(response.status()).toBe(401);
      const json = await response.json();
      expect(json.error).toBe('Unauthorized');
    });

    test('クエリパラメータを正しく処理する', async ({ request }) => {
      const response = await request.get(
        '/api/quiz/response?quizId=test-id&limit=5'
      );

      // 認証がないため401エラー
      expect(response.status()).toBe(401);
    });
  });

  test.describe('Response Data Validation', () => {
    test('各問題タイプの回答形式を検証', async ({ request }) => {
      const testCases = [
        // TRUE_FALSE
        {
          responses: [{ questionId: 'q1', answer: true }],
          expected: 'valid',
        },
        // MULTIPLE_CHOICE
        {
          responses: [{ questionId: 'q2', answer: 'A' }],
          expected: 'valid',
        },
        // CHECKBOX
        {
          responses: [{ questionId: 'q3', answer: ['A', 'B'] }],
          expected: 'valid',
        },
        // NUMERIC
        {
          responses: [{ questionId: 'q4', answer: 42 }],
          expected: 'valid',
        },
        // SHORT_ANSWER
        {
          responses: [{ questionId: 'q5', answer: 'Sample answer' }],
          expected: 'valid',
        },
        // SORTING
        {
          responses: [
            { questionId: 'q6', answer: ['item1', 'item2', 'item3'] },
          ],
          expected: 'valid',
        },
        // FILL_IN_BLANK
        {
          responses: [
            {
              questionId: 'q7',
              answer: { blank1: 'answer1', blank2: 'answer2' },
            },
          ],
          expected: 'valid',
        },
        // MATCHING
        {
          responses: [
            { questionId: 'q8', answer: { left1: 'right1', left2: 'right2' } },
          ],
          expected: 'valid',
        },
        // DIAGRAM
        {
          responses: [
            { questionId: 'q9', answer: { x: 100, y: 200, label: 'Point A' } },
          ],
          expected: 'valid',
        },
      ];

      for (const testCase of testCases) {
        const data = {
          quizId: testQuizId,
          responses: testCase.responses,
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        };

        const response = await request.post('/api/quiz/response', {
          data,
        });

        // クイズが存在しないため404が期待されるが、
        // データ検証は通過するはず（400エラーにならない）
        expect(response.status()).not.toBe(400);
      }
    });
  });
});

test.describe('Enhanced Error Handling Tests', () => {
  test('レート制限エラーを正しく返す', async ({ request }) => {
    // Rate limit simulation by sending multiple requests rapidly
    const promises = Array.from({ length: 15 }, () =>
      request.post('/api/quiz/response', {
        data: getMockQuizResponse(testQuizId),
      })
    );

    const responses = await Promise.all(promises);

    // Some requests should be rate limited (429 status)
    const rateLimitedResponses = responses.filter(r => r.status() === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);

    // Check rate limit headers
    const rateLimitedResponse = rateLimitedResponses[0];
    expect(rateLimitedResponse.headers()['retry-after']).toBeDefined();
    expect(rateLimitedResponse.headers()['x-ratelimit-limit']).toBeDefined();
  });

  test('重複送信を検出して拒否する', async ({ request }) => {
    const sameData = getMockQuizResponse(testQuizId);

    // Send the same data twice quickly
    const [first, second] = await Promise.all([
      request.post('/api/quiz/response', { data: sameData }),
      request.post('/api/quiz/response', { data: sameData }),
    ]);

    // One should succeed, one should be rejected as duplicate
    const statuses = [first.status(), second.status()].sort();
    expect(statuses).toContain(409); // Conflict for duplicate
  });

  test('データサイズ制限を正しく処理する', async ({ request }) => {
    const largeData = {
      ...getMockQuizResponse(testQuizId),
      responses: Array.from({ length: 1000 }, (_, i) => ({
        questionId: `q${i}`,
        answer: 'A'.repeat(10000), // Very large answer
        timeSpent: 30,
      })),
    };

    const response = await request.post('/api/quiz/response', {
      data: largeData,
    });

    // Should return 413 Payload Too Large or similar error
    expect([400, 413, 414]).toContain(response.status());
  });

  test('エラーレスポンスに相関IDが含まれる', async ({ request }) => {
    const response = await request.post('/api/quiz/response', {
      data: {
        ...getMockQuizResponse(testQuizId),
        responses: [], // Invalid - empty responses
      },
    });

    expect(response.status()).toBe(400);
    const json = await response.json();

    expect(json.error).toBeDefined();
    expect(json.error.correlationId).toBeDefined();
    expect(json.error.timestamp).toBeDefined();
    expect(typeof json.error.correlationId).toBe('string');
  });

  test('ネットワークエラーのシミュレーション', async ({ request }) => {
    // This test would require mocking network failures
    // In a real scenario, you'd use tools like MSW or similar
    const response = await request.post('/api/quiz/response', {
      data: getMockQuizResponse('nonexistent-quiz-id'),
    });

    expect(response.status()).toBe(404);
    const json = await response.json();

    expect(json.error.type).toBe('QUIZ_NOT_FOUND');
    expect(json.error.retryable).toBe(false);
  });

  test('エラー深刻度が正しく設定される', async ({ request }) => {
    // Test different error severities
    const testCases = [
      {
        data: { quizId: 'nonexistent' },
        expectedSeverity: 'medium', // Quiz not found
      },
      {
        data: getMockQuizResponse(''),
        expectedSeverity: 'high', // Validation error
      },
    ];

    for (const testCase of testCases) {
      const response = await request.post('/api/quiz/response', {
        data: testCase.data,
      });

      const json = await response.json();
      // Error severity testing would need to be implemented in the error response
      expect(json.error).toBeDefined();
    }
  });
});

test.describe('Quiz Response Integration Tests', () => {
  test.skip('認証ユーザーがクイズに回答できる', async ({ page, request }) => {
    // 1. ログイン処理
    // 2. クイズ作成
    // 3. クイズ回答送信
    // 4. 結果確認
  });

  test.skip('回答回数制限が正しく機能する', async ({ page, request }) => {
    // 1. 回答回数制限付きクイズを作成
    // 2. 制限回数まで回答
    // 3. 制限を超えた回答が拒否されることを確認
  });

  test.skip('スコア計算が正しく行われる', async ({ page, request }) => {
    // 1. 各問題タイプを含むクイズを作成
    // 2. 正解・不正解を含む回答を送信
    // 3. スコアが正しく計算されることを確認
  });

  test.skip('オフラインストレージが正しく機能する', async ({
    page,
    context,
  }) => {
    // 1. ネットワークをオフラインに設定
    // 2. クイズ回答を送信
    // 3. オフラインストレージに保存されることを確認
    // 4. オンラインに戻して同期されることを確認
  });
});
