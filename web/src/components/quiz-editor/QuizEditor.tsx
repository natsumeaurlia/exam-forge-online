'use client';

import React, { useState } from 'react';
import { QuizEditorHeader } from './QuizEditorHeader';
import { QuizMetadataForm } from './QuizMetadataForm';
import { QuestionTypeToolbar } from './QuestionTypeToolbar';
import { QuestionList } from './QuestionList';
import { QuizSettingsPanel } from './QuizSettingsPanel';
import { QuizEditorProFeatures } from './QuizEditorProFeatures';
import { useQuizEditorStore } from '@/stores/useQuizEditorStore';
import { useUserPlan } from '@/components/providers/UserPlanProvider';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type {
  Quiz,
  Question,
  Section,
  QuizTag,
  QuestionOption,
  Tag,
  QuestionMedia,
  MediaType,
} from '@prisma/client';
import { Settings, Crown, ArrowLeft, List } from 'lucide-react';

interface MediaItem extends QuestionMedia {
  type: MediaType;
}

interface QuizWithRelations extends Quiz {
  questions: (Question & {
    options: QuestionOption[];
    media?: MediaItem[];
  })[];
  sections: Section[];
  tags: (QuizTag & {
    tag: Tag;
  })[];
}

interface QuizEditorProps {
  quiz: QuizWithRelations;
  lng: string;
}

export function QuizEditor({ quiz, lng }: QuizEditorProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showProFeatures, setShowProFeatures] = useState(false);
  const [showMobileQuestionList, setShowMobileQuestionList] = useState(true);
  const { initializeQuiz, currentQuestionIndex, setCurrentQuestion } =
    useQuizEditorStore();
  const { isPro, isPremium } = useUserPlan();

  // Media queries for responsive design
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // Zustandストアを初期化
  React.useEffect(() => {
    initializeQuiz(quiz);
  }, [quiz, initializeQuiz]);

  const hasPaidPlan = isPro || isPremium;

  // Mobile: Hide question list when editing a question
  const isEditingOnMobile = isMobile && currentQuestionIndex !== null;

  const handleBackToList = () => {
    setCurrentQuestion(null);
    setShowMobileQuestionList(true);
  };

  // Determine layout classes based on screen size
  const containerClasses = cn(
    'flex flex-1 overflow-hidden transition-all duration-300 ease-in-out',
    isMobile && 'flex-col',
    isTablet && 'flex-row',
    isDesktop && 'flex-row'
  );

  const questionListClasses = cn(
    'overflow-y-auto border-r bg-gray-50',
    isMobile && 'border-r-0 border-b',
    (isTablet || isDesktop) && 'w-80'
  );

  const mainContentClasses = cn(
    'flex-1 overflow-y-auto',
    isMobile && 'p-4',
    (isTablet || isDesktop) && 'p-6'
  );

  const settingsPanelClasses = cn(
    'w-80 border-l bg-gray-50 p-6',
    !isDesktop && 'hidden'
  );

  return (
    <div className="flex h-full flex-col">
      <QuizEditorHeader quizId={quiz.id} lng={lng} />

      {/* Single Responsive Layout */}
      <div className={containerClasses} data-testid={isMobile ? 'mobile-layout' : isTablet ? 'tablet-layout' : 'desktop-layout'}>
        {/* Question List Panel */}
        {(!isMobile || (!isEditingOnMobile && showMobileQuestionList)) && (
          <div className={questionListClasses}>
            {isMobile && (
              <div className="border-b bg-white p-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMobileQuestionList(!showMobileQuestionList)}
                  className="gap-2"
                >
                  <List className="h-4 w-4" />
                  {showMobileQuestionList ? 'Hide' : 'Show'} Questions
                </Button>
              </div>
            )}
            <div className="p-4">
              <QuestionList />
            </div>
          </div>
        )}

        {/* Main Content Panel */}
        <div className={mainContentClasses}>
          {/* Mobile: Back button when editing */}
          {isEditingOnMobile && (
            <div className="mb-4 border-b bg-white p-4 -m-4 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToList}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Questions
              </Button>
            </div>
          )}

          <div className={cn('space-y-6', isTablet || isDesktop ? 'mx-auto max-w-3xl' : '')}>
            <QuizMetadataForm />
            {hasPaidPlan && <QuizEditorProFeatures lng={lng} />}
            <QuestionTypeToolbar />
          </div>
        </div>

        {/* Settings Panel (Desktop Only) */}
        {showSettings && isDesktop && (
          <div className={settingsPanelClasses}>
            <QuizSettingsPanel />
          </div>
        )}
      </div>

      {/* Settings Modal for Mobile/Tablet */}
      <Dialog open={showSettings && !isDesktop} onOpenChange={setShowSettings}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quiz Settings</DialogTitle>
          </DialogHeader>
          <QuizSettingsPanel />
        </DialogContent>
      </Dialog>

      {/* Floating Settings Button */}
      <div className="fixed right-6 bottom-6 z-50">
        <Button
          onClick={() => setShowSettings(!showSettings)}
          className="rounded-full bg-blue-600 p-3 text-white shadow-lg hover:bg-blue-700"
          size="sm"
          data-testid="settings-button"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
