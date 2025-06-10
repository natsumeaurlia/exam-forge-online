import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getQuizWithQuestionsById } from '@/lib/actions/quiz';
import { QuizPreviewClient } from '@/components/quiz-preview/QuizPreviewClient';

interface QuizPreviewPageProps {
  params: {
    id: string;
    lng: string;
  };
}

export default async function QuizPreviewPage({
  params,
}: QuizPreviewPageProps) {
  const t = await getTranslations('quiz.preview');

  const { data: quiz, error } = await getQuizWithQuestionsById(params.id);

  if (error || !quiz) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <QuizPreviewClient quiz={quiz} lng={params.lng} />
    </div>
  );
}

export async function generateMetadata({ params }: QuizPreviewPageProps) {
  const t = await getTranslations('quiz.preview');
  const { data: quiz } = await getQuizWithQuestionsById(params.id);

  return {
    title: quiz ? `${t('title')} - ${quiz.title}` : t('title'),
  };
}
