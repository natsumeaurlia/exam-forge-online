'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Trophy,
  TrendingUp,
  AlertTriangle,
  Users,
  BarChart3,
  Medal,
  Crown,
  Target,
} from 'lucide-react';

interface TeamAnalyticsData {
  overview: {
    totalQuizzes: number;
    totalParticipants: number;
    totalResponses: number;
    averageScore: number;
    overallPassRate: number;
    totalQuestions: number;
  };
  trends: {
    daily: Array<{ date: string; count: number; averageScore: number }>;
    weekly: Array<{ date: string; count: number; averageScore: number }>;
    monthly: Array<{ date: string; count: number; averageScore: number }>;
  };
  rankings: {
    popularQuizzes: Array<{
      id: string;
      title: string;
      responseCount: number;
      averageScore: number;
    }>;
    highScoreQuizzes: Array<{
      id: string;
      title: string;
      averageScore: number;
      responseCount: number;
    }>;
    challengingQuizzes: Array<{
      id: string;
      title: string;
      averageScore: number;
      responseCount: number;
    }>;
  };
  statistics: {
    quizzesByStatus: {
      published: number;
      draft: number;
      archived: number;
    };
    responsesByMonth: Array<{ month: string; count: number }>;
    topPerformers: Array<{
      name: string;
      averageScore: number;
      completedQuizzes: number;
    }>;
  };
}

interface QuizRankingsProps {
  data: TeamAnalyticsData;
  lng: string;
}

type RankingType = 'popular' | 'highScore' | 'challenging';

export function QuizRankings({ data, lng }: QuizRankingsProps) {
  const t = useTranslations('dashboard.analytics');
  const [selectedRanking, setSelectedRanking] =
    useState<RankingType>('popular');

  const getRankingIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return (
          <span className="flex h-5 w-5 items-center justify-center text-sm font-semibold text-gray-500">
            {rank}
          </span>
        );
    }
  };

  const renderQuizRanking = () => {
    const { rankings } = data;
    let quizList: Array<{
      id: string;
      title: string;
      primaryMetric: number;
      secondaryMetric: number;
      primaryLabel: string;
      secondaryLabel: string;
    }> = [];

    switch (selectedRanking) {
      case 'popular':
        quizList = rankings.popularQuizzes.map(quiz => ({
          ...quiz,
          primaryMetric: quiz.responseCount,
          secondaryMetric: quiz.averageScore,
          primaryLabel: t('responses'),
          secondaryLabel: t('avgScore'),
        }));
        break;
      case 'highScore':
        quizList = rankings.highScoreQuizzes.map(quiz => ({
          ...quiz,
          primaryMetric: quiz.averageScore,
          secondaryMetric: quiz.responseCount,
          primaryLabel: t('avgScore'),
          secondaryLabel: t('responses'),
        }));
        break;
      case 'challenging':
        quizList = rankings.challengingQuizzes.map(quiz => ({
          ...quiz,
          primaryMetric: quiz.averageScore,
          secondaryMetric: quiz.responseCount,
          primaryLabel: t('avgScore'),
          secondaryLabel: t('responses'),
        }));
        break;
    }

    if (quizList.length === 0) {
      return (
        <div className="flex h-32 items-center justify-center text-gray-500">
          <div className="text-center">
            <BarChart3 className="mx-auto mb-2 h-8 w-8 text-gray-300" />
            <p className="text-sm">{t('noQuizzesAvailable')}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {quizList.slice(0, 10).map((quiz, index) => {
          const rank = index + 1;
          const isTopThree = rank <= 3;

          return (
            <div
              key={quiz.id}
              className={`flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50 ${
                isTopThree
                  ? 'border-yellow-200 bg-yellow-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center">
                  {getRankingIcon(rank)}
                </div>
                <div className="flex-1">
                  <Link
                    href={`/${lng}/dashboard/quizzes/${quiz.id}/preview`}
                    className="font-medium text-gray-900 hover:text-blue-600"
                  >
                    {quiz.title.length > 50
                      ? `${quiz.title.slice(0, 50)}...`
                      : quiz.title}
                  </Link>
                  <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                    <span>
                      {quiz.primaryLabel}:{' '}
                      {selectedRanking === 'highScore' ||
                      selectedRanking === 'challenging'
                        ? `${quiz.primaryMetric.toFixed(1)}%`
                        : quiz.primaryMetric.toLocaleString()}
                    </span>
                    <span>
                      {quiz.secondaryLabel}:{' '}
                      {selectedRanking === 'popular'
                        ? `${quiz.secondaryMetric.toFixed(1)}%`
                        : quiz.secondaryMetric.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              {isTopThree && (
                <Badge
                  variant="secondary"
                  className="bg-yellow-100 text-yellow-800"
                >
                  {t('topPerformer')}
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const rankingButtons = [
    {
      key: 'popular' as const,
      label: t('popularQuizzes'),
      icon: TrendingUp,
      color: 'text-blue-600',
    },
    {
      key: 'highScore' as const,
      label: t('highScoreQuizzes'),
      icon: Trophy,
      color: 'text-green-600',
    },
    {
      key: 'challenging' as const,
      label: t('challengingQuizzes'),
      icon: AlertTriangle,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quiz Rankings */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-lg font-semibold">
                  {t('quizRankings')}
                </CardTitle>
                <div className="flex gap-2">
                  {rankingButtons.map(button => {
                    const Icon = button.icon;
                    return (
                      <Button
                        key={button.key}
                        variant={
                          selectedRanking === button.key ? 'default' : 'outline'
                        }
                        size="sm"
                        onClick={() => setSelectedRanking(button.key)}
                        className={
                          selectedRanking === button.key ? '' : button.color
                        }
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {button.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </CardHeader>
            <CardContent>{renderQuizRanking()}</CardContent>
          </Card>
        </div>

        {/* Top Performers */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                {t('topPerformers')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.statistics.topPerformers.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Users className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                    <p className="text-sm">{t('noPerformersData')}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.statistics.topPerformers
                    .slice(0, 10)
                    .map((performer, index) => {
                      const rank = index + 1;
                      const isTopThree = rank <= 3;

                      return (
                        <div
                          key={`${performer.name}-${index}`}
                          className={`flex items-center justify-between rounded-lg border p-3 ${
                            isTopThree
                              ? 'border-blue-200 bg-blue-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex h-6 w-6 items-center justify-center">
                              {getRankingIcon(rank)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {performer.name.length > 20
                                  ? `${performer.name.slice(0, 20)}...`
                                  : performer.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {performer.completedQuizzes}{' '}
                                {t('quizzesCompleted')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">
                              {performer.averageScore.toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-500">
                              {t('avgScore')}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
