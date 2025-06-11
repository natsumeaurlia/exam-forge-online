'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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
  GripVertical,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { MediaDisplay, type MediaItem } from './MediaDisplay';
import type { MediaType } from '@prisma/client';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface MediaUploadProps {
  value: MediaItem[];
  onChange: (media: MediaItem[]) => void;
  // Mode
  multiple?: boolean;
  maxFiles?: number;
  // Media types
  accept?: {
    'image/*'?: string[];
    'video/*'?: string[];
  };
  // Size limits
  maxSize?: number; // in bytes
  // Features
  showStorageQuota?: boolean;
  storageUsed?: number;
  storageLimit?: number;
  allowReorder?: boolean;
  // Labels
  label?: string;
  description?: string;
  // Upload handler
  onUpload: (files: File[]) => Promise<MediaItem[]>;
  // Events
  onError?: (error: Error) => void;
}

interface SortableMediaItemProps {
  media: MediaItem;
  onRemove: () => void;
  allowReorder: boolean;
}

function SortableMediaItem({
  media,
  onRemove,
  allowReorder,
}: SortableMediaItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: media.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('group relative', isDragging && 'opacity-50')}
    >
      <Card className="relative aspect-video overflow-hidden">
        <MediaDisplay media={media} className="h-full w-full" />
        {allowReorder && (
          <div
            {...attributes}
            {...listeners}
            className="absolute top-2 left-2 cursor-grab rounded bg-black/50 p-1 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <GripVertical className="h-4 w-4 text-white" />
          </div>
        )}
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={onRemove}
        >
          <X className="h-3 w-3" />
        </Button>
      </Card>
    </div>
  );
}

export function MediaUpload({
  value = [],
  onChange,
  multiple = false,
  maxFiles,
  accept = {
    'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    'video/*': ['.mp4', '.webm', '.ogg'],
  },
  maxSize = 10 * 1024 * 1024, // 10MB default
  showStorageQuota = false,
  storageUsed = 0,
  storageLimit = 0,
  allowReorder = false,
  label,
  description,
  onUpload,
  onError,
}: MediaUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const { toast } = useToast();
  const t = useTranslations('components.mediaUpload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const effectiveMaxFiles = maxFiles || (multiple ? 10 : 1);
  const canAddMore = value.length < effectiveMaxFiles;

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!canAddMore) {
        toast({
          title: t('maxFilesReached'),
          description: t('maxFilesReachedDescription', {
            max: effectiveMaxFiles,
          }),
          variant: 'destructive',
        });
        return;
      }

      const filesToUpload = acceptedFiles.slice(
        0,
        effectiveMaxFiles - value.length
      );

      try {
        setIsUploading(true);
        setUploadProgress(0);

        const newMedia = await onUpload(filesToUpload);

        if (multiple) {
          onChange([...value, ...newMedia]);
        } else {
          onChange(newMedia);
        }

        toast({
          title: t('uploadSuccess'),
          description: t('uploadSuccessDescription', {
            count: newMedia.length,
          }),
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Upload failed';
        toast({
          title: t('uploadError'),
          description: errorMessage,
          variant: 'destructive',
        });
        onError?.(error as Error);
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [
      canAddMore,
      effectiveMaxFiles,
      value,
      multiple,
      onChange,
      onUpload,
      t,
      toast,
      onError,
    ]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple,
    disabled: !canAddMore || isUploading,
  });

  const handleRemove = (id: string) => {
    onChange(value.filter(m => m.id !== id));
    setDeleteConfirmId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = value.findIndex(m => m.id === active.id);
      const newIndex = value.findIndex(m => m.id === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        onChange(arrayMove(value, oldIndex, newIndex));
      }
    }
  };

  const getMediaTypeIcon = (type: MediaType) => {
    return type === 'IMAGE' ? ImageIcon : Video;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {label && (
        <div>
          <h3 className="mb-1 text-sm font-medium">{label}</h3>
          {description && (
            <p className="text-muted-foreground text-sm">{description}</p>
          )}
        </div>
      )}

      {showStorageQuota && storageLimit > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('storageUsed')}</span>
            <span className="font-medium">
              {formatFileSize(storageUsed)} / {formatFileSize(storageLimit)}
            </span>
          </div>
          <Progress value={(storageUsed / storageLimit) * 100} />
        </div>
      )}

      {canAddMore && (
        <div
          {...getRootProps()}
          className={cn(
            'relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-all duration-200',
            isDragActive
              ? 'border-primary bg-primary/10 scale-[1.02] shadow-lg'
              : 'border-border hover:border-primary/50 hover:bg-muted/50',
            isUploading && 'cursor-not-allowed opacity-50'
          )}
        >
          <input {...getInputProps()} ref={fileInputRef} />
          {isUploading ? (
            <div className="space-y-4">
              <Loader2 className="text-muted-foreground mx-auto h-10 w-10 animate-spin" />
              <p className="text-muted-foreground text-sm">{t('uploading')}</p>
              <Progress value={uploadProgress} className="mx-auto max-w-xs" />
            </div>
          ) : (
            <>
              {isDragActive ? (
                <>
                  <div className="bg-primary/20 mx-auto mb-4 flex h-16 w-16 animate-pulse items-center justify-center rounded-full">
                    <Upload className="text-primary h-8 w-8" />
                  </div>
                  <p className="text-primary mb-2 text-sm font-medium">
                    {t('dropFiles')}
                  </p>
                </>
              ) : (
                <>
                  <Upload className="text-muted-foreground mx-auto mb-4 h-10 w-10" />
                  <p className="text-muted-foreground mb-2 text-sm">
                    {t('dragDropOrClick')}
                  </p>
                </>
              )}
              <p className="text-muted-foreground text-xs">
                {t('maxSize', { size: formatFileSize(maxSize) })}
              </p>
            </>
          )}
        </div>
      )}

      {value.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={value.map(m => m.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {value.map(media => (
                <SortableMediaItem
                  key={media.id}
                  media={media}
                  onRemove={() => setDeleteConfirmId(media.id)}
                  allowReorder={allowReorder && multiple}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={() => setDeleteConfirmId(null)}
      >
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
              onClick={() => deleteConfirmId && handleRemove(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
