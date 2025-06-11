import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { QuizTakingClient } from '@/components/quiz-taking/QuizTakingClient';
import { Metadata } from 'next';

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
      isPublished: true,
    },
    include: {
      questions: {
        where: { isActive: true },
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
          name: true,
        },
      },
    },
  });

  return quiz;
}

export default async function QuizTakingPage({ params }: QuizTakingPageProps) {
  const quiz = await getPublicQuiz(params.id);

  if (!quiz) {
    notFound();
  }

  // Check if quiz requires password
  const requiresPassword = quiz.password !== null;

  return (
    <div className="min-h-screen bg-gray-50">
      <QuizTakingClient
        quiz={quiz}
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
