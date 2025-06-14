import { redirect } from 'next/navigation';

interface QuizPageProps {
  params: {
    id: string;
    lng: string;
  };
}

export default async function QuizPage({ params }: QuizPageProps) {
  // Redirect to the take page
  redirect(`/${params.lng}/quiz/${params.id}/take`);
}
