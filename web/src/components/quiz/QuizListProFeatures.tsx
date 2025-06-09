'use client';

import { useUserPlan } from '@/components/providers/UserPlanProvider';
import { ProFeatureGate } from '@/components/quiz/ProFeatureGate';
import { Button } from '@/components/ui/button';
import { Sparkles, FileSpreadsheet, Brain } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function QuizListProFeatures() {
  const { isPro } = useUserPlan();
  const t = useTranslations('quizManagement');

  return (
    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* Excel Import - Pro Feature */}
      <ProFeatureGate
        featureType="EXCEL_EXPORT"
        requiredPlan="PRO"
        className="h-full"
      >
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
          <FileSpreadsheet className="mb-3 h-8 w-8 text-blue-600" />
          <h3 className="mb-2 font-semibold">{t('features.excelImport')}</h3>
          <p className="mb-4 text-sm text-gray-600">
            {t('features.excelImportDescription')}
          </p>
          <Button size="sm" className="w-full">
            {t('features.importFromExcel')}
          </Button>
        </div>
      </ProFeatureGate>

      {/* AI Quiz Generation - Pro Feature */}
      <ProFeatureGate
        featureType="AI_QUIZ_GENERATION"
        requiredPlan="PRO"
        className="h-full"
      >
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-6">
          <Brain className="mb-3 h-8 w-8 text-purple-600" />
          <h3 className="mb-2 font-semibold">{t('features.aiGeneration')}</h3>
          <p className="mb-4 text-sm text-gray-600">
            {t('features.aiGenerationDescription')}
          </p>
          <Button size="sm" className="w-full">
            {t('features.generateWithAI')}
          </Button>
        </div>
      </ProFeatureGate>

      {/* Advanced Analytics - Pro Feature */}
      <ProFeatureGate
        featureType="ANALYTICS"
        requiredPlan="PRO"
        className="h-full"
      >
        <div className="rounded-lg border border-green-200 bg-green-50 p-6">
          <Sparkles className="mb-3 h-8 w-8 text-green-600" />
          <h3 className="mb-2 font-semibold">
            {t('features.advancedAnalytics')}
          </h3>
          <p className="mb-4 text-sm text-gray-600">
            {t('features.advancedAnalyticsDescription')}
          </p>
          <Button size="sm" className="w-full">
            {t('features.viewAnalytics')}
          </Button>
        </div>
      </ProFeatureGate>
    </div>
  );
}
