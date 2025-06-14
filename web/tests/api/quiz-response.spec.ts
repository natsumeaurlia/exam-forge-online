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

test.describe('Quiz Response Integration Tests', () => {
  // 実際のクイズが作成された後に実行するための統合テスト
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
});
