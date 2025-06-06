'use client';

import { QuizCard } from './QuizCard';

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  subdomain: string | null;
  tags: Array<{
    tag: {
      id: string;
      name: string;
      color: string | null;
    };
  }>;
  _count: {
    questions: number;
    responses: number;
  };
}

interface QuizGridProps {
  quizzes: Quiz[];
}

export function QuizGrid({ quizzes }: QuizGridProps) {
  console.log('=== QuizGrid Debug ===');
  console.log('Received quizzes count:', quizzes.length);
  console.log(
    'Quiz titles:',
    quizzes.map(q => q.title)
  );

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {quizzes.map((quiz, index) => {
        console.log(`Rendering quiz ${index + 1}:`, quiz.title);
        return <QuizCard key={quiz.id} quiz={quiz} />;
      })}
    </div>
  );
}
