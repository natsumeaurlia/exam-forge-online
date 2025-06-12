import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { QuizTakingClient } from '@/components/quiz-taking/QuizTakingClient';

interface PublicQuizPageProps {
  params: {
    id: string;
    lng: string;
  };
}

export async function generateMetadata({ params }: PublicQuizPageProps) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: params.id },
    select: { title: true, description: true },
  });

  if (!quiz) {
    return {
      title: 'Quiz Not Found',
    };
  }

  return {
    title: quiz.title,
    description: quiz.description,
  };
}

export default async function PublicQuizPage({ params }: PublicQuizPageProps) {
  const t = await getTranslations('QuizTaking');

  // Fetch quiz with questions and check if it's public
  const quiz = await prisma.quiz.findUnique({
    where: { id: params.id },
    include: {
      questions: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
        include: {
          options: {
            orderBy: { order: 'asc' },
          },
        },
      },
      team: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!quiz || quiz.status !== 'PUBLISHED') {
    notFound();
  }

  // Check if quiz is publicly accessible
  if (quiz.sharingMode === 'NONE') {
    notFound();
  }

  return (
    <div className="bg-background min-h-screen">
      <QuizTakingClient
        quiz={quiz}
        isPublic={true}
        requiresPassword={quiz.sharingMode === 'PASSWORD'}
      />
    </div>
  );
}
