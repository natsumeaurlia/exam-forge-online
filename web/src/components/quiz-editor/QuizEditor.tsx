'use client';

import React, { useState, useEffect } from 'react';
import { QuizEditorHeader } from './QuizEditorHeader';
import { QuizMetadataForm } from './QuizMetadataForm';
import { QuestionTypeToolbar } from './QuestionTypeToolbar';
import { QuestionList } from './QuestionList';
import { QuizEditorProFeatures } from './QuizEditorProFeatures';
import { SectionList } from './SectionList';
import { useQuizEditorStore } from '@/stores/useQuizEditorStore';
import { useUserPlan } from '@/components/providers/UserPlanProvider';
import { getSections } from '@/lib/actions/section';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FeatureType } from '@prisma/client';
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
  const { initializeQuiz } = useQuizEditorStore();
  const { isPro, isPremium } = useUserPlan();
  const [activeTab, setActiveTab] = useState('questions');
  const [sections, setSections] = useState<any[]>([]);
  const [isLoadingSections, setIsLoadingSections] = useState(false);

  // Zustandストアを初期化
  React.useEffect(() => {
    initializeQuiz(quiz);
  }, [quiz, initializeQuiz]);

  const hasPaidPlan = isPro || isPremium;
  const hasSectionFeature = hasPaidPlan; // セクション機能はPro以上で利用可能

  // 初回セクション読み込み
  useEffect(() => {
    if (hasSectionFeature) {
      refreshSections();
    }
  }, [hasSectionFeature]);

  // セクション一覧を再取得
  const refreshSections = async () => {
    if (!hasSectionFeature) return;

    try {
      setIsLoadingSections(true);
      const updatedSections = await getSections(quiz.id);
      setSections(updatedSections);
    } catch (error) {
      console.error('Failed to refresh sections:', error);
    } finally {
      setIsLoadingSections(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <QuizEditorHeader quizId={quiz.id} lng={lng} />

      {/* Main Content Layout */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-4xl space-y-6">
            <QuizMetadataForm />
            {hasPaidPlan && <QuizEditorProFeatures lng={lng} />}

            {/* タブナビゲーション */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList
                className={`grid w-full ${hasSectionFeature ? 'grid-cols-2' : 'grid-cols-1'}`}
              >
                <TabsTrigger value="questions">問題</TabsTrigger>
                {hasSectionFeature && (
                  <TabsTrigger value="sections">セクション</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="questions" className="space-y-4">
                <QuestionTypeToolbar />
                <div className="space-y-4">
                  <QuestionList />
                </div>
              </TabsContent>

              {hasSectionFeature && (
                <TabsContent value="sections" className="space-y-4">
                  <SectionList
                    quizId={quiz.id}
                    sections={sections}
                    onSectionUpdated={refreshSections}
                  />
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
