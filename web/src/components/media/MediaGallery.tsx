'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Upload,
  Search,
  Grid3X3,
  List,
  Download,
  Trash2,
  MoreVertical,
  Image as ImageIcon,
  Video,
  FileText,
  Filter,
  Check,
  Edit2,
} from 'lucide-react';
import { MediaUpload } from '@/components/common/MediaUpload';
import { MediaDisplay } from '@/components/common/MediaDisplay';
import { getUserStorage, deleteUserFile } from '@/lib/actions/storage';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ImageEditor } from './ImageEditor';

interface MediaFile {
  id: string;
  url: string;
  type: 'image' | 'video';
  filename: string;
  size: number;
  uploadedAt: Date;
}

interface MediaGalleryProps {
  lng: string;
}

export function MediaGallery({ lng }: MediaGalleryProps) {
  const t = useTranslations('media');
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>(
    'all'
  );
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [storageUsage, setStorageUsage] = useState({ used: 0, total: 0 });
  const [selectMode, setSelectMode] = useState(false);
  const [editingImage, setEditingImage] = useState<MediaFile | null>(null);

  const fetchUserMedia = useCallback(async () => {
    try {
      setLoading(true);
      const storage = await getUserStorage();
      setStorageUsage({
        used: storage.storageUsed,
        total: storage.storageLimit,
      });

      // Transform storage files to MediaFile format
      const mediaFiles: MediaFile[] = storage.files.map(file => ({
        id: file.id,
        url: file.url,
        type: file.contentType.startsWith('video/') ? 'video' : 'image',
        filename: file.filename,
        size: file.size,
        uploadedAt: new Date(file.createdAt),
      }));

      setFiles(mediaFiles);
    } catch (error) {
      console.error('Failed to fetch media:', error);
      toast.error(t('errors.fetchFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchUserMedia();
  }, [fetchUserMedia]);

  const handleDelete = async (fileIds: string[]) => {
    try {
      await Promise.all(fileIds.map(id => deleteUserFile(id)));
      await fetchUserMedia();
      setSelectedFiles(new Set());
      toast.success(t('messages.deleteSuccess', { count: fileIds.length }));
    } catch (error) {
      console.error('Failed to delete files:', error);
      toast.error(t('errors.deleteFailed'));
    }
  };

  const handleDownload = (files: MediaFile[]) => {
    files.forEach(file => {
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const toggleSelectFile = (fileId: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const selectAll = () => {
    const filtered = getFilteredFiles();
    if (selectedFiles.size === filtered.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filtered.map(f => f.id)));
    }
  };

  const getFilteredFiles = () => {
    return files.filter(file => {
      const matchesSearch = file.filename
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || file.type === filterType;
      return matchesSearch && matchesType;
    });
  };

  const filteredFiles = getFilteredFiles();
  const selectedFilesArray = files.filter(f => selectedFiles.has(f.id));

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterType('all')}>
                {filterType === 'all' && <Check className="mr-2 h-4 w-4" />}
                {t('filters.all')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('image')}>
                {filterType === 'image' && <Check className="mr-2 h-4 w-4" />}
                {t('filters.images')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('video')}>
                {filterType === 'video' && <Check className="mr-2 h-4 w-4" />}
                {t('filters.videos')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          {selectMode && selectedFiles.size > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(selectedFilesArray)}
              >
                <Download className="mr-2 h-4 w-4" />
                {t('actions.download')} ({selectedFiles.size})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(Array.from(selectedFiles))}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('actions.delete')} ({selectedFiles.size})
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectMode(!selectMode);
              setSelectedFiles(new Set());
            }}
          >
            {selectMode ? t('actions.cancelSelect') : t('actions.select')}
          </Button>
          <div className="flex items-center rounded-md border">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="rounded-none rounded-l-md"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="rounded-none rounded-r-md"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                {t('actions.upload')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t('upload.title')}</DialogTitle>
                <DialogDescription>{t('upload.description')}</DialogDescription>
              </DialogHeader>
              <MediaUpload
                value={[]}
                onChange={() => {}}
                onUpload={async files => {
                  // TODO: Implement actual upload logic
                  await fetchUserMedia();
                  setShowUploadDialog(false);
                  return [];
                }}
                multiple
                maxFiles={10}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Storage Usage */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">{t('storage.title')}</h3>
            <p className="text-muted-foreground text-sm">
              {t('storage.usage', {
                used: formatFileSize(storageUsage.used),
                total: formatFileSize(storageUsage.total),
              })}
            </p>
          </div>
          <div className="w-32">
            <div className="bg-muted h-2 rounded-full">
              <div
                className="bg-primary h-full rounded-full transition-all"
                style={{
                  width: `${(storageUsage.used / storageUsage.total) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Select All */}
      {selectMode && filteredFiles.length > 0 && (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedFiles.size === filteredFiles.length}
            onCheckedChange={selectAll}
          />
          <span className="text-sm">
            {t('actions.selectAll')} ({filteredFiles.length})
          </span>
        </div>
      )}

      {/* Media Grid/List */}
      {loading ? (
        <div
          className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
              : 'space-y-2'
          )}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              key={i}
              className={viewMode === 'grid' ? 'aspect-square' : 'h-16'}
            />
          ))}
        </div>
      ) : filteredFiles.length === 0 ? (
        <Card className="flex h-64 items-center justify-center">
          <div className="text-center">
            <ImageIcon className="text-muted-foreground mx-auto h-12 w-12" />
            <h3 className="mt-4 font-medium">{t('empty.title')}</h3>
            <p className="text-muted-foreground mt-2 text-sm">
              {t('empty.description')}
            </p>
          </div>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredFiles.map(file => (
            <Card
              key={file.id}
              className={cn(
                'group relative overflow-hidden',
                selectMode && 'cursor-pointer',
                selectedFiles.has(file.id) && 'ring-primary ring-2'
              )}
              onClick={() => selectMode && toggleSelectFile(file.id)}
            >
              <div className="aspect-square">
                <MediaDisplay
                  media={[
                    {
                      id: file.id,
                      url: file.url,
                      type: file.type === 'image' ? 'IMAGE' : 'VIDEO',
                    },
                  ]}
                  mode="single"
                  className="h-full w-full object-cover"
                />
              </div>
              {selectMode && (
                <div className="absolute top-2 left-2">
                  <Checkbox
                    checked={selectedFiles.has(file.id)}
                    onClick={e => e.stopPropagation()}
                    onCheckedChange={() => toggleSelectFile(file.id)}
                  />
                </div>
              )}
              {!selectMode && (
                <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {file.type === 'image' && (
                        <DropdownMenuItem onClick={() => setEditingImage(file)}>
                          <Edit2 className="mr-2 h-4 w-4" />
                          {t('actions.edit')}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleDownload([file])}>
                        <Download className="mr-2 h-4 w-4" />
                        {t('actions.download')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete([file.id])}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t('actions.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
              <div className="p-2">
                <p className="truncate text-sm font-medium">{file.filename}</p>
                <p className="text-muted-foreground text-xs">
                  {formatFileSize(file.size)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredFiles.map(file => (
            <Card
              key={file.id}
              className={cn(
                'flex items-center gap-4 p-4',
                selectMode && 'cursor-pointer',
                selectedFiles.has(file.id) && 'ring-primary ring-2'
              )}
              onClick={() => selectMode && toggleSelectFile(file.id)}
            >
              {selectMode && (
                <Checkbox
                  checked={selectedFiles.has(file.id)}
                  onClick={e => e.stopPropagation()}
                  onCheckedChange={() => toggleSelectFile(file.id)}
                />
              )}
              <div className="h-12 w-12 flex-shrink-0">
                {file.type === 'image' ? (
                  <MediaDisplay
                    media={[{ id: file.id, url: file.url, type: 'IMAGE' }]}
                    mode="single"
                    className="h-full w-full rounded object-cover"
                  />
                ) : (
                  <div className="bg-muted flex h-full w-full items-center justify-center rounded">
                    <Video className="text-muted-foreground h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-medium">{file.filename}</p>
                <p className="text-muted-foreground text-sm">
                  {formatFileSize(file.size)} • {format(file.uploadedAt, 'PPp')}
                </p>
              </div>
              {!selectMode && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {file.type === 'image' && (
                      <DropdownMenuItem onClick={() => setEditingImage(file)}>
                        <Edit2 className="mr-2 h-4 w-4" />
                        {t('actions.edit')}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => handleDownload([file])}>
                      <Download className="mr-2 h-4 w-4" />
                      {t('actions.download')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete([file.id])}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t('actions.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Image Editor Dialog */}
      {editingImage && (
        <ImageEditor
          imageUrl={editingImage.url}
          imageName={editingImage.filename}
          open={!!editingImage}
          onOpenChange={open => !open && setEditingImage(null)}
          onSave={async (blob, url) => {
            // TODO: Implement save functionality
            toast.success(t('messages.editSuccess'));
            await fetchUserMedia();
          }}
        />
      )}
    </div>
  );
}
