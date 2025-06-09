'use client';

import { useState } from 'react';
import Image from 'next/image';
import ReactPlayer from 'react-player/lazy';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils/cn';

interface MediaItem {
  id: string;
  url: string;
  type: 'IMAGE' | 'VIDEO';
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playing, setPlaying] = useState(false);

  if (!media || media.length === 0) {
    return null;
  }

  // Sort media by order
  const sortedMedia = [...media].sort((a, b) => a.order - b.order);
  const currentMedia = sortedMedia[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : sortedMedia.length - 1));
    setPlaying(false);
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev < sortedMedia.length - 1 ? prev + 1 : 0));
    setPlaying(false);
  };

  const renderMedia = (item: MediaItem, isFullscreenView = false) => {
    if (item.type === 'IMAGE') {
      return (
        <div
          className={cn(
            'relative w-full',
            isFullscreenView
              ? 'flex h-full items-center justify-center'
              : 'h-full'
          )}
        >
          <Image
            src={item.url}
            alt={item.fileName}
            fill
            className={cn(
              'object-contain',
              isFullscreenView ? '' : 'rounded-lg'
            )}
            sizes={
              isFullscreenView ? '100vw' : '(max-width: 768px) 100vw, 50vw'
            }
          />
        </div>
      );
    }

    if (item.type === 'VIDEO') {
      return (
        <div
          className={cn(
            'relative flex h-full w-full items-center justify-center bg-black',
            !isFullscreenView && 'overflow-hidden rounded-lg'
          )}
        >
          <ReactPlayer
            url={item.url}
            width="100%"
            height="100%"
            controls
            playing={playing}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            config={{
              file: {
                attributes: {
                  controlsList: 'nodownload',
                },
              },
            }}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <Card className={cn('overflow-hidden', className)}>
        <div className="relative aspect-video bg-gray-100">
          {renderMedia(currentMedia)}

          {/* Navigation controls */}
          {sortedMedia.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1/2 left-2 -translate-y-1/2 bg-white/80 hover:bg-white/90"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1/2 right-2 -translate-y-1/2 bg-white/80 hover:bg-white/90"
                onClick={handleNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Fullscreen button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-white/80 hover:bg-white/90"
            onClick={() => setIsFullscreen(true)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>

          {/* Media indicator dots */}
          {sortedMedia.length > 1 && (
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
              {sortedMedia.map((_, index) => (
                <button
                  key={index}
                  className={cn(
                    'h-2 w-2 rounded-full transition-colors',
                    index === currentIndex
                      ? 'bg-white'
                      : 'bg-white/50 hover:bg-white/75'
                  )}
                  onClick={() => {
                    setCurrentIndex(index);
                    setPlaying(false);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Fullscreen dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="h-full max-h-[95vh] w-full max-w-[95vw] p-0">
          <div className="relative h-full w-full bg-black">
            {renderMedia(currentMedia, true)}

            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20"
              onClick={() => setIsFullscreen(false)}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Navigation in fullscreen */}
            {sortedMedia.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1/2 left-4 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1/2 right-4 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>

                {/* Media indicator in fullscreen */}
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                  {sortedMedia.map((_, index) => (
                    <button
                      key={index}
                      className={cn(
                        'h-3 w-3 rounded-full transition-colors',
                        index === currentIndex
                          ? 'bg-white'
                          : 'bg-white/50 hover:bg-white/75'
                      )}
                      onClick={() => {
                        setCurrentIndex(index);
                        setPlaying(false);
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
