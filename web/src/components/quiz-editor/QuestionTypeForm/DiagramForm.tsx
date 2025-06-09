'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, X, Upload, Target, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface HotSpot {
  id: string;
  x: number;
  y: number;
  label: string;
  isCorrect: boolean;
}

interface DiagramFormProps {
  question: {
    text: string;
    imageUrl?: string;
    hotSpots?: HotSpot[];
    points: number;
    hint?: string;
    explanation?: string;
  };
  isAutoGrading: boolean;
  onChange: (updates: Partial<DiagramFormProps['question']>) => void;
}

export function DiagramForm({
  question,
  isAutoGrading,
  onChange,
}: DiagramFormProps) {
  const t = useTranslations('quizManagement.editor.questionTypes.diagram');
  const [isAddingHotSpot, setIsAddingHotSpot] = useState(false);
  const [selectedHotSpot, setSelectedHotSpot] = useState<string | null>(null);

  const hotSpots = question.hotSpots || [];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you would upload to a server
      const reader = new FileReader();
      reader.onload = event => {
        onChange({ imageUrl: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingHotSpot || !question.imageUrl) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newHotSpot: HotSpot = {
      id: Date.now().toString(),
      x,
      y,
      label: `ポイント ${hotSpots.length + 1}`,
      isCorrect: false,
    };

    onChange({ hotSpots: [...hotSpots, newHotSpot] });
    setIsAddingHotSpot(false);
    setSelectedHotSpot(newHotSpot.id);
  };

  const updateHotSpot = (id: string, updates: Partial<HotSpot>) => {
    const updatedHotSpots = hotSpots.map(hs =>
      hs.id === id ? { ...hs, ...updates } : hs
    );
    onChange({ hotSpots: updatedHotSpots });
  };

  const deleteHotSpot = (id: string) => {
    const updatedHotSpots = hotSpots.filter(hs => hs.id !== id);
    onChange({ hotSpots: updatedHotSpots });
    if (selectedHotSpot === id) {
      setSelectedHotSpot(null);
    }
  };

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>{t('instructions')}</AlertDescription>
      </Alert>

      <div>
        <Label htmlFor="question-text">{t('questionText')}</Label>
        <Textarea
          id="question-text"
          value={question.text}
          onChange={e => onChange({ text: e.target.value })}
          placeholder={t('questionPlaceholder')}
          className="mt-1"
          rows={3}
        />
      </div>

      <Card>
        <CardContent className="pt-4">
          <Label>{t('diagramImage')}</Label>

          {!question.imageUrl ? (
            <div className="mt-2">
              <label htmlFor="image-upload" className="cursor-pointer">
                <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center transition-colors hover:border-gray-400">
                  <Upload className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                  <p className="text-sm text-gray-600">{t('uploadImage')}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {t('uploadHint')}
                  </p>
                </div>
              </label>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          ) : (
            <div className="mt-2 space-y-3">
              <div className="relative overflow-hidden rounded-lg border">
                <div
                  className={`relative ${isAddingHotSpot ? 'cursor-crosshair' : ''}`}
                  onClick={handleImageClick}
                >
                  <img
                    src={question.imageUrl}
                    alt="Diagram"
                    className="h-auto w-full"
                  />

                  {/* ホットスポットの表示 */}
                  {hotSpots.map(hs => (
                    <div
                      key={hs.id}
                      className={`absolute -mt-4 -ml-4 h-8 w-8 cursor-pointer rounded-full border-2 transition-all ${
                        selectedHotSpot === hs.id
                          ? 'scale-110 border-white bg-blue-500 shadow-lg'
                          : hs.isCorrect
                            ? 'border-white bg-green-500'
                            : 'border-white bg-red-500'
                      }`}
                      style={{ left: `${hs.x}%`, top: `${hs.y}%` }}
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedHotSpot(hs.id);
                      }}
                    >
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                        {hotSpots.indexOf(hs) + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant={isAddingHotSpot ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setIsAddingHotSpot(!isAddingHotSpot)}
                >
                  <Target className="mr-1 h-4 w-4" />
                  {isAddingHotSpot ? t('clickToAdd') : t('addHotSpot')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onChange({ imageUrl: undefined, hotSpots: [] })
                  }
                >
                  {t('changeImage')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ホットスポットの設定 */}
      {hotSpots.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <Label className="mb-3">{t('hotSpotSettings')}</Label>
            <div className="space-y-2">
              {hotSpots.map((hs, index) => (
                <div
                  key={hs.id}
                  className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                    selectedHotSpot === hs.id
                      ? 'border-blue-500 bg-blue-50'
                      : ''
                  }`}
                  onClick={() => setSelectedHotSpot(hs.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-medium">
                        {index + 1}
                      </span>
                      <Input
                        value={hs.label}
                        onChange={e =>
                          updateHotSpot(hs.id, { label: e.target.value })
                        }
                        placeholder={t('labelPlaceholder')}
                        className="w-48"
                        onClick={e => e.stopPropagation()}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      {isAutoGrading && (
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            checked={hs.isCorrect}
                            onChange={e =>
                              updateHotSpot(hs.id, {
                                isCorrect: e.target.checked,
                              })
                            }
                            onClick={e => e.stopPropagation()}
                            className="cursor-pointer"
                          />
                          <span className="text-sm">{t('correctAnswer')}</span>
                        </label>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={e => {
                          e.stopPropagation();
                          deleteHotSpot(hs.id);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Label htmlFor="points">{t('points')}</Label>
          <Input
            id="points"
            type="number"
            value={question.points}
            onChange={e => onChange({ points: parseInt(e.target.value) || 0 })}
            className="mt-1 w-24"
            min={0}
          />
        </div>
      </div>

      {/* ヒントセクション */}
      <div>
        {question.hint !== undefined ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="hint">{t('hint')}</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange({ hint: undefined })}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              id="hint"
              value={question.hint || ''}
              onChange={e => onChange({ hint: e.target.value })}
              placeholder={t('hintPlaceholder')}
              rows={2}
            />
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange({ hint: '' })}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t('addHint')}
          </Button>
        )}
      </div>

      {/* 解説セクション */}
      <div>
        {question.explanation !== undefined ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="explanation">{t('explanation')}</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange({ explanation: undefined })}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              id="explanation"
              value={question.explanation || ''}
              onChange={e => onChange({ explanation: e.target.value })}
              placeholder={t('explanationPlaceholder')}
              rows={3}
            />
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange({ explanation: '' })}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t('addExplanation')}
          </Button>
        )}
      </div>
    </div>
  );
}
