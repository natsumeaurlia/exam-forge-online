'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Grid3X3,
  Move,
  MousePointer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CertificateDesign, CertificateElement } from '@/types/certificate';
import { DraggableElement } from './DraggableElement';

interface DesignCanvasProps {
  design: CertificateDesign;
  selectedElement: string | null;
  onElementSelect: (elementId: string | null) => void;
  onElementUpdate: (
    elementId: string,
    updates: Partial<CertificateElement>
  ) => void;
  onElementAdd: (element: Omit<CertificateElement, 'id'>) => void;
  canEdit: boolean;
  zoom: number;
  gridVisible: boolean;
  snapToGrid: boolean;
}

export function DesignCanvas({
  design,
  selectedElement,
  onElementSelect,
  onElementUpdate,
  onElementAdd,
  canEdit,
  zoom,
  gridVisible,
  snapToGrid,
}: DesignCanvasProps) {
  const t = useTranslations('certificates.designer.canvas');
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [currentZoom, setCurrentZoom] = useState(zoom);

  const { dimensions, background, elements } = design;
  const canvasWidth = dimensions.width;
  const canvasHeight = dimensions.height;

  const zoomLevels = [25, 50, 75, 100, 125, 150, 200, 300];

  useEffect(() => {
    setCurrentZoom(zoom);
  }, [zoom]);

  const handleZoomIn = useCallback(() => {
    const currentIndex = zoomLevels.indexOf(currentZoom);
    if (currentIndex < zoomLevels.length - 1) {
      setCurrentZoom(zoomLevels[currentIndex + 1]);
    }
  }, [currentZoom, zoomLevels]);

  const handleZoomOut = useCallback(() => {
    const currentIndex = zoomLevels.indexOf(currentZoom);
    if (currentIndex > 0) {
      setCurrentZoom(zoomLevels[currentIndex - 1]);
    }
  }, [currentZoom, zoomLevels]);

  const handleZoomFit = useCallback(() => {
    if (!canvasRef.current) return;

    const container = canvasRef.current.parentElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const padding = 100; // 50px padding on each side

    const scaleX = (containerRect.width - padding) / canvasWidth;
    const scaleY = (containerRect.height - padding) / canvasHeight;
    const scale = Math.min(scaleX, scaleY) * 100;

    const targetZoom = Math.min(100, Math.max(25, Math.round(scale)));
    setCurrentZoom(targetZoom);

    // Center the canvas
    setCanvasOffset({ x: 0, y: 0 });
  }, [canvasWidth, canvasHeight]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onElementSelect(null);
      }
    },
    [onElementSelect]
  );

  const getBackgroundStyle = () => {
    const { type, value, opacity } = background;

    switch (type) {
      case 'color':
        return {
          backgroundColor: value,
          opacity,
        };
      case 'gradient':
        return {
          background: value,
          opacity,
        };
      case 'image':
        return {
          backgroundImage: `url(${value})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity,
        };
      default:
        return {
          backgroundColor: '#ffffff',
        };
    }
  };

  const getGridPattern = () => {
    if (!gridVisible) return {};

    const gridSize = 20 * (currentZoom / 100);
    return {
      backgroundImage: `
        linear-gradient(to right, #e5e7eb 1px, transparent 1px),
        linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
      `,
      backgroundSize: `${gridSize}px ${gridSize}px`,
    };
  };

  const snapToGridValue = (value: number) => {
    if (!snapToGrid) return value;
    const gridSize = 10;
    return Math.round(value / gridSize) * gridSize;
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-gray-100">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b bg-white px-4 py-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={currentZoom <= zoomLevels[0]}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          <Badge variant="outline" className="min-w-[60px] justify-center">
            {currentZoom}%
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={currentZoom >= zoomLevels[zoomLevels.length - 1]}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="sm" onClick={handleZoomFit}>
            <RotateCcw className="mr-2 h-4 w-4" />
            {t('tools.fitToScreen')}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Separator orientation="vertical" className="h-6" />

          <Button
            variant={gridVisible ? 'default' : 'outline'}
            size="sm"
            onClick={() => {}} // Grid toggle would be handled by parent
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>

          <div className="text-muted-foreground text-sm">
            {elements.length} {t('info.elements')}
          </div>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="relative flex-1 overflow-auto">
        <div
          className="absolute inset-0 flex items-center justify-center p-8"
          style={{
            transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px)`,
          }}
        >
          {/* Certificate Canvas */}
          <div
            ref={canvasRef}
            className="relative cursor-pointer border border-gray-300 bg-white shadow-lg"
            style={{
              width: `${canvasWidth * (currentZoom / 100)}px`,
              height: `${canvasHeight * (currentZoom / 100)}px`,
              transform: `scale(1)`,
              transformOrigin: 'center',
              ...getBackgroundStyle(),
              ...getGridPattern(),
            }}
            onClick={handleCanvasClick}
          >
            {/* Canvas Background */}
            <div
              className="absolute inset-0"
              style={{
                ...getBackgroundStyle(),
              }}
            />

            {/* Elements */}
            {elements.map(element => (
              <DraggableElement
                key={element.id}
                element={element}
                isSelected={selectedElement === element.id}
                canEdit={canEdit}
                zoom={currentZoom}
                snapToGrid={snapToGridValue}
                onSelect={() => onElementSelect(element.id)}
                onUpdate={updates => onElementUpdate(element.id, updates)}
              />
            ))}

            {/* Selection Indicator */}
            {!selectedElement && canEdit && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <MousePointer className="mx-auto mb-2 h-8 w-8" />
                  <p className="text-sm">{t('hints.clickToSelect')}</p>
                  <p className="text-xs">{t('hints.dragFromPanel')}</p>
                </div>
              </div>
            )}

            {/* Read-only Overlay */}
            {!canEdit && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gray-900/5">
                <div className="rounded-md bg-white/90 px-3 py-2 shadow">
                  <p className="text-sm text-gray-600">{t('hints.readOnly')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Canvas Info */}
      <div className="text-muted-foreground border-t bg-white px-4 py-2 text-xs">
        <div className="flex items-center justify-between">
          <div>
            {t('info.dimensions')}: {canvasWidth} × {canvasHeight}px
          </div>
          <div>
            {t('info.layout')}: {design.layout}
          </div>
        </div>
      </div>
    </div>
  );
}
