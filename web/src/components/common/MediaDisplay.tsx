'use client';

import Image from 'next/image';
import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
  AlertCircle,
  Loader2,
  Subtitles,
  Gauge,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import dynamic from 'next/dynamic';
import type { MediaType } from '@prisma/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';

const ReactPlayer = dynamic(() => import('react-player/lazy'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
    </div>
  ),
});

export interface MediaItem {
  id: string;
  url: string;
  type: MediaType;
  name?: string;
  alt?: string;
  subtitles?: SubtitleTrack[];
}

export interface SubtitleTrack {
  kind: 'subtitles' | 'captions';
  src: string;
  srcLang: string;
  label: string;
  default?: boolean;
}

interface MediaDisplayProps {
  media: MediaItem | MediaItem[];
  className?: string;
  // Display modes
  mode?: 'single' | 'gallery' | 'grid';
  // Features
  showControls?: boolean;
  allowFullscreen?: boolean;
  showIndicators?: boolean;
  // Sizing
  width?: number;
  height?: number;
  aspectRatio?: string;
  // Events
  onMediaClick?: (media: MediaItem, index: number) => void;
  onMediaError?: (media: MediaItem, error: Error) => void;
}

export function MediaDisplay({
  media,
  className,
  mode = 'single',
  showControls = false,
  allowFullscreen = false,
  showIndicators = false,
  width,
  height,
  aspectRatio = '16/9',
  onMediaClick,
  onMediaError,
}: MediaDisplayProps) {
  const mediaArray = Array.isArray(media) ? media : [media];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );
  const [errorStates, setErrorStates] = useState<Record<string, boolean>>({});
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const playerRef = useRef<any>(null);

  const currentMedia = mediaArray[currentIndex];
  const hasMultiple = mediaArray.length > 1;

  const handlePrevious = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : mediaArray.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev < mediaArray.length - 1 ? prev + 1 : 0));
  };

  const handleMediaError = (mediaItem: MediaItem, error?: Error) => {
    setErrorStates(prev => ({ ...prev, [mediaItem.id]: true }));
    onMediaError?.(mediaItem, error || new Error('Media failed to load'));
  };

  const handleMediaLoad = (mediaId: string) => {
    setLoadingStates(prev => ({ ...prev, [mediaId]: false }));
  };

  const renderMedia = (mediaItem: MediaItem, index: number) => {
    const isLoading = loadingStates[mediaItem.id] ?? true;
    const hasError = errorStates[mediaItem.id] ?? false;

    if (hasError) {
      return (
        <div className="bg-muted flex h-full flex-col items-center justify-center rounded-lg p-8">
          <AlertCircle className="text-muted-foreground mb-2 h-12 w-12" />
          <p className="text-muted-foreground text-center text-sm">
            Failed to load {mediaItem.type === 'IMAGE' ? 'image' : 'video'}
          </p>
        </div>
      );
    }

    if (mediaItem.type === 'IMAGE') {
      return (
        <div className="relative h-full w-full">
          {isLoading && (
            <div className="bg-muted absolute inset-0 flex items-center justify-center rounded-lg">
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            </div>
          )}
          <Image
            src={mediaItem.url}
            alt={mediaItem.alt || mediaItem.name || 'Media'}
            fill
            className={cn(
              'cursor-pointer rounded-lg object-contain',
              isLoading && 'opacity-0'
            )}
            sizes={`${width || 100}vw`}
            onLoad={() => handleMediaLoad(mediaItem.id)}
            onError={() => handleMediaError(mediaItem)}
            onClick={() => onMediaClick?.(mediaItem, index)}
          />
        </div>
      );
    }

    if (mediaItem.type === 'VIDEO') {
      return (
        <div className="relative h-full w-full">
          <ReactPlayer
            ref={playerRef}
            url={mediaItem.url}
            width="100%"
            height="100%"
            controls
            light
            playbackRate={playbackRate}
            onError={() => handleMediaError(mediaItem)}
            onReady={() => handleMediaLoad(mediaItem.id)}
            onClick={() => onMediaClick?.(mediaItem, index)}
            config={{
              file: {
                attributes: {
                  controlsList: 'nodownload',
                },
                tracks:
                  showSubtitles && mediaItem.subtitles
                    ? mediaItem.subtitles.map(track => ({
                        kind: track.kind,
                        src: track.src,
                        srcLang: track.srcLang,
                        label: track.label,
                        default: track.default,
                      }))
                    : [],
              },
            }}
          />
          {/* Video Controls Overlay */}
          <div className="absolute right-4 bottom-4 flex gap-2">
            {/* Playback Speed Control */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-1 bg-black/50 text-white hover:bg-black/70"
                >
                  <Gauge className="h-4 w-4" />
                  {playbackRate}x
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                  <DropdownMenuItem
                    key={rate}
                    onClick={() => setPlaybackRate(rate)}
                    className={playbackRate === rate ? 'bg-accent' : ''}
                  >
                    {rate}x
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Subtitles Toggle */}
            {mediaItem.subtitles && mediaItem.subtitles.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowSubtitles(!showSubtitles)}
                className={cn(
                  'gap-1 bg-black/50 text-white hover:bg-black/70',
                  showSubtitles && 'bg-primary/50 hover:bg-primary/70'
                )}
              >
                <Subtitles className="h-4 w-4" />
                {showSubtitles ? 'ON' : 'OFF'}
              </Button>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  const renderGalleryControls = () => {
    if (!showControls || !hasMultiple) return null;

    return (
      <>
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-1/2 left-2 z-10 -translate-y-1/2"
          onClick={handlePrevious}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-1/2 right-2 z-10 -translate-y-1/2"
          onClick={handleNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </>
    );
  };

  const renderIndicators = () => {
    if (!showIndicators || !hasMultiple) return null;

    return (
      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
        {mediaArray.map((_, index) => (
          <button
            key={index}
            className={cn(
              'h-2 w-2 rounded-full transition-colors',
              index === currentIndex
                ? 'bg-white'
                : 'bg-white/50 hover:bg-white/75'
            )}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    );
  };

  const renderFullscreenToggle = () => {
    if (!allowFullscreen) return null;

    return (
      <Button
        variant="secondary"
        size="icon"
        className="absolute top-2 right-2 z-10"
        onClick={() => setIsFullscreen(!isFullscreen)}
      >
        {isFullscreen ? (
          <Minimize2 className="h-4 w-4" />
        ) : (
          <Maximize2 className="h-4 w-4" />
        )}
      </Button>
    );
  };

  if (mode === 'grid') {
    return (
      <div className={cn('grid grid-cols-2 gap-4 md:grid-cols-3', className)}>
        {mediaArray.map((mediaItem, index) => (
          <Card
            key={mediaItem.id}
            className="relative overflow-hidden"
            style={{ aspectRatio }}
          >
            {renderMedia(mediaItem, index)}
          </Card>
        ))}
      </div>
    );
  }

  const galleryContent = (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg bg-black/5',
        className
      )}
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
        aspectRatio: !height ? aspectRatio : undefined,
      }}
    >
      {renderMedia(currentMedia, currentIndex)}
      {renderGalleryControls()}
      {renderIndicators()}
      {renderFullscreenToggle()}
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-white hover:bg-white/10"
          onClick={() => setIsFullscreen(false)}
        >
          <X className="h-6 w-6" />
        </Button>
        <div className="h-full max-h-[90vh] w-full max-w-6xl">
          {galleryContent}
        </div>
      </div>
    );
  }

  return galleryContent;
}
