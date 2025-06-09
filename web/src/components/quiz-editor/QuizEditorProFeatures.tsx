'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuizEditorStore } from '@/stores/useQuizEditorStore';
import {
  Brain,
  FileSpreadsheet,
  Sparkles,
  Image,
  Users,
  Lock,
  Shuffle,
  Timer,
  Award,
  BarChart3,
  Layers,
  Upload,
} from 'lucide-react';

interface QuizEditorProFeaturesProps {
  lng: string;
  showSidebar?: boolean;
}

export function QuizEditorProFeatures({
  lng,
  showSidebar = false,
}: QuizEditorProFeaturesProps) {
  const t = useTranslations('quizManagement.editor.proFeatures');
  const { quiz, updateQuizMetadata } = useQuizEditorStore();

  if (showSidebar) {
    // サイドバー表示用のコンパクトビュー
    return (
      <div className="space-y-4">
        {/* AI質問生成 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Brain className="h-4 w-4" />
              {t('aiGeneration.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-xs text-gray-600">
              {t('aiGeneration.description')}
            </p>
            <Button size="sm" className="w-full">
              {t('aiGeneration.generate')}
            </Button>
          </CardContent>
        </Card>

        {/* クイズ設定 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              {t('advancedSettings.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="shuffle-questions"
                className="flex items-center gap-2 text-sm"
              >
                <Shuffle className="h-3 w-3" />
                {t('advancedSettings.shuffleQuestions')}
              </Label>
              <Switch
                id="shuffle-questions"
                checked={quiz?.shuffleQuestions || false}
                onCheckedChange={checked =>
                  updateQuizMetadata({ shuffleQuestions: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label
                htmlFor="shuffle-options"
                className="flex items-center gap-2 text-sm"
              >
                <Shuffle className="h-3 w-3" />
                {t('advancedSettings.shuffleOptions')}
              </Label>
              <Switch
                id="shuffle-options"
                checked={quiz?.shuffleOptions || false}
                onCheckedChange={checked =>
                  updateQuizMetadata({ shuffleOptions: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* 分析 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4" />
              {t('analytics.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('analytics.avgScore')}</span>
                <span className="font-medium">85%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">
                  {t('analytics.completionRate')}
                </span>
                <span className="font-medium">92%</span>
              </div>
            </div>
            <Button size="sm" variant="outline" className="mt-3 w-full">
              {t('analytics.viewDetails')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // メインエリア表示用のフルビュー
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            {t('title')}
          </CardTitle>
          <Badge className="bg-blue-600">{t('proBadge')}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="ai" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="ai">{t('tabs.ai')}</TabsTrigger>
            <TabsTrigger value="import">{t('tabs.import')}</TabsTrigger>
            <TabsTrigger value="advanced">{t('tabs.advanced')}</TabsTrigger>
            <TabsTrigger value="analytics">{t('tabs.analytics')}</TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <Brain className="mb-3 h-8 w-8 text-purple-600" />
                  <h4 className="mb-2 font-semibold">
                    {t('aiGeneration.title')}
                  </h4>
                  <p className="mb-4 text-sm text-gray-600">
                    {t('aiGeneration.description')}
                  </p>
                  <Button className="w-full">
                    {t('aiGeneration.generate')}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <Sparkles className="mb-3 h-8 w-8 text-yellow-600" />
                  <h4 className="mb-2 font-semibold">
                    {t('aiImprovement.title')}
                  </h4>
                  <p className="mb-4 text-sm text-gray-600">
                    {t('aiImprovement.description')}
                  </p>
                  <Button className="w-full" variant="outline">
                    {t('aiImprovement.improve')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <FileSpreadsheet className="mb-3 h-8 w-8 text-green-600" />
                  <h4 className="mb-2 font-semibold">
                    {t('excelImport.title')}
                  </h4>
                  <p className="mb-4 text-sm text-gray-600">
                    {t('excelImport.description')}
                  </p>
                  <Button className="w-full">
                    <Upload className="mr-2 h-4 w-4" />
                    {t('excelImport.upload')}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <Layers className="mb-3 h-8 w-8 text-blue-600" />
                  <h4 className="mb-2 font-semibold">
                    {t('questionBank.title')}
                  </h4>
                  <p className="mb-4 text-sm text-gray-600">
                    {t('questionBank.description')}
                  </p>
                  <Button className="w-full" variant="outline">
                    {t('questionBank.browse')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="space-y-4">
              {/* 時間制限 */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <Timer className="h-5 w-5 text-gray-600" />
                  <div>
                    <Label className="text-base">
                      {t('advancedSettings.timeLimit')}
                    </Label>
                    <p className="text-sm text-gray-600">
                      {t('advancedSettings.timeLimitDescription')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={quiz?.timeLimit || ''}
                    onChange={e =>
                      updateQuizMetadata({
                        timeLimit: parseInt(e.target.value) || null,
                      })
                    }
                    placeholder="30"
                    className="w-20 rounded border px-2 py-1"
                  />
                  <span className="text-sm text-gray-600">
                    {t('advancedSettings.minutes')}
                  </span>
                </div>
              </div>

              {/* 試行回数制限 */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-gray-600" />
                  <div>
                    <Label className="text-base">
                      {t('advancedSettings.maxAttempts')}
                    </Label>
                    <p className="text-sm text-gray-600">
                      {t('advancedSettings.maxAttemptsDescription')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={quiz?.maxAttempts || ''}
                    onChange={e =>
                      updateQuizMetadata({
                        maxAttempts: parseInt(e.target.value) || null,
                      })
                    }
                    placeholder="3"
                    className="w-20 rounded border px-2 py-1"
                  />
                  <span className="text-sm text-gray-600">
                    {t('advancedSettings.times')}
                  </span>
                </div>
              </div>

              {/* 証明書発行 */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-gray-600" />
                  <div>
                    <Label className="text-base">
                      {t('advancedSettings.certificate')}
                    </Label>
                    <p className="text-sm text-gray-600">
                      {t('advancedSettings.certificateDescription')}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  {t('advancedSettings.configureCertificate')}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="flex items-center gap-2 font-semibold">
                    <BarChart3 className="h-5 w-5" />
                    {t('analytics.detailedTitle')}
                  </h4>
                  <Badge variant="outline">{t('analytics.realtime')}</Badge>
                </div>

                <div className="mb-6 grid grid-cols-3 gap-4">
                  <div className="rounded-lg bg-gray-50 p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">156</div>
                    <div className="text-sm text-gray-600">
                      {t('analytics.totalResponses')}
                    </div>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">85%</div>
                    <div className="text-sm text-gray-600">
                      {t('analytics.avgScore')}
                    </div>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      92%
                    </div>
                    <div className="text-sm text-gray-600">
                      {t('analytics.completionRate')}
                    </div>
                  </div>
                </div>

                <Button className="w-full">
                  {t('analytics.viewFullReport')}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
