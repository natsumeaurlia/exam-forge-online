import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { GuideLayout } from '@/components/help/GuideLayout';

interface QuizCreationGuideProps {
  params: Promise<{ lng: string }>;
}

export async function generateMetadata({
  params: { lng },
}: {
  params: { lng: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: lng });

  return {
    title: t('help.guides.quizCreation.title'),
    description: t('help.guides.quizCreation.description'),
  };
}

export default async function QuizCreationGuide({
  params,
}: QuizCreationGuideProps) {
  const { lng } = await params;

  return (
    <GuideLayout
      lng={lng}
      guideId="quiz-creation"
      title="help.guides.quizCreation.title"
    />
  );
}
