'use client';

import { QuizCardContainer } from './QuizCardContainer';
import type { QuizListItem } from '@/types/quiz';

interface QuizGridProps {
  quizzes: QuizListItem[];
}

export function QuizGrid({ quizzes }: QuizGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {quizzes.map(quiz => (
        <QuizCardContainer key={quiz.id} quiz={quiz} />
      ))}
    </div>
  );
}
