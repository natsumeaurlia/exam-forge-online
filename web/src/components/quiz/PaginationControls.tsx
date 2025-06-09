'use client';

import { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PaginationControlsProps {
  pagination: PaginationData;
}

export function PaginationControls({ pagination }: PaginationControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('ui.pagination');

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    return `?${params.toString()}`;
  };

  const goToPage = (page: number) => {
    router.push(createPageUrl(page), { scroll: false });
  };

  const { page, totalPages } = pagination;

  // ページネーションボタンの範囲を計算（メモ化）
  const pageNumbers = useMemo(() => {
    const delta = 2; // 現在のページの前後に表示するページ数
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, page - delta);
      i <= Math.min(totalPages - 1, page + delta);
      i++
    ) {
      range.push(i);
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (page + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  }, [page, totalPages]);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => goToPage(page - 1)}
        disabled={page <= 1}
        className="flex items-center"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        {t('previous')}
      </Button>

      <div className="flex items-center space-x-1">
        {pageNumbers.map((pageNumber, index) => (
          <div key={index}>
            {pageNumber === '...' ? (
              <span className="px-3 py-2 text-gray-500">...</span>
            ) : (
              <Button
                variant={pageNumber === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => goToPage(pageNumber as number)}
                className="min-w-[40px]"
              >
                {pageNumber}
              </Button>
            )}
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => goToPage(page + 1)}
        disabled={page >= totalPages}
        className="flex items-center"
      >
        {t('next')}
        <ChevronRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  );
}
