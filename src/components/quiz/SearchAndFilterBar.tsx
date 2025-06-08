'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useDebounce } from '@/hooks/use-debounce';
import { useTranslations } from 'next-intl';

export function SearchAndFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('quizManagement');

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [sortBy, setSortBy] = useState(
    searchParams.get('sortBy') || 'createdAt'
  );
  const [sortOrder, setSortOrder] = useState(
    searchParams.get('sortOrder') || 'desc'
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams.get('tags')?.split(',').filter(Boolean) || []
  );

  const debouncedSearch = useDebounce(search, 300);

  // URLパラメータを更新
  useEffect(() => {
    const params = new URLSearchParams();

    if (debouncedSearch) params.set('search', debouncedSearch);
    if (status !== 'all') params.set('status', status);
    if (sortBy !== 'createdAt') params.set('sortBy', sortBy);
    if (sortOrder !== 'desc') params.set('sortOrder', sortOrder);
    if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));

    // ページをリセット
    params.delete('page');

    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : '';

    router.push(newUrl, { scroll: false });
  }, [debouncedSearch, status, sortBy, sortOrder, selectedTags, router]);

  const clearFilters = () => {
    setSearch('');
    setStatus('all');
    setSortBy('createdAt');
    setSortOrder('desc');
    setSelectedTags([]);
  };

  const hasActiveFilters =
    search ||
    status !== 'all' ||
    sortBy !== 'createdAt' ||
    sortOrder !== 'desc' ||
    selectedTags.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        {/* 検索バー */}
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <Input
            placeholder={t('search.placeholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* フィルター */}
        <div className="flex gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder={t('filters.status.placeholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.status.all')}</SelectItem>
              <SelectItem value="DRAFT">{t('filters.status.draft')}</SelectItem>
              <SelectItem value="PUBLISHED">
                {t('filters.status.published')}
              </SelectItem>
              <SelectItem value="ARCHIVED">
                {t('filters.status.archived')}
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={`${sortBy}-${sortOrder}`}
            onValueChange={value => {
              const [newSortBy, newSortOrder] = value.split('-');
              setSortBy(newSortBy);
              setSortOrder(newSortOrder);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t('filters.sort.placeholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt-desc">
                {t('filters.sort.createdDesc')}
              </SelectItem>
              <SelectItem value="createdAt-asc">
                {t('filters.sort.createdAsc')}
              </SelectItem>
              <SelectItem value="updatedAt-desc">
                {t('filters.sort.updatedDesc')}
              </SelectItem>
              <SelectItem value="updatedAt-asc">
                {t('filters.sort.updatedAsc')}
              </SelectItem>
              <SelectItem value="title-asc">
                {t('filters.sort.titleAsc')}
              </SelectItem>
              <SelectItem value="title-desc">
                {t('filters.sort.titleDesc')}
              </SelectItem>
              <SelectItem value="responseCount-desc">
                {t('filters.sort.responsesDesc')}
              </SelectItem>
              <SelectItem value="responseCount-asc">
                {t('filters.sort.responsesAsc')}
              </SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="px-3"
            >
              <X className="mr-1 h-4 w-4" />
              {t('filters.clear')}
            </Button>
          )}
        </div>
      </div>

      {/* アクティブなフィルターの表示 */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {search && (
            <Badge variant="secondary" className="gap-1">
              {t('search.label')} {search}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setSearch('')}
              />
            </Badge>
          )}
          {status !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {t('filters.status.placeholder')}:{' '}
              {status === 'DRAFT'
                ? t('filters.status.draft')
                : status === 'PUBLISHED'
                  ? t('filters.status.published')
                  : t('filters.status.archived')}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setStatus('all')}
              />
            </Badge>
          )}
          {selectedTags.map(tag => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {t('filters.tags')} {tag}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() =>
                  setSelectedTags(prev => prev.filter(t => t !== tag))
                }
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
