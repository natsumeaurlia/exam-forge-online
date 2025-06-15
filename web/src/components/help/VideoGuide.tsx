'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, Users, Star } from 'lucide-react';

interface VideoGuideProps {
  lng: string;
}

interface VideoGuide {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  views: number;
  rating: number;
  thumbnail: string;
  videoUrl: string;
}

export function VideoGuide({ lng }: VideoGuideProps) {
  const t = useTranslations('dashboard.help.video');

  const videoGuides: VideoGuide[] = [
    {
      id: '1',
      title: t('guides.gettingStarted.title'),
      description: t('guides.gettingStarted.description'),
      duration: '5:30',
      difficulty: 'beginner',
      views: 1250,
      rating: 4.8,
      thumbnail: '/videos/thumbnails/getting-started.jpg',
      videoUrl: '/videos/getting-started.mp4',
    },
    {
      id: '2',
      title: t('guides.createQuiz.title'),
      description: t('guides.createQuiz.description'),
      duration: '8:15',
      difficulty: 'beginner',
      views: 980,
      rating: 4.7,
      thumbnail: '/videos/thumbnails/create-quiz.jpg',
      videoUrl: '/videos/create-quiz.mp4',
    },
    {
      id: '3',
      title: t('guides.teamManagement.title'),
      description: t('guides.teamManagement.description'),
      duration: '12:45',
      difficulty: 'intermediate',
      views: 654,
      rating: 4.9,
      thumbnail: '/videos/thumbnails/team-management.jpg',
      videoUrl: '/videos/team-management.mp4',
    },
    {
      id: '4',
      title: t('guides.advancedFeatures.title'),
      description: t('guides.advancedFeatures.description'),
      duration: '15:20',
      difficulty: 'advanced',
      views: 432,
      rating: 4.6,
      thumbnail: '/videos/thumbnails/advanced-features.jpg',
      videoUrl: '/videos/advanced-features.mp4',
    },
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const handleVideoPlay = (videoUrl: string) => {
    // Open video in modal or navigate to video page
    console.log('Playing video:', videoUrl);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold">{t('title')}</h3>
        <p className="text-muted-foreground mt-2">{t('description')}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {videoGuides.map(guide => (
          <Card
            key={guide.id}
            className="group transition-shadow hover:shadow-lg"
          >
            <div className="relative overflow-hidden rounded-t-lg">
              <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                  <Play className="mx-auto mb-4 h-16 w-16 text-blue-600" />
                  <p className="text-sm text-gray-600">
                    {t('videoPlaceholder')}
                  </p>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  onClick={() => handleVideoPlay(guide.videoUrl)}
                  className="bg-white/90 text-black hover:bg-white"
                >
                  <Play className="mr-2 h-5 w-5" />
                  {t('playVideo')}
                </Button>
              </div>
              <div className="absolute top-4 right-4">
                <Badge className={getDifficultyColor(guide.difficulty)}>
                  {t(`difficulty.${guide.difficulty}`)}
                </Badge>
              </div>
            </div>

            <CardHeader>
              <CardTitle className="text-lg">{guide.title}</CardTitle>
              <CardDescription>{guide.description}</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="text-muted-foreground flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {guide.duration}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {guide.views.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    {guide.rating}
                  </div>
                </div>
              </div>

              <Button
                onClick={() => handleVideoPlay(guide.videoUrl)}
                className="mt-4 w-full"
                variant="outline"
              >
                <Play className="mr-2 h-4 w-4" />
                {t('watchNow')}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('more.title')}</CardTitle>
          <CardDescription>{t('more.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button variant="outline" className="flex-1">
              {t('more.playlist')}
            </Button>
            <Button variant="outline" className="flex-1">
              {t('more.suggest')}
            </Button>
            <Button variant="outline" className="flex-1">
              {t('more.feedback')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
