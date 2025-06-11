import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { QuizTakingClient } from '@/components/quiz-taking/QuizTakingClient';
import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface QuizTakingPageProps {
  params: {
    id: string;
    lng: string;
  };
}

async function getPublicQuiz(id: string) {
  const quiz = await prisma.quiz.findUnique({
    where: {
      id,
      status: 'PUBLISHED',
    },
    include: {
      questions: {
        orderBy: { order: 'asc' },
        include: {
          options: {
            orderBy: { order: 'asc' },
          },
          media: true,
        },
      },
      team: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return quiz;
}

export default async function QuizTakingPage({ params }: QuizTakingPageProps) {
  const session = await getServerSession(authOptions);
  const quiz = await getPublicQuiz(params.id);

  if (!quiz) {
    notFound();
  }

  // Check if quiz requires authentication
  if ((quiz.sharingMode as string) === 'TEAM_ONLY' && quiz.team) {
    if (!session?.user) {
      // Redirect to login if not authenticated
      redirect(
        `/${params.lng}/auth/signin?callbackUrl=/quiz/${params.id}/take`
      );
    }

    // Check if user is a team member
    const isMember = await prisma.teamMember.findFirst({
      where: {
        teamId: quiz.team.id,
        userId: session.user.id,
      },
    });

    if (!isMember) {
      // User is not authorized to take this quiz
      notFound();
    }
  }

  // Check if quiz requires password
  const requiresPassword = quiz.password !== null;

  return (
    <div className="min-h-screen bg-gray-50">
      <QuizTakingClient
        quiz={quiz as any}
        lng={params.lng}
        requiresPassword={requiresPassword}
      />
    </div>
  );
}

export async function generateMetadata({
  params,
}: QuizTakingPageProps): Promise<Metadata> {
  const quiz = await getPublicQuiz(params.id);

  if (!quiz) {
    return {
      title: 'Quiz Not Found',
    };
  }

  return {
    title: quiz.title,
    description: quiz.description || `Take the ${quiz.title} quiz`,
    openGraph: {
      title: quiz.title,
      description: quiz.description || `Take the ${quiz.title} quiz`,
      type: 'website',
    },
  };
}
