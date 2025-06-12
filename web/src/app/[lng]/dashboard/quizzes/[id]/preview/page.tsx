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

  const result = await getQuizWithQuestionsById({ quizId: params.id });

  if (!result || !result.data || !result.data.data) {
    notFound();
  }

  const quiz = result.data.data;

  return (
    <div className="min-h-screen bg-gray-50">
      <QuizPreviewClient quiz={quiz} lng={params.lng} />
    </div>
  );
}

export async function generateMetadata({ params }: QuizPreviewPageProps) {
  const t = await getTranslations('quiz.preview');
  const result = await getQuizWithQuestionsById({ quizId: params.id });

  return {
    title: result?.data?.data
      ? `${t('title')} - ${result.data.data.title}`
      : t('title'),
  };
}
