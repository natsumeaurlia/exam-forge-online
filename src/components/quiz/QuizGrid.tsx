'use client'

import { QuizCard } from './QuizCard'

interface Quiz {
  id: string
  title: string
  description: string | null
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  createdAt: Date
  updatedAt: Date
  publishedAt: Date | null
  subdomain: string | null
  tags: Array<{
    tag: {
      id: string
      name: string
      color: string | null
    }
  }>
  _count: {
    questions: number
    responses: number
  }
}

interface QuizGridProps {
  quizzes: Quiz[]
}

export function QuizGrid({ quizzes }: QuizGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {quizzes.map((quiz) => (
        <QuizCard key={quiz.id} quiz={quiz} />
      ))}
    </div>
  )
}