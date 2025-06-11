'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RotateCw, RotateCcw, Crop, Save, X, Download } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useTranslations } from 'next-intl';

interface ImageEditorProps {
  imageUrl: string;
  imageName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (editedImageBlob: Blob, editedImageUrl: string) => Promise<void>;
}

export function ImageEditor({
  imageUrl,
  imageName,
  open,
  onOpenChange,
  onSave,
}: ImageEditorProps) {
  const t = useTranslations('media.editor');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [rotation, setRotation] = useState(0);
  const [isCropping, setIsCropping] = useState(false);
  const [cropStart, setCropStart] = useState({ x: 0, y: 0 });
  const [cropEnd, setCropEnd] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load and draw image on canvas
  const drawImage = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context state
    ctx.save();

    // Move to center for rotation
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    // Calculate scaled dimensions to fit canvas
    const scale =
      Math.min(canvas.width / image.width, canvas.height / image.height) * 0.9;

    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;

    // Draw image centered
    ctx.drawImage(
      image,
      -scaledWidth / 2,
      -scaledHeight / 2,
      scaledWidth,
      scaledHeight
    );

    // Restore context state
    ctx.restore();

    // Draw crop area if cropping
    if (isCropping && isDragging) {
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      const width = cropEnd.x - cropStart.x;
      const height = cropEnd.y - cropStart.y;
      ctx.strokeRect(cropStart.x, cropStart.y, width, height);

      // Darken area outside crop
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, cropStart.y);
      ctx.fillRect(0, cropStart.y, cropStart.x, height);
      ctx.fillRect(cropEnd.x, cropStart.y, canvas.width - cropEnd.x, height);
      ctx.fillRect(0, cropEnd.y, canvas.width, canvas.height - cropEnd.y);
    }
  }, [rotation, isCropping, cropStart, cropEnd, isDragging]);

  // Handle image load
  const handleImageLoad = () => {
    const image = imageRef.current;
    const canvas = canvasRef.current;
    if (!image || !canvas) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;

    drawImage();
  };

  // Handle rotation
  const handleRotate = (degrees: number) => {
    setRotation(prev => (prev + degrees) % 360);
  };

  // Handle crop mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isCropping) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCropStart({ x, y });
    setCropEnd({ x, y });
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isCropping || !isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCropEnd({ x, y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Apply crop
  const applyCrop = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get crop dimensions
    const cropX = Math.min(cropStart.x, cropEnd.x);
    const cropY = Math.min(cropStart.y, cropEnd.y);
    const cropWidth = Math.abs(cropEnd.x - cropStart.x);
    const cropHeight = Math.abs(cropEnd.y - cropStart.y);

    // Create temporary canvas for cropped image
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cropWidth;
    tempCanvas.height = cropHeight;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Copy cropped area
    tempCtx.drawImage(
      canvas,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

    // Update main canvas
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    ctx.drawImage(tempCanvas, 0, 0);

    // Reset crop state
    setIsCropping(false);
    setCropStart({ x: 0, y: 0 });
    setCropEnd({ x: 0, y: 0 });
  };

  // Save edited image
  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      setLoading(true);
      canvas.toBlob(
        async blob => {
          if (!blob) return;

          const editedImageUrl = URL.createObjectURL(blob);
          if (onSave) {
            await onSave(blob, editedImageUrl);
          }
          onOpenChange(false);
        },
        'image/jpeg',
        0.9
      );
    } catch (error) {
      console.error('Failed to save image:', error);
    } finally {
      setLoading(false);
    }
  };

  // Download edited image
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(
      blob => {
        if (!blob) return;

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `edited-${imageName}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      },
      'image/jpeg',
      0.9
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRotate(-90)}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                {t('rotateLeft')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRotate(90)}
              >
                <RotateCw className="mr-2 h-4 w-4" />
                {t('rotateRight')}
              </Button>
              <Button
                variant={isCropping ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsCropping(!isCropping)}
              >
                <Crop className="mr-2 h-4 w-4" />
                {isCropping ? t('cropActive') : t('crop')}
              </Button>
              {isCropping && isDragging && (
                <Button variant="default" size="sm" onClick={applyCrop}>
                  {t('applyCrop')}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                {t('download')}
              </Button>
            </div>
          </div>

          {/* Canvas */}
          <div className="relative flex items-center justify-center rounded-lg bg-gray-100 p-4">
            <canvas
              ref={canvasRef}
              className={cn(
                'max-w-full cursor-crosshair border border-gray-300',
                !isCropping && 'cursor-default'
              )}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imageRef}
              src={imageUrl}
              alt={imageName}
              className="hidden"
              onLoad={handleImageLoad}
              crossOrigin="anonymous"
            />
          </div>

          {/* Rotation Slider */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">{t('rotation')}</span>
            <Slider
              value={[rotation]}
              onValueChange={([value]) => setRotation(value)}
              min={-180}
              max={180}
              step={1}
              className="flex-1"
            />
            <span className="w-12 text-right text-sm font-medium">
              {rotation}°
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" />
            {t('cancel')}
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? t('saving') : t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
