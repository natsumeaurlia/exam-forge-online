'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  GripVertical,
  RotateCcw,
  CheckCircle,
  Circle,
  ArrowRight,
  Info,
} from 'lucide-react';
import type { Question, QuestionOption } from '@prisma/client';

import { QuizAnswer } from '@/types/quiz-answers';

interface MatchingPreviewProps {
  question: Question & { options: QuestionOption[] };
  currentAnswer: QuizAnswer | undefined;
  onAnswerChange: (value: QuizAnswer) => void;
}

export function MatchingPreview({
  question,
  currentAnswer,
  onAnswerChange,
}: MatchingPreviewProps) {
  const t = useTranslations('quiz.preview');
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [connections, setConnections] = useState<Record<string, string>>(
    (currentAnswer as Record<string, string>) || {}
  );

  // Split options into left and right items
  const leftItems = question.options.filter((_, index) => index % 2 === 0);
  const rightItems = question.options.filter((_, index) => index % 2 === 1);

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.setData('text/plain', itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');

    if (sourceId && sourceId !== targetId) {
      // Create new connection
      const newConnections = { ...connections };

      // Remove any existing connection from the source
      Object.keys(newConnections).forEach(key => {
        if (newConnections[key] === sourceId) {
          delete newConnections[key];
        }
      });

      // Remove any existing connection to the target
      Object.keys(newConnections).forEach(key => {
        if (newConnections[key] === targetId) {
          delete newConnections[key];
        }
      });

      // Add new connection
      newConnections[sourceId] = targetId;

      setConnections(newConnections);
      onAnswerChange(newConnections);
    }

    setDraggedItem(null);
  };

  const handleDirectConnect = (leftId: string, rightId: string) => {
    const newConnections = { ...connections };

    // Check if this connection already exists
    if (newConnections[leftId] === rightId) {
      // Remove the connection
      delete newConnections[leftId];
    } else {
      // Remove any existing connections for both items
      Object.keys(newConnections).forEach(key => {
        if (newConnections[key] === rightId) {
          delete newConnections[key];
        }
      });

      // Add new connection
      newConnections[leftId] = rightId;
    }

    setConnections(newConnections);
    onAnswerChange(newConnections);
  };

  const handleReset = () => {
    setConnections({});
    onAnswerChange({});
  };

  const isConnected = (leftId: string, rightId: string) => {
    return connections[leftId] === rightId;
  };

  const getConnectionForLeft = (leftId: string) => {
    return connections[leftId];
  };

  const getConnectionForRight = (rightId: string) => {
    return Object.keys(connections).find(key => connections[key] === rightId);
  };

  const completedConnections = Object.keys(connections).length;
  const totalPossibleConnections = Math.min(
    leftItems.length,
    rightItems.length
  );

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">{t('matching.instructions')}</p>
            <p className="mt-1 text-xs">{t('matching.dragOrClick')}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {completedConnections} / {totalPossibleConnections}{' '}
            {t('matching.connected')}
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="mr-1 h-4 w-4" />
          {t('matching.reset')}
        </Button>
      </div>

      {/* Matching Interface */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-600">
            {t('matching.leftColumn')}
          </h4>
          {leftItems.map(item => {
            const connectedRightId = getConnectionForLeft(item.id);
            const connectedRightItem = rightItems.find(
              r => r.id === connectedRightId
            );

            return (
              <Card
                key={item.id}
                className={`cursor-move transition-all ${
                  draggedItem === item.id
                    ? 'scale-105 shadow-lg ring-2 ring-blue-500'
                    : ''
                } ${connectedRightId ? 'border-green-500 bg-green-50' : 'hover:shadow-md'}`}
                draggable
                onDragStart={e => handleDragStart(e, item.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.text}</p>
                      {connectedRightItem && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          <ArrowRight className="h-3 w-3" />
                          <span>{connectedRightItem.text}</span>
                        </div>
                      )}
                    </div>
                    {connectedRightId ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-300" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Right Column */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-600">
            {t('matching.rightColumn')}
          </h4>
          {rightItems.map(item => {
            const connectedLeftId = getConnectionForRight(item.id);
            const connectedLeftItem = leftItems.find(
              l => l.id === connectedLeftId
            );

            return (
              <Card
                key={item.id}
                className={`cursor-pointer transition-all ${
                  connectedLeftId
                    ? 'border-green-500 bg-green-50'
                    : 'border-dashed hover:shadow-md'
                } ${draggedItem && !connectedLeftId ? 'border-blue-300 bg-blue-50' : ''}`}
                onDragOver={handleDragOver}
                onDrop={e => handleDrop(e, item.id)}
                onClick={() => {
                  if (draggedItem) {
                    handleDirectConnect(draggedItem, item.id);
                    setDraggedItem(null);
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.text}</p>
                      {connectedLeftItem && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-green-600">
                          <span>{connectedLeftItem.text}</span>
                          <ArrowRight className="h-3 w-3" />
                          <CheckCircle className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                    {connectedLeftId ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-300" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Connect Interface (Alternative method) */}
      <div className="mt-8">
        <h4 className="mb-3 text-sm font-medium text-gray-600">
          {t('matching.quickConnect')}
        </h4>
        <div className="grid gap-2">
          {leftItems.map(leftItem => {
            const connectedRightId = getConnectionForLeft(leftItem.id);
            const connectedRightItem = rightItems.find(
              r => r.id === connectedRightId
            );

            return (
              <div
                key={leftItem.id}
                className="flex items-center gap-4 rounded-lg bg-gray-50 p-3"
              >
                <div className="min-w-0 flex-1 text-sm font-medium">
                  <p className="truncate">{leftItem.text}</p>
                </div>
                <ArrowRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
                <div className="min-w-0 flex-1">
                  <select
                    value={connectedRightId || ''}
                    onChange={e => {
                      if (e.target.value) {
                        handleDirectConnect(leftItem.id, e.target.value);
                      } else {
                        const newConnections = { ...connections };
                        delete newConnections[leftItem.id];
                        setConnections(newConnections);
                        onAnswerChange(newConnections);
                      }
                    }}
                    className="w-full rounded border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">{t('matching.selectMatch')}</option>
                    {rightItems.map(rightItem => (
                      <option
                        key={rightItem.id}
                        value={rightItem.id}
                        disabled={Boolean(
                          getConnectionForRight(rightItem.id) &&
                            getConnectionForRight(rightItem.id) !== leftItem.id
                        )}
                      >
                        {rightItem.text}
                        {getConnectionForRight(rightItem.id) &&
                          getConnectionForRight(rightItem.id) !== leftItem.id &&
                          ' (taken)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Summary */}
      <div className="border-t pt-4 text-center">
        <div className="text-sm text-gray-600">
          {completedConnections === totalPossibleConnections ? (
            <div className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              {t('matching.allConnected')}
            </div>
          ) : (
            <div>
              {t('matching.progress', {
                completed: completedConnections,
                total: totalPossibleConnections,
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
