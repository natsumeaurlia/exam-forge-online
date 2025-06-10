'use client';

import {
  MediaDisplay,
  type MediaItem as BaseMediaItem,
} from '@/components/common/media';
import type { MediaType } from '@prisma/client';

interface MediaItem extends BaseMediaItem {
  fileName: string;
  fileSize: number;
  mimeType: string;
  order: number;
}

interface MediaViewerProps {
  media: MediaItem[];
  className?: string;
}

export function MediaViewer({ media, className }: MediaViewerProps) {
  if (!media || media.length === 0) {
    return null;
  }

  // Sort media by order
  const sortedMedia = [...media].sort((a, b) => a.order - b.order);

  return (
    <MediaDisplay
      media={sortedMedia}
      mode="gallery"
      showControls={true}
      allowFullscreen={true}
      showIndicators={true}
      className={className}
      aspectRatio="16/9"
    />
  );
}
