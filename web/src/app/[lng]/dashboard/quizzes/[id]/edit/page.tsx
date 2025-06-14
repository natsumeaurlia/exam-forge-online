import { notFound } from 'next/navigation';
import { getQuizForEdit } from '@/lib/actions/quiz';
import { QuizEditor } from '@/components/quiz-editor/QuizEditor';

interface QuizEditPageProps {
  params: Promise<{
    id: string;
    lng: string;
  }>;
}

export default async function QuizEditPage({ params }: QuizEditPageProps) {
  const { id, lng } = await params;

  try {
    const result = await getQuizForEdit({ quizId: id });

    if (!result || !result.data || !result.data.quiz) {
      notFound();
    }

    return <QuizEditor quiz={result.data.quiz} lng={lng} />;
  } catch (error) {
    notFound();
  }
}
