'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Move,
  RotateCw,
  Copy,
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CertificateElement } from '@/types/certificate';

interface DraggableElementProps {
  element: CertificateElement;
  isSelected: boolean;
  canEdit: boolean;
  zoom: number;
  snapToGrid: (value: number) => number;
  onSelect: () => void;
  onUpdate: (updates: Partial<CertificateElement>) => void;
}

export function DraggableElement({
  element,
  isSelected,
  canEdit,
  zoom,
  snapToGrid,
  onSelect,
  onUpdate,
}: DraggableElementProps) {
  const t = useTranslations('certificates.designer.element');
  const elementRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [elementStart, setElementStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0 });

  const scale = zoom / 100;
  const { position, style = {} } = element;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!canEdit) return;

      e.preventDefault();
      e.stopPropagation();

      onSelect();

      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setElementStart({ x: position.x, y: position.y });
    },
    [canEdit, onSelect, position]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !canEdit) return;

      const deltaX = (e.clientX - dragStart.x) / scale;
      const deltaY = (e.clientY - dragStart.y) / scale;

      const newX = snapToGrid(elementStart.x + deltaX);
      const newY = snapToGrid(elementStart.y + deltaY);

      onUpdate({
        position: {
          ...position,
          x: Math.max(0, newX),
          y: Math.max(0, newY),
        },
      });
    },
    [
      isDragging,
      dragStart,
      elementStart,
      scale,
      snapToGrid,
      position,
      onUpdate,
      canEdit,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, direction: string) => {
      if (!canEdit) return;

      e.preventDefault();
      e.stopPropagation();

      setIsResizing(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setResizeStart({ width: position.width, height: position.height });
    },
    [canEdit, position]
  );

  const renderElementContent = () => {
    const { type, content = '' } = element;

    switch (type) {
      case 'text':
        return (
          <div
            className="flex h-full w-full items-center justify-center overflow-hidden"
            style={{
              fontSize: `${(style.fontSize || 16) * scale}px`,
              fontFamily: style.fontFamily || 'inherit',
              fontWeight: style.fontWeight || 'normal',
              color: style.color || '#000000',
              textAlign: style.textAlign || 'left',
              backgroundColor: style.backgroundColor || 'transparent',
              border: style.borderWidth
                ? `${style.borderWidth}px solid ${style.borderColor || '#000'}`
                : 'none',
              borderRadius: style.borderRadius
                ? `${style.borderRadius}px`
                : '0',
            }}
          >
            {content || t('placeholder.text')}
          </div>
        );

      case 'image':
        return (
          <div
            className="flex h-full w-full items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 bg-gray-100"
            style={{
              borderRadius: style.borderRadius
                ? `${style.borderRadius}px`
                : '0',
            }}
          >
            {content ? (
              <img
                src={content}
                alt=""
                className="h-full w-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="text-center text-xs text-gray-500">
                <div className="mb-1">📷</div>
                <div>{t('placeholder.image')}</div>
              </div>
            )}
          </div>
        );

      case 'qr':
        return (
          <div
            className="flex h-full w-full items-center justify-center border bg-white"
            style={{
              borderRadius: style.borderRadius
                ? `${style.borderRadius}px`
                : '0',
            }}
          >
            <div className="text-center text-xs text-gray-500">
              <div className="mb-1 text-2xl">⬜</div>
              <div>{t('placeholder.qr')}</div>
            </div>
          </div>
        );

      case 'signature':
        return (
          <div
            className="flex h-full w-full items-center justify-center border-2 border-dashed border-gray-300 bg-gray-50"
            style={{
              borderRadius: style.borderRadius
                ? `${style.borderRadius}px`
                : '0',
            }}
          >
            <div className="text-center text-xs text-gray-500">
              <div className="mb-1">✍️</div>
              <div>{t('placeholder.signature')}</div>
            </div>
          </div>
        );

      case 'logo':
        return (
          <div
            className="flex h-full w-full items-center justify-center border-2 border-dashed border-gray-300 bg-gray-50"
            style={{
              borderRadius: style.borderRadius
                ? `${style.borderRadius}px`
                : '0',
            }}
          >
            {content ? (
              <img
                src={content}
                alt="Logo"
                className="h-full w-full object-contain"
                draggable={false}
              />
            ) : (
              <div className="text-center text-xs text-gray-500">
                <div className="mb-1">🏢</div>
                <div>{t('placeholder.logo')}</div>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="flex h-full w-full items-center justify-center border-2 border-dashed border-gray-300 bg-gray-100">
            <span className="text-xs text-gray-500">{type}</span>
          </div>
        );
    }
  };

  const elementStyle = {
    left: `${position.x * scale}px`,
    top: `${position.y * scale}px`,
    width: `${position.width * scale}px`,
    height: `${position.height * scale}px`,
    cursor: canEdit ? (isDragging ? 'grabbing' : 'grab') : 'default',
  };

  return (
    <>
      <div
        ref={elementRef}
        className={`absolute select-none ${
          isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
        } ${isDragging ? 'z-50' : 'z-10'}`}
        style={elementStyle}
        onMouseDown={handleMouseDown}
        onClick={e => {
          e.stopPropagation();
          onSelect();
        }}
      >
        {renderElementContent()}

        {/* Selection Handles */}
        {isSelected && canEdit && (
          <>
            {/* Resize Handles */}
            <div
              className="absolute -top-1 -left-1 h-3 w-3 cursor-nw-resize rounded-sm border border-white bg-blue-500"
              onMouseDown={e => handleResizeStart(e, 'nw')}
            />
            <div
              className="absolute -top-1 -right-1 h-3 w-3 cursor-ne-resize rounded-sm border border-white bg-blue-500"
              onMouseDown={e => handleResizeStart(e, 'ne')}
            />
            <div
              className="absolute -bottom-1 -left-1 h-3 w-3 cursor-sw-resize rounded-sm border border-white bg-blue-500"
              onMouseDown={e => handleResizeStart(e, 'sw')}
            />
            <div
              className="absolute -right-1 -bottom-1 h-3 w-3 cursor-se-resize rounded-sm border border-white bg-blue-500"
              onMouseDown={e => handleResizeStart(e, 'se')}
            />

            {/* Move Handle */}
            <div
              className="absolute -top-8 left-1/2 flex -translate-x-1/2 cursor-move items-center gap-1 rounded bg-blue-500 px-2 py-1 text-xs text-white"
              onMouseDown={handleMouseDown}
            >
              <Move className="h-3 w-3" />
              <span>{element.type}</span>
            </div>

            {/* Action Buttons */}
            <div className="absolute -top-8 -right-1 flex gap-1">
              <Button
                size="sm"
                variant="secondary"
                className="h-6 w-6 p-0"
                onClick={e => {
                  e.stopPropagation();
                  // Handle duplicate
                }}
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-6 w-6 p-0"
                onClick={e => {
                  e.stopPropagation();
                  // Handle delete
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
