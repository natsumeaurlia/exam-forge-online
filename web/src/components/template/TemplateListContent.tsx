import { getTemplates } from '@/lib/actions/template';
import { TemplateGrid } from './TemplateGrid';
import { PaginationControls } from '@/components/quiz/PaginationControls';

interface TemplateListContentProps {
  searchParams: {
    page?: string;
    search?: string;
    category?: string;
    isPublic?: string;
    sort?: string;
    order?: string;
    tags?: string;
  };
  lng: string;
}

export async function TemplateListContent({
  searchParams,
  lng,
}: TemplateListContentProps) {
  // Parse search parameters
  const page = parseInt(searchParams.page || '1', 10);
  const search = searchParams.search;
  const category = searchParams.category;
  const isPublic =
    searchParams.isPublic === 'true'
      ? true
      : searchParams.isPublic === 'false'
        ? false
        : undefined;
  const sortBy = (searchParams.sort as any) || 'updatedAt';
  const sortOrder = (searchParams.order as 'asc' | 'desc') || 'desc';
  const tagIds = searchParams.tags ? searchParams.tags.split(',') : undefined;

  // Get templates
  const result = await getTemplates({
    page,
    limit: 12,
    search,
    category,
    isPublic,
    sortBy,
    sortOrder,
    tagIds,
  });

  if (!result?.data?.success) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">
          テンプレートの取得に失敗しました
        </p>
      </div>
    );
  }

  const { templates, pagination } = result.data as {
    templates: TemplateListItem[];
    pagination: any;
  };

  if (templates.length === 0) {
    return (
      <div className="py-12 text-center">
        <h3 className="mb-2 text-lg font-medium">
          テンプレートが見つかりません
        </h3>
        <p className="text-muted-foreground mb-4">
          最初のテンプレートを作成してみましょう
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TemplateGrid templates={templates} lng={lng} />

      {pagination.totalPages > 1 && (
        <PaginationControls pagination={pagination} />
      )}
    </div>
  );
}
