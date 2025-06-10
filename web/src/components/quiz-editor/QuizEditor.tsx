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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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

  // Zustandストアを初期化
  React.useEffect(() => {
    initializeQuiz(quiz);
  }, [quiz, initializeQuiz]);

  const hasPaidPlan = isPro || isPremium;

  // Mobile: Hide question list when editing a question
  const isEditingOnMobile = currentQuestionIndex !== null;

  const handleBackToList = () => {
    setCurrentQuestion(null);
    setShowMobileQuestionList(true);
  };

  return (
    <div className="flex h-full flex-col">
      <QuizEditorHeader quizId={quiz.id} lng={lng} />

      {/* Mobile Layout (up to md/768px) */}
      <div className="quiz-editor-transition flex flex-1 overflow-hidden md:hidden">
        <div className="flex-1 overflow-y-auto">
          {/* Mobile: Back button when editing */}
          {isEditingOnMobile && (
            <div className="border-b bg-white p-4">
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

          {/* Mobile: Question list toggle */}
          {!isEditingOnMobile && (
            <div className="border-b bg-white p-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setShowMobileQuestionList(!showMobileQuestionList)
                }
                className="gap-2"
              >
                <List className="h-4 w-4" />
                {showMobileQuestionList ? 'Hide' : 'Show'} Questions
              </Button>
            </div>
          )}

          <div className="space-y-4 p-4">
            {/* Always show metadata and toolbar */}
            <QuizMetadataForm />
            {hasPaidPlan && <QuizEditorProFeatures lng={lng} />}
            <QuestionTypeToolbar />

            {/* Mobile: Show question list only when not editing and list is visible */}
            {!isEditingOnMobile && showMobileQuestionList && <QuestionList />}
          </div>
        </div>
      </div>

      {/* Tablet Layout (md to lg/768px-1024px) */}
      <div className="quiz-editor-transition hidden flex-1 overflow-hidden md:flex lg:hidden">
        {/* Left Panel: Question List */}
        <div className="w-80 overflow-y-auto border-r bg-gray-50">
          <div className="p-4">
            <QuestionList />
          </div>
        </div>

        {/* Right Panel: Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-3xl space-y-6">
            <QuizMetadataForm />
            {hasPaidPlan && <QuizEditorProFeatures lng={lng} />}
            <QuestionTypeToolbar />
          </div>
        </div>
      </div>

      {/* Desktop Layout (lg+/1024px+) */}
      <div className="quiz-editor-transition hidden flex-1 overflow-hidden lg:flex">
        {/* Left Panel: Question List */}
        <div className="w-80 overflow-y-auto border-r bg-gray-50">
          <div className="p-4">
            <QuestionList />
          </div>
        </div>

        {/* Center Panel: Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-3xl space-y-6">
            <QuizMetadataForm />
            {hasPaidPlan && <QuizEditorProFeatures lng={lng} />}
            <QuestionTypeToolbar />
          </div>
        </div>

        {/* Right Panel: Settings */}
        {showSettings && (
          <div className="w-80 border-l bg-gray-50 p-6">
            <QuizSettingsPanel />
          </div>
        )}
      </div>

      {/* Settings Modal for Mobile/Tablet */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto lg:hidden">
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
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
