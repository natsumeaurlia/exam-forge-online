import { notFound } from 'next/navigation';
import { getQuizForEdit } from '@/lib/actions/quiz';
import { QuizEditor } from '@/components/quiz-editor/QuizEditor';

interface QuizEditPageProps {
  params: {
    id: string;
    lng: string;
  };
}

export default async function QuizEditPage({ params }: QuizEditPageProps) {
  try {
    const quiz = await getQuizForEdit(params.id);

    return <QuizEditor quiz={quiz} lng={params.lng} />;
  } catch (error) {
    notFound();
  }
}
