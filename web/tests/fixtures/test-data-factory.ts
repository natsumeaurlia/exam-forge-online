/**
 * Comprehensive Test Data Factory System for Issue #222
 * Provides reusable, isolated test data generation for E2E tests
 */

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

// Global test prisma instance for data operations
let testPrisma: PrismaClient;

// Initialize test database connection
export function initTestDatabase() {
  if (!testPrisma) {
    testPrisma = new PrismaClient({
      datasources: {
        db: {
          url:
            process.env.DATABASE_URL ||
            'postgresql://localhost:5432/examforge_test',
        },
      },
    });
  }
  return testPrisma;
}

// Test data interfaces
export interface TestUserOptions {
  email?: string;
  name?: string;
  password?: string;
  role?: 'USER' | 'ADMIN';
  emailVerified?: boolean;
}

export interface TestTeamOptions {
  name?: string;
  description?: string;
  plan?: 'FREE' | 'PRO' | 'PREMIUM';
  ownerId?: string;
}

export interface TestQuizOptions {
  title?: string;
  description?: string;
  teamId?: string;
  createdById?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  questionCount?: number;
  passingScore?: number;
  timeLimit?: number;
  maxAttempts?: number;
  password?: string;
  sharingMode?: 'URL' | 'PUBLIC';
}

export interface TestQuestionOptions {
  quizId?: string;
  type?:
    | 'TRUE_FALSE'
    | 'MULTIPLE_CHOICE'
    | 'CHECKBOX'
    | 'SHORT_ANSWER'
    | 'NUMERIC';
  text?: string;
  points?: number;
  optionCount?: number;
}

export interface TestResponseOptions {
  quizId?: string;
  userId?: string;
  score?: number;
  participantName?: string;
  participantEmail?: string;
  completed?: boolean;
}

// Test data factory class
export class TestDataFactory {
  private prisma: PrismaClient;
  private createdData: {
    users: string[];
    teams: string[];
    quizzes: string[];
    questions: string[];
    responses: string[];
  } = {
    users: [],
    teams: [],
    quizzes: [],
    questions: [],
    responses: [],
  };

  constructor() {
    this.prisma = initTestDatabase();
  }

  /**
   * Create a test user with team
   */
  async createUser(options: TestUserOptions = {}) {
    const userData = {
      email: options.email || `test-user-${Date.now()}@example.com`,
      name: options.name || `Test User ${Date.now()}`,
      password: await hash(options.password || 'password123', 12),
      role: options.role || 'USER',
      emailVerified: options.emailVerified ? new Date() : null,
    };

    const user = await this.prisma.user.create({
      data: userData,
    });

    this.createdData.users.push(user.id);

    // Create default team for user
    const team = await this.createTeam({
      name: `${userData.name}'s Team`,
      ownerId: user.id,
    });

    return { user, team };
  }

  /**
   * Create a test team
   */
  async createTeam(options: TestTeamOptions = {}) {
    const teamData = {
      name: options.name || `Test Team ${Date.now()}`,
      description: options.description || 'A test team for E2E testing',
      plan: options.plan || 'FREE',
      slug: `test-team-${Date.now()}`,
      creator: {
        connect: { id: options.ownerId || 'default-user-id' },
      },
    };

    const team = await this.prisma.team.create({
      data: teamData,
    });

    this.createdData.teams.push(team.id);

    // Add owner to team if specified
    if (options.ownerId) {
      await this.prisma.teamMember.create({
        data: {
          teamId: team.id,
          userId: options.ownerId,
          role: 'OWNER',
        },
      });
    }

    return team;
  }

  /**
   * Create a test quiz with questions
   */
  async createQuiz(options: TestQuizOptions = {}): Promise<any> {
    const teamId = options.teamId || (await this.createTeam()).id;
    const quizData = {
      title: options.title || `Test Quiz ${Date.now()}`,
      description: options.description || 'A test quiz for E2E testing',
      teamId: teamId,
      createdById: options.createdById || 'default-user-id',
      status: options.status || 'PUBLISHED',
      passingScore: options.passingScore || null,
      timeLimit: options.timeLimit || null,
      maxAttempts: options.maxAttempts || null,
      password: options.password || null,
      sharingMode: options.sharingMode || 'URL',
      subdomain: `test-quiz-${Date.now()}`,
    };

    const quiz = await this.prisma.quiz.create({
      data: quizData,
    });

    this.createdData.quizzes.push(quiz.id);

    // Create questions if requested
    const questionCount = options.questionCount || 3;
    const questions = [];

    for (let i = 0; i < questionCount; i++) {
      const question = await this.createQuestion({
        quizId: quiz.id,
        type: this.getRandomQuestionType(),
        text: `Test Question ${i + 1}`,
        points: 10,
      });
      questions.push(question);
    }

    return { quiz, questions };
  }

  /**
   * Create a test question with options
   */
  async createQuestion(options: TestQuestionOptions = {}): Promise<any> {
    const questionType = options.type || 'MULTIPLE_CHOICE';
    const quizId = options.quizId || (await this.createQuiz()).quiz.id;
    const questionData: any = {
      quizId: quizId,
      type: questionType,
      text: options.text || `Test ${questionType} Question ${Date.now()}`,
      points: options.points || 10,
      order: await this.getNextQuestionOrder(quizId),
      correctAnswer: this.getCorrectAnswerForType(questionType),
    };

    const question = await this.prisma.question.create({
      data: questionData,
    });

    this.createdData.questions.push(question.id);

    // Create options for multiple choice questions
    if (['MULTIPLE_CHOICE', 'CHECKBOX'].includes(questionType)) {
      const optionCount = options.optionCount || 4;
      const options_data = [];

      for (let i = 0; i < optionCount; i++) {
        const isCorrect =
          (questionType === 'MULTIPLE_CHOICE' && i === 0) ||
          (questionType === 'CHECKBOX' && i < 2);

        options_data.push({
          questionId: question.id,
          text: `Option ${i + 1}`,
          isCorrect,
          order: i,
        });
      }

      await this.prisma.questionOption.createMany({
        data: options_data,
      });
    }

    return question;
  }

  /**
   * Create a test quiz response
   */
  async createResponse(options: TestResponseOptions = {}) {
    let quizId = options.quizId;
    let userId = options.userId;

    // Create quiz if not provided
    if (!quizId) {
      const { quiz } = await this.createQuiz();
      quizId = quiz.id;
    }

    // Create user if not provided
    if (!userId) {
      const { user } = await this.createUser();
      userId = user.id;
    }

    const now = new Date();
    const startTime = new Date(now.getTime() - 300000); // 5 minutes ago

    const responseData = {
      quizId: quizId!,
      userId,
      participantName: options.participantName || null,
      participantEmail: options.participantEmail || null,
      startedAt: startTime,
      completedAt: options.completed !== false ? now : null,
      score: options.score ?? 85,
      totalPoints: 100,
      isPassed: (options.score ?? 85) >= 70,
      timeTaken: 300, // 5 minutes
    };

    const response = await this.prisma.quizResponse.create({
      data: responseData,
    });

    this.createdData.responses.push(response.id);

    // Create question responses
    const questions = await this.prisma.question.findMany({
      where: { quizId },
      include: { options: true },
    });

    for (const question of questions) {
      const isCorrect = Math.random() > 0.3; // 70% chance of correct answer
      let answer: any;

      switch (question.type) {
        case 'TRUE_FALSE':
          answer = 'true';
          break;
        case 'MULTIPLE_CHOICE':
          answer = question.options[0]?.id || 'option1';
          break;
        case 'CHECKBOX':
          answer = question.options.slice(0, 2).map(opt => opt.id);
          break;
        case 'SHORT_ANSWER':
          answer = 'Test answer';
          break;
        case 'NUMERIC':
          answer = 42;
          break;
        default:
          answer = 'default answer';
      }

      await this.prisma.questionResponse.create({
        data: {
          quizResponseId: response.id,
          questionId: question.id,
          answer: JSON.stringify(answer),
          isCorrect,
          score: isCorrect ? question.points : 0,
        },
      });
    }

    return response;
  }

  /**
   * Create comprehensive test scenario with user, team, quiz, and responses
   */
  async createCompleteScenario(
    options: {
      userCount?: number;
      quizCount?: number;
      responseCount?: number;
    } = {}
  ) {
    const { userCount = 2, quizCount = 2, responseCount = 5 } = options;

    // Create owner and team
    const { user: owner, team } = await this.createUser({
      name: 'Team Owner',
      email: 'owner@example.com',
    });

    // Create additional team members
    const members = [];
    for (let i = 0; i < userCount - 1; i++) {
      const { user } = await this.createUser({
        name: `Team Member ${i + 1}`,
        email: `member${i + 1}@example.com`,
      });

      await this.prisma.teamMember.create({
        data: {
          teamId: team.id,
          userId: user.id,
          role: 'MEMBER',
        },
      });

      members.push(user);
    }

    // Create quizzes
    const quizzes = [];
    for (let i = 0; i < quizCount; i++) {
      const { quiz, questions } = await this.createQuiz({
        title: `Team Quiz ${i + 1}`,
        teamId: team.id,
        questionCount: 5,
        status: 'PUBLISHED',
      });
      quizzes.push({ quiz, questions });
    }

    // Create responses from various users
    const responses = [];
    for (let i = 0; i < responseCount; i++) {
      const randomUser =
        Math.random() > 0.5
          ? owner
          : members[Math.floor(Math.random() * members.length)];
      const randomQuiz = quizzes[Math.floor(Math.random() * quizzes.length)];

      const response = await this.createResponse({
        quizId: randomQuiz.quiz.id,
        userId: randomUser.id,
        score: Math.floor(Math.random() * 100),
      });
      responses.push(response);
    }

    return {
      owner,
      team,
      members,
      quizzes,
      responses,
    };
  }

  /**
   * Clean up all created test data
   */
  async cleanup() {
    // Delete in dependency order
    if (this.createdData.responses.length > 0) {
      await this.prisma.questionResponse.deleteMany({
        where: { quizResponseId: { in: this.createdData.responses } },
      });
      await this.prisma.quizResponse.deleteMany({
        where: { id: { in: this.createdData.responses } },
      });
    }

    if (this.createdData.questions.length > 0) {
      await this.prisma.questionOption.deleteMany({
        where: { questionId: { in: this.createdData.questions } },
      });
      await this.prisma.question.deleteMany({
        where: { id: { in: this.createdData.questions } },
      });
    }

    if (this.createdData.quizzes.length > 0) {
      await this.prisma.quiz.deleteMany({
        where: { id: { in: this.createdData.quizzes } },
      });
    }

    if (this.createdData.teams.length > 0) {
      await this.prisma.teamMember.deleteMany({
        where: { teamId: { in: this.createdData.teams } },
      });
      await this.prisma.team.deleteMany({
        where: { id: { in: this.createdData.teams } },
      });
    }

    if (this.createdData.users.length > 0) {
      await this.prisma.user.deleteMany({
        where: { id: { in: this.createdData.users } },
      });
    }

    // Reset tracking
    this.createdData = {
      users: [],
      teams: [],
      quizzes: [],
      questions: [],
      responses: [],
    };
  }

  /**
   * Get statistics about created test data
   */
  getStats() {
    return {
      users: this.createdData.users.length,
      teams: this.createdData.teams.length,
      quizzes: this.createdData.quizzes.length,
      questions: this.createdData.questions.length,
      responses: this.createdData.responses.length,
    };
  }

  // Helper methods
  private getRandomQuestionType():
    | 'TRUE_FALSE'
    | 'MULTIPLE_CHOICE'
    | 'CHECKBOX'
    | 'SHORT_ANSWER'
    | 'NUMERIC' {
    const types = [
      'TRUE_FALSE',
      'MULTIPLE_CHOICE',
      'CHECKBOX',
      'SHORT_ANSWER',
      'NUMERIC',
    ] as const;
    return types[Math.floor(Math.random() * types.length)];
  }

  private getCorrectAnswerForType(type: string): any {
    switch (type) {
      case 'TRUE_FALSE':
        return 'true';
      case 'MULTIPLE_CHOICE':
        return 'option1'; // Will be replaced with actual option ID
      case 'CHECKBOX':
        return ['option1', 'option2'];
      case 'SHORT_ANSWER':
        return 'Correct answer';
      case 'NUMERIC':
        return 42;
      default:
        return 'default';
    }
  }

  private async getNextQuestionOrder(quizId: string): Promise<number> {
    const lastQuestion = await this.prisma.question.findFirst({
      where: { quizId },
      orderBy: { order: 'desc' },
    });
    return (lastQuestion?.order || 0) + 1;
  }
}

// Global factory instance for reuse
let globalFactory: TestDataFactory;

/**
 * Get or create global test data factory
 */
export function getTestDataFactory(): TestDataFactory {
  if (!globalFactory) {
    globalFactory = new TestDataFactory();
  }
  return globalFactory;
}

/**
 * Clean up global test data factory
 */
export async function cleanupTestData() {
  if (globalFactory) {
    await globalFactory.cleanup();
  }
}

/**
 * Reset test database to clean state
 */
export async function resetTestDatabase() {
  const prisma = initTestDatabase();

  // Delete all test data in dependency order
  await prisma.questionResponse.deleteMany();
  await prisma.quizResponse.deleteMany();
  await prisma.questionOption.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany({
    where: {
      email: {
        contains: 'test',
      },
    },
  });
}
