import { Suspense } from 'react'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { QuizListHeader } from '@/components/quiz/QuizListHeader'
import { QuizListContent } from '@/components/quiz/QuizListContent'
import { QuizListSkeleton } from '@/components/quiz/QuizListSkeleton'

interface QuizListPageProps {
  params: { lng: string }
  searchParams: {
    page?: string
    limit?: string
    search?: string
    status?: string
    sortBy?: string
    sortOrder?: string
    tags?: string
  }
}

export default async function QuizListPage({ params, searchParams }: QuizListPageProps) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect(`/${params.lng}/auth/signin`)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <QuizListHeader />
      <Suspense fallback={<QuizListSkeleton />}>
        <QuizListContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}