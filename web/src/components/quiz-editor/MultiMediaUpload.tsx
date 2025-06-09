'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Upload,
  X,
  Image as ImageIcon,
  Video,
  Loader2,
  AlertCircle,
  HardDrive,
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { formatFileSize } from '@/lib/utils/format';

// Dynamically import ReactPlayer to avoid SSR issues
const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

interface MediaItem {
  id: string;
  url: string;
  type: 'IMAGE' | 'VIDEO';
  fileName: string;
  fileSize: number;
  mimeType: string;
  order: number;
}

interface MultiMediaUploadProps {
  questionId: string;
  media: MediaItem[];
  onChange: (media: MediaItem[]) => void;
  storageUsed?: number;
  storageMax?: number;
}

export function MultiMediaUpload({
  questionId,
  media,
  onChange,
  storageUsed = 0,
  storageMax = 10 * 1024 * 1024 * 1024, // 10GB
}: MultiMediaUploadProps) {
  const t = useTranslations('quizManagement.editor.multiMediaUpload');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const storagePercentage = (storageUsed / storageMax) * 100;
  const remainingStorage = storageMax - storageUsed;

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleFiles(e.target.files);
    }
  };

  const handleFiles = async (fileList: FileList) => {
    const files = Array.from(fileList);

    // Check total size
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > remainingStorage) {
      toast.error(
        t('storageExceeded', {
          remaining: formatFileSize(remainingStorage),
        })
      );
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      formData.append('questionId', questionId);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      onChange([...media, ...result.media]);
      toast.success(t('uploadSuccess', { count: files.length }));
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : t('uploadError'));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (mediaId: string) => {
    try {
      const response = await fetch(`/api/upload?id=${mediaId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      onChange(media.filter(m => m.id !== mediaId));
      toast.success(t('deleteSuccess'));
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(t('deleteError'));
    } finally {
      setDeleteId(null);
    }
  };

  const reorderMedia = (fromIndex: number, toIndex: number) => {
    const newMedia = [...media];
    const [movedItem] = newMedia.splice(fromIndex, 1);
    newMedia.splice(toIndex, 0, movedItem);

    // Update order values
    const reorderedMedia = newMedia.map((item, index) => ({
      ...item,
      order: index,
    }));

    onChange(reorderedMedia);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>{t('title')}</Label>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <HardDrive className="h-4 w-4" />
          <span>
            {formatFileSize(storageUsed)} / {formatFileSize(storageMax)}
          </span>
        </div>
      </div>

      {/* Storage indicator */}
      <div className="space-y-1">
        <Progress value={storagePercentage} className="h-2" />
        <p className="text-xs text-gray-500">
          {t('storageRemaining', {
            remaining: formatFileSize(remainingStorage),
          })}
        </p>
      </div>

      {/* Upload area */}
      <div
        className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 hover:border-gray-400'
        } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
          id="media-upload"
          disabled={isUploading}
        />
        <label
          htmlFor="media-upload"
          className="flex cursor-pointer flex-col items-center"
        >
          {isUploading ? (
            <>
              <Loader2 className="mb-2 h-8 w-8 animate-spin text-gray-400" />
              <span className="text-sm text-gray-600">{t('uploading')}</span>
              {uploadProgress > 0 && (
                <Progress value={uploadProgress} className="mt-2 w-48" />
              )}
            </>
          ) : (
            <>
              <Upload className="mb-2 h-8 w-8 text-gray-400" />
              <span className="text-sm text-gray-600">{t('clickOrDrag')}</span>
              <span className="mt-1 text-xs text-gray-500">
                {t('supportedFormats')}
              </span>
              <span className="text-xs text-gray-500">{t('sizeLimit')}</span>
            </>
          )}
        </label>
      </div>

      {/* Media list */}
      {media.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {media
                  .sort((a, b) => a.order - b.order)
                  .map((item, index) => (
                    <div
                      key={item.id}
                      className="group flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50"
                    >
                      {/* Thumbnail */}
                      <div className="relative h-16 w-16 flex-shrink-0">
                        {item.type === 'IMAGE' ? (
                          <Image
                            src={item.url}
                            alt={item.fileName}
                            fill
                            className="rounded object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center rounded bg-gray-100">
                            <Video className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {item.fileName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.type === 'VIDEO' ? t('video') : t('image')} •{' '}
                          {formatFileSize(item.fileSize)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        {index > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => reorderMedia(index, index - 1)}
                          >
                            ↑
                          </Button>
                        )}
                        {index < media.length - 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => reorderMedia(index, index + 1)}
                          >
                            ↓
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(item.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Media preview */}
      {media.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <Label className="mb-2 block">{t('preview')}</Label>
            <div className="grid grid-cols-2 gap-4">
              {media.map(item => (
                <div key={item.id} className="space-y-2">
                  {item.type === 'IMAGE' ? (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
                      <Image
                        src={item.url}
                        alt={item.fileName}
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
                      <ReactPlayer
                        url={item.url}
                        width="100%"
                        height="100%"
                        controls
                        light
                      />
                    </div>
                  )}
                  <p className="truncate text-xs text-gray-600">
                    {item.fileName}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
