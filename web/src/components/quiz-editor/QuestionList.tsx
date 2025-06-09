'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuizEditorStore } from '@/stores/useQuizEditorStore';
import { useTranslations } from 'next-intl';
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Trash2,
  GripVertical,
} from 'lucide-react';
import { QuestionEditForm } from './QuestionEditForm';

export function QuestionList() {
  const {
    questions,
    currentQuestionIndex,
    setCurrentQuestion,
    deleteQuestion,
    duplicateQuestion,
  } = useQuizEditorStore();
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(
    new Set()
  );
  const t = useTranslations('quizManagement.editor.questions');

  if (!questions || questions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">{t('empty')}</p>
      </Card>
    );
  }

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedQuestions(newExpanded);
    setCurrentQuestion(index);
  };

  const handleDelete = (index: number) => {
    deleteQuestion(index);
    // 展開状態をリセット
    const newExpanded = new Set(expandedQuestions);
    newExpanded.delete(index);
    setExpandedQuestions(newExpanded);
  };

  const handleDuplicate = (index: number) => {
    duplicateQuestion(index);
  };

  return (
    <div className="space-y-4">
      {questions.map((question, index) => (
        <Card
          key={question.id}
          className={`transition-all ${
            currentQuestionIndex === index ? 'ring-2 ring-blue-500' : ''
          }`}
        >
          <div
            className="flex cursor-pointer items-start justify-between p-4 hover:bg-gray-50"
            onClick={() => toggleExpanded(index)}
          >
            <div className="flex flex-1 items-start gap-3">
              <GripVertical className="mt-0.5 h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500">
                    {t('questionNumber', { number: index + 1 })}
                  </span>
                  <span className="text-xs text-gray-400">
                    {question.type.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm">
                  {question.text || t('noQuestionText')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {question.points} {t('pointsLabel')}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={e => {
                    e.stopPropagation();
                    handleDuplicate(index);
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={e => {
                    e.stopPropagation();
                    handleDelete(index);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  {expandedQuestions.has(index) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {expandedQuestions.has(index) && (
            <div className="border-t px-6 py-4">
              <QuestionEditForm questionIndex={index} />
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
