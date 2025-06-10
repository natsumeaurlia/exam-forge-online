import { getQuizzes } from '@/lib/actions/quiz'
import { SearchAndFilterBar } from './SearchAndFilterBar'
import { QuizGrid } from './QuizGrid'
import { PaginationControls } from './PaginationControls'

interface QuizListContentProps {
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

export async function QuizListContent({ searchParams }: QuizListContentProps) {
  const page = parseInt(searchParams.page || '1')
  const limit = parseInt(searchParams.limit || '12')
  const search = searchParams.search
  const status = searchParams.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | undefined
  const sortBy = searchParams.sortBy as 'title' | 'createdAt' | 'updatedAt' | 'responseCount' | undefined
  const sortOrder = searchParams.sortOrder as 'asc' | 'desc' | undefined
  const tags = searchParams.tags ? searchParams.tags.split(',') : undefined

  const result = await getQuizzes({
    page,
    limit,
    search,
    status,
    sortBy: sortBy || 'createdAt',
    sortOrder: sortOrder || 'desc',
    tags,
  })

  if (!result?.data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">クイズの取得に失敗しました</p>
      </div>
    )
  }

  const { quizzes, pagination } = result.data

  return (
    <div className="space-y-6">
      <SearchAndFilterBar />
      
      {quizzes.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">クイズがありません</h3>
            <p className="text-gray-500 mb-4">
              {search || status || tags ? 
                '検索条件に一致するクイズが見つかりませんでした。' : 
                'まだクイズが作成されていません。最初のクイズを作成してみましょう。'
              }
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {pagination.total}件中 {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)}件を表示
            </p>
          </div>
          
          <QuizGrid quizzes={quizzes} />
          
          <PaginationControls pagination={pagination} />
        </>
      )}
    </div>
  )
}