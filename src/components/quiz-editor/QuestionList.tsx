'use client';

import { Card } from '@/components/ui/card';
import { useQuizEditorStore } from '@/stores/useQuizEditorStore';
import { useTranslations } from 'next-intl';

export function QuestionList() {
  const { quiz, currentQuestionIndex, setCurrentQuestion } =
    useQuizEditorStore();
  const t = useTranslations('quizManagement.editor.questions');

  if (!quiz || quiz.questions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">{t('empty')}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {quiz.questions.map((question, index) => (
        <Card
          key={question.id}
          className={`cursor-pointer p-4 transition-all ${
            currentQuestionIndex === index
              ? 'ring-2 ring-blue-500'
              : 'hover:shadow-md'
          }`}
          onClick={() => setCurrentQuestion(index)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500">
                  {t('questionNumber', { number: index + 1 })}
                </span>
                <span className="text-xs text-gray-400">
                  {question.type.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="mt-1 text-sm">
                {question.text || t('noQuestionText')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {t('points', { points: question.points })}
              </span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
