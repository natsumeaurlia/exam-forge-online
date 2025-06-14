'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Target,
  Info,
  Eye,
  EyeOff,
} from 'lucide-react';
import type { Question, QuestionOption } from '@prisma/client';

interface HotSpot {
  id: string;
  x: number;
  y: number;
  label: string;
  isCorrect?: boolean;
}

interface DiagramPreviewProps {
  question: Question & { options: QuestionOption[] };
  currentAnswer: any;
  onAnswerChange: (value: any) => void;
}

export function DiagramPreview({
  question,
  currentAnswer,
  onAnswerChange,
}: DiagramPreviewProps) {
  const t = useTranslations('quiz.preview');
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [zoom, setZoom] = useState(1);
  const [showHotSpots, setShowHotSpots] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Parse hot spots from question metadata or options
  const hotSpots: HotSpot[] = question.options.map((option, index) => ({
    id: option.id,
    x: parseFloat(option.text.split(',')[0] || '0'),
    y: parseFloat(option.text.split(',')[1] || '0'),
    label: `Point ${index + 1}`,
    isCorrect: option.isCorrect,
  }));

  const diagramAnswer = (currentAnswer as Record<string, string>) || {};

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleReset = () => {
    setZoom(1);
  };

  const handleHotSpotClick = (hotSpotId: string) => {
    // Focus on the corresponding input field
    const inputElement = document.getElementById(`hotspot-input-${hotSpotId}`);
    if (inputElement) {
      inputElement.focus();
    }
  };

  const handleAnswerChange = (hotSpotId: string, value: string) => {
    const newAnswer = { ...diagramAnswer };
    newAnswer[hotSpotId] = value;
    onAnswerChange(newAnswer);
  };

  // Check if we have an image URL in the question
  const hasImage = question.text && question.text.includes('http');
  const imageUrl = hasImage
    ? question.text.match(/https?:\/\/[^\s]+/)?.[0]
    : null;

  if (!imageUrl) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
          <Target className="mx-auto mb-3 h-12 w-12 text-gray-400" />
          <p className="text-sm text-gray-600">{t('diagram.noImage')}</p>
        </div>

        {/* Fallback to simple input fields */}
        <div className="space-y-3">
          {question.options.map((option, index) => (
            <div key={option.id} className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {t('label')} {index + 1}:
              </span>
              <Input
                id={`hotspot-input-${option.id}`}
                value={diagramAnswer[option.id] || ''}
                onChange={e => handleAnswerChange(option.id, e.target.value)}
                placeholder={option.text || t('enterLabel')}
                className="flex-1"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="min-w-[3rem] text-center text-sm font-medium">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoom >= 3}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {hotSpots.length} {t('diagram.hotSpots')}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHotSpots(!showHotSpots)}
          >
            {showHotSpots ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            <span className="ml-1 text-xs">
              {showHotSpots ? t('diagram.hide') : t('diagram.show')}
            </span>
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">{t('diagram.instructions')}</p>
            <p className="mt-1 text-xs">{t('diagram.clickHotSpots')}</p>
          </div>
        </div>
      </div>

      {/* Diagram Image Container */}
      <Card>
        <CardContent className="p-4">
          <div
            ref={containerRef}
            className="relative overflow-auto rounded-lg border bg-gray-50"
            style={{ maxHeight: '500px' }}
            data-testid="diagram-container"
          >
            <div
              className="relative inline-block min-w-full"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                transition: 'transform 0.2s ease-in-out',
              }}
            >
              <Image
                ref={imageRef}
                src={imageUrl}
                alt="Diagram"
                width={800}
                height={600}
                className="block h-auto w-auto max-w-none"
                onLoad={() => setImageLoaded(true)}
                style={{ objectFit: 'contain' }}
              />

              {/* Hot Spots Overlay */}
              {imageLoaded &&
                showHotSpots &&
                hotSpots.map((hotSpot, index) => (
                  <div
                    key={hotSpot.id}
                    className="group absolute cursor-pointer"
                    style={{
                      left: `${hotSpot.x}%`,
                      top: `${hotSpot.y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    onClick={() => handleHotSpotClick(hotSpot.id)}
                  >
                    {/* Hot Spot Indicator */}
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-sm font-bold text-white shadow-lg transition-all duration-200 hover:scale-110 ${diagramAnswer[hotSpot.id] ? 'bg-green-500' : 'bg-blue-500'} `}
                    >
                      {index + 1}
                    </div>

                    {/* Tooltip */}
                    <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 transform opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <div className="rounded bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white">
                        {hotSpot.label}
                        {diagramAnswer[hotSpot.id] && (
                          <div className="text-green-300">
                            {t('answered')}: {diagramAnswer[hotSpot.id]}
                          </div>
                        )}
                      </div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 transform border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Answer Input Fields */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">{t('diagram.yourAnswers')}</h4>
        {hotSpots.map((hotSpot, index) => (
          <div key={hotSpot.id} className="flex items-center gap-3">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white shadow-sm ${diagramAnswer[hotSpot.id] ? 'bg-green-500' : 'bg-gray-400'} `}
            >
              {index + 1}
            </div>
            <div className="flex-1">
              <Input
                id={`hotspot-input-${hotSpot.id}`}
                value={diagramAnswer[hotSpot.id] || ''}
                onChange={e => handleAnswerChange(hotSpot.id, e.target.value)}
                placeholder={t('diagram.enterLabel')}
                className="w-full"
              />
            </div>
            {diagramAnswer[hotSpot.id] && (
              <Badge
                variant="outline"
                className="border-green-300 text-green-600"
              >
                {t('answered')}
              </Badge>
            )}
          </div>
        ))}
      </div>

      {/* Progress Indicator */}
      <div className="text-center">
        <div className="text-sm text-gray-600">
          {Object.keys(diagramAnswer).filter(key => diagramAnswer[key]).length}{' '}
          / {hotSpots.length} {t('diagram.completed')}
        </div>
      </div>
    </div>
  );
}
