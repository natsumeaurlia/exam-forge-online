import { getQuizzes } from '@/lib/actions/quiz';
import { SearchAndFilterBar } from './SearchAndFilterBar';
import { QuizGrid } from './QuizGrid';
import { PaginationControls } from './PaginationControls';

interface QuizListContentProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
    tags?: string;
  }>;
}

export async function QuizListContent({ searchParams }: QuizListContentProps) {
  try {
    // searchParamsを非同期で取得
    const resolvedSearchParams = await searchParams;

    const page = parseInt(resolvedSearchParams.page || '1');
    const limit = parseInt(resolvedSearchParams.limit || '12');
    const search = resolvedSearchParams.search;
    const status = resolvedSearchParams.status as
      | 'DRAFT'
      | 'PUBLISHED'
      | 'ARCHIVED'
      | undefined;
    const sortBy = resolvedSearchParams.sortBy as
      | 'title'
      | 'createdAt'
      | 'updatedAt'
      | 'responseCount'
      | undefined;
    const sortOrder = resolvedSearchParams.sortOrder as
      | 'asc'
      | 'desc'
      | undefined;
    const tags = resolvedSearchParams.tags
      ? resolvedSearchParams.tags.split(',')
      : undefined;

    const result = await getQuizzes({
      page,
      limit,
      search,
      status,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
      tags,
    });

    console.log('=== QuizListContent Debug ===');
    console.log('getQuizzes result:', result);
    console.log('result.data:', result?.data);
    console.log('result.serverError:', result?.serverError);
    console.log('result.validationErrors:', result?.validationErrors);

    if (!result?.data) {
      console.log('❌ No data returned from getQuizzes');
      return (
        <div className="py-12 text-center">
          <p className="text-gray-500">クイズの取得に失敗しました</p>
        </div>
      );
    }

    const { quizzes, pagination } = result.data;
    console.log('✅ Quizzes found:', quizzes.length);
    console.log('Quizzes data:', quizzes);
    console.log('Pagination:', pagination);

    return (
      <div className="space-y-6">
        <SearchAndFilterBar />

        {quizzes.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto max-w-md">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
                <svg
                  className="h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                クイズがありません
              </h3>
              <p className="mb-4 text-gray-500">
                {search || status || tags
                  ? '検索条件に一致するクイズが見つかりませんでした。'
                  : 'まだクイズが作成されていません。最初のクイズを作成してみましょう。'}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {pagination.total}件中{' '}
                {(pagination.page - 1) * pagination.limit + 1}-
                {Math.min(pagination.page * pagination.limit, pagination.total)}
                件を表示
              </p>
            </div>

            <QuizGrid quizzes={quizzes} />

            <PaginationControls pagination={pagination} />
          </>
        )}
      </div>
    );
  } catch (error) {
    console.error('QuizListContent error:', error);
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">
          パラメータの処理中にエラーが発生しました。ページを再読み込みしてください。
        </p>
      </div>
    );
  }
}
