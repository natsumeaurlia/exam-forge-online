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
    const quiz = await getQuizForEdit(id);

    return <QuizEditor quiz={quiz} lng={lng} />;
  } catch (error) {
    notFound();
  }
}
