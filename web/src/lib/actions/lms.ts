'use server';

import { z } from 'zod';
import { createSafeAction } from 'next-safe-action';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { 
  LMSSite, 
  LMSCourse, 
  LMSLesson, 
  LMSUser, 
  CourseEnrollment,
  LessonProgress,
  LMSPage
} from '@prisma/client';

// ===========================================
// LMS Site Management
// ===========================================

const createSiteSchema = z.object({
  teamId: z.string().min(1),
  name: z.string().min(1, 'サイト名は必須です'),
  slug: z.string().min(1, 'スラッグは必須です').regex(/^[a-z0-9-]+$/, 'スラッグは小文字、数字、ハイフンのみ使用可能です'),
  description: z.string().optional(),
  subdomain: z.string().optional(),
});

export const createLMSSite = createSafeAction(createSiteSchema, async ({ teamId, name, slug, description, subdomain }) => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('認証が必要です');
  }

  // Check if user has permission to create sites for this team
  const teamMember = await prisma.teamMember.findFirst({
    where: {
      teamId,
      userId: session.user.id,
      role: { in: ['OWNER', 'ADMIN'] },
    },
  });

  if (!teamMember) {
    throw new Error('サイト作成権限がありません');
  }

  // Check if slug is unique within the team
  const existingSite = await prisma.lMSSite.findFirst({
    where: {
      teamId,
      slug,
    },
  });

  if (existingSite) {
    throw new Error('このスラッグは既に使用されています');
  }

  // Check subdomain uniqueness if provided
  if (subdomain) {
    const existingSubdomain = await prisma.lMSSite.findFirst({
      where: {
        subdomain,
      },
    });

    if (existingSubdomain) {
      throw new Error('このサブドメインは既に使用されています');
    }
  }

  const site = await prisma.lMSSite.create({
    data: {
      teamId,
      name,
      slug,
      description,
      subdomain,
      themeConfig: {
        primaryColor: '#3b82f6',
        secondaryColor: '#1d4ed8',
        logoUrl: null,
        customCss: '',
      },
      settings: {
        allowRegistration: true,
        requireApproval: false,
        enableCertificates: true,
        timezone: 'Asia/Tokyo',
      },
    },
  });

  revalidatePath(`/dashboard/lms`);
  return { site };
});

// ===========================================
// Course Management
// ===========================================

const createCourseSchema = z.object({
  siteId: z.string().min(1),
  title: z.string().min(1, 'コースタイトルは必須です'),
  description: z.string().optional(),
  slug: z.string().min(1, 'スラッグは必須です').regex(/^[a-z0-9-]+$/, 'スラッグは小文字、数字、ハイフンのみ使用可能です'),
  price: z.number().min(0, '価格は0以上である必要があります').default(0),
  currency: z.string().default('JPY'),
  estimatedDuration: z.number().optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export const createCourse = createSafeAction(createCourseSchema, async (data) => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('認証が必要です');
  }

  // Verify site access
  const site = await prisma.lMSSite.findFirst({
    where: {
      id: data.siteId,
      team: {
        members: {
          some: {
            userId: session.user.id,
            role: { in: ['OWNER', 'ADMIN'] },
          },
        },
      },
    },
  });

  if (!site) {
    throw new Error('サイトへのアクセス権限がありません');
  }

  // Check slug uniqueness within site
  const existingCourse = await prisma.lMSCourse.findFirst({
    where: {
      siteId: data.siteId,
      slug: data.slug,
    },
  });

  if (existingCourse) {
    throw new Error('このスラッグは既に使用されています');
  }

  const course = await prisma.lMSCourse.create({
    data: {
      ...data,
      content: {
        objectives: [],
        prerequisites: [],
        targetAudience: '',
      },
    },
  });

  revalidatePath(`/lms/${site.slug}/admin/courses`);
  return { course };
});

// ===========================================
// Lesson Management
// ===========================================

const createLessonSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(1, 'レッスンタイトルは必須です'),
  description: z.string().optional(),
  content: z.object({}).optional(),
  videoUrl: z.string().url().optional().or(z.literal('')),
  duration: z.number().optional(),
  order: z.number().default(0),
  isPreview: z.boolean().default(false),
});

export const createLesson = createSafeAction(createLessonSchema, async (data) => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('認証が必要です');
  }

  // Verify course access
  const course = await prisma.lMSCourse.findFirst({
    where: {
      id: data.courseId,
      site: {
        team: {
          members: {
            some: {
              userId: session.user.id,
              role: { in: ['OWNER', 'ADMIN'] },
            },
          },
        },
      },
    },
    include: {
      site: true,
    },
  });

  if (!course) {
    throw new Error('コースへのアクセス権限がありません');
  }

  // Get next order if not specified
  let order = data.order;
  if (order === 0) {
    const lastLesson = await prisma.lMSLesson.findFirst({
      where: { courseId: data.courseId },
      orderBy: { order: 'desc' },
    });
    order = (lastLesson?.order || 0) + 1;
  }

  const lesson = await prisma.lMSLesson.create({
    data: {
      ...data,
      order,
      content: data.content || {
        blocks: [],
        version: '1.0',
      },
    },
  });

  revalidatePath(`/lms/${course.site.slug}/admin/courses/${course.slug}`);
  return { lesson };
});

// ===========================================
// User Enrollment
// ===========================================

const enrollUserSchema = z.object({
  courseId: z.string().min(1),
  email: z.string().email('有効なメールアドレスを入力してください'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export const enrollUser = createSafeAction(enrollUserSchema, async ({ courseId, email, firstName, lastName }) => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('認証が必要です');
  }

  // Get course and site info
  const course = await prisma.lMSCourse.findFirst({
    where: {
      id: courseId,
    },
    include: {
      site: true,
    },
  });

  if (!course) {
    throw new Error('コースが見つかりません');
  }

  // Create or get LMS user
  let lmsUser = await prisma.lMSUser.findFirst({
    where: {
      siteId: course.siteId,
      email,
    },
  });

  if (!lmsUser) {
    lmsUser = await prisma.lMSUser.create({
      data: {
        siteId: course.siteId,
        email,
        firstName,
        lastName,
        role: 'STUDENT',
      },
    });
  }

  // Check if already enrolled
  const existingEnrollment = await prisma.courseEnrollment.findFirst({
    where: {
      courseId,
      lmsUserId: lmsUser.id,
    },
  });

  if (existingEnrollment) {
    throw new Error('既に登録済みです');
  }

  // Create enrollment
  const enrollment = await prisma.courseEnrollment.create({
    data: {
      courseId,
      lmsUserId: lmsUser.id,
      status: 'ENROLLED',
    },
  });

  revalidatePath(`/lms/${course.site.slug}/admin/courses/${course.slug}/students`);
  return { enrollment, lmsUser };
});

// ===========================================
// Progress Tracking
// ===========================================

const updateProgressSchema = z.object({
  enrollmentId: z.string().min(1),
  lessonId: z.string().min(1),
  progress: z.number().min(0).max(100),
  timeSpent: z.number().min(0).default(0),
});

export const updateLessonProgress = createSafeAction(updateProgressSchema, async ({ enrollmentId, lessonId, progress, timeSpent }) => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('認証が必要です');
  }

  // Verify enrollment belongs to user
  const enrollment = await prisma.courseEnrollment.findFirst({
    where: {
      id: enrollmentId,
      lmsUser: {
        OR: [
          { userId: session.user.id },
          { email: session.user.email },
        ],
      },
    },
    include: {
      course: {
        include: {
          lessons: {
            orderBy: { order: 'asc' },
          },
        },
      },
    },
  });

  if (!enrollment) {
    throw new Error('受講登録が見つかりません');
  }

  // Update or create lesson progress
  const lessonProgress = await prisma.lessonProgress.upsert({
    where: {
      enrollmentId_lessonId: {
        enrollmentId,
        lessonId,
      },
    },
    update: {
      progress,
      timeSpent,
      status: progress >= 100 ? 'COMPLETED' : progress > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
      completedAt: progress >= 100 ? new Date() : null,
    },
    create: {
      enrollmentId,
      lessonId,
      progress,
      timeSpent,
      status: progress >= 100 ? 'COMPLETED' : progress > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
      startedAt: progress > 0 ? new Date() : null,
      completedAt: progress >= 100 ? new Date() : null,
    },
  });

  // Calculate overall course progress
  const allProgress = await prisma.lessonProgress.findMany({
    where: { enrollmentId },
  });

  const totalLessons = enrollment.course.lessons.length;
  const completedLessons = allProgress.filter(p => p.status === 'COMPLETED').length;
  const overallProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  // Update enrollment progress
  await prisma.courseEnrollment.update({
    where: { id: enrollmentId },
    data: {
      progress: overallProgress,
      status: overallProgress >= 100 ? 'COMPLETED' : overallProgress > 0 ? 'IN_PROGRESS' : 'ENROLLED',
      startedAt: overallProgress > 0 && !enrollment.startedAt ? new Date() : enrollment.startedAt,
      completedAt: overallProgress >= 100 ? new Date() : null,
      lastAccessedLessonId: lessonId,
    },
  });

  return { lessonProgress, overallProgress };
});

// ===========================================
// Page Management
// ===========================================

const createPageSchema = z.object({
  siteId: z.string().min(1),
  title: z.string().min(1, 'ページタイトルは必須です'),
  slug: z.string().min(1, 'スラッグは必須です').regex(/^[a-z0-9-]+$/, 'スラッグは小文字、数字、ハイフンのみ使用可能です'),
  content: z.object({}).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  isHomepage: z.boolean().default(false),
  template: z.string().default('default'),
});

export const createPage = createSafeAction(createPageSchema, async (data) => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('認証が必要です');
  }

  // Verify site access
  const site = await prisma.lMSSite.findFirst({
    where: {
      id: data.siteId,
      team: {
        members: {
          some: {
            userId: session.user.id,
            role: { in: ['OWNER', 'ADMIN'] },
          },
        },
      },
    },
  });

  if (!site) {
    throw new Error('サイトへのアクセス権限がありません');
  }

  // Check slug uniqueness
  const existingPage = await prisma.lMSPage.findFirst({
    where: {
      siteId: data.siteId,
      slug: data.slug,
    },
  });

  if (existingPage) {
    throw new Error('このスラッグは既に使用されています');
  }

  // If setting as homepage, unset other homepages
  if (data.isHomepage) {
    await prisma.lMSPage.updateMany({
      where: {
        siteId: data.siteId,
        isHomepage: true,
      },
      data: {
        isHomepage: false,
      },
    });
  }

  const page = await prisma.lMSPage.create({
    data: {
      ...data,
      content: data.content || {
        blocks: [],
        version: '1.0',
      },
    },
  });

  revalidatePath(`/lms/${site.slug}/admin/pages`);
  return { page };
});

// ===========================================
// Data Fetching
// ===========================================

export async function getLMSSites(teamId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('認証が必要です');
  }

  return await prisma.lMSSite.findMany({
    where: {
      teamId,
      team: {
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
    },
    include: {
      _count: {
        select: {
          courses: true,
          users: true,
          pages: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function getCourses(siteId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('認証が必要です');
  }

  return await prisma.lMSCourse.findMany({
    where: {
      siteId,
      site: {
        team: {
          members: {
            some: {
              userId: session.user.id,
            },
          },
        },
      },
    },
    include: {
      instructor: true,
      category: true,
      _count: {
        select: {
          lessons: true,
          enrollments: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function getCourseWithLessons(siteId: string, courseSlug: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('認証が必要です');
  }

  return await prisma.lMSCourse.findFirst({
    where: {
      siteId,
      slug: courseSlug,
      site: {
        team: {
          members: {
            some: {
              userId: session.user.id,
            },
          },
        },
      },
    },
    include: {
      site: true,
      instructor: true,
      category: true,
      lessons: {
        orderBy: { order: 'asc' },
      },
      enrollments: {
        include: {
          lmsUser: true,
          lessonProgress: {
            include: {
              lesson: true,
            },
          },
        },
      },
    },
  });
}