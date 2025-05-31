'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Calendar, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface WelcomeSectionProps {
  lng: string;
}

export function WelcomeSection({ lng }: WelcomeSectionProps) {
  const { data: session } = useSession();
  const t = useTranslations('dashboard');

  // 現在の日時を取得
  const now = new Date();
  const currentDate = now.toLocaleDateString(lng === 'ja' ? 'ja-JP' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
  const currentTime = now.toLocaleTimeString(lng === 'ja' ? 'ja-JP' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // モックデータ - 今日のタスク
  const todayTasks = [
    { id: 1, title: t('tasks.marketingQuizReview'), completed: false },
    { id: 2, title: t('tasks.newEmployeeTrainingReview'), completed: true },
    { id: 3, title: t('tasks.q2AssessmentPrep'), completed: false },
  ];

  const userName = session?.user?.name || t('defaultUser');

  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* ウェルカムメッセージ */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">
              {t('welcome', { name: userName })}
            </h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{currentDate}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{currentTime}</span>
              </div>
            </div>
          </div>

          {/* 今日のタスク概要 */}
          <div className="min-w-[300px] rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
            <h3 className="mb-3 font-semibold text-gray-900">
              {t('todaysTasks')}
            </h3>
            <div className="space-y-2">
              {todayTasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-center space-x-2 text-sm"
                >
                  <CheckCircle
                    className={`h-4 w-4 ${
                      task.completed ? 'text-green-500' : 'text-gray-300'
                    }`}
                  />
                  <span
                    className={
                      task.completed
                        ? 'text-gray-500 line-through'
                        : 'text-gray-700'
                    }
                  >
                    {task.title}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 border-t border-gray-100 pt-3">
              <div className="flex justify-between text-xs text-gray-500">
                <span>
                  {t('tasksCompleted')}:{' '}
                  {todayTasks.filter(t => t.completed).length}
                </span>
                <span>
                  {t('tasksRemaining')}:{' '}
                  {todayTasks.filter(t => !t.completed).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
