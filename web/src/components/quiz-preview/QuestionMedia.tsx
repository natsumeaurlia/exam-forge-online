import { MediaDisplay, type MediaItem } from '@/components/common/media';
import type { QuestionMedia } from '@prisma/client';

interface QuestionMediaProps {
  media: QuestionMedia[];
}

export function QuestionMediaDisplay({ media }: QuestionMediaProps) {
  if (!media || media.length === 0) return null;

  // Convert QuestionMedia to MediaItem
  const mediaItems: MediaItem[] = media.map(item => ({
    id: item.id,
    url: item.url,
    type: item.type,
    name: item.fileName,
    alt: item.fileName,
  }));

  return (
    <div className="mb-4">
      <MediaDisplay
        media={mediaItems}
        mode={mediaItems.length > 1 ? 'grid' : 'single'}
        className="w-full"
      />
    </div>
  );
}
