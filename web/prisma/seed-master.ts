import type {
  FeatureType,
  PlanType,
  Prisma,
  PrismaClient,
} from '@prisma/client';

/**
 * マスターデータのシード
 * プラン情報と機能定義など、システムで必須のデータを投入
 */
export async function seedMasterData(prisma: PrismaClient) {
  try {
    console.log('📌 マスターデータのシード開始...');

    // 機能定義マスターデータ
    const features: Prisma.FeatureCreateInput[] = [
      // 基本機能
      {
        type: 'TRUE_FALSE_QUESTION',
        name: '○×問題',
        nameEn: 'True/False Questions',
        description: '正誤を問う基本的な問題形式',
        descriptionEn: 'Basic true/false question format',
        category: 'BASIC',
        displayOrder: 1,
      },
      {
        type: 'SINGLE_CHOICE_QUESTION',
        name: '単一選択問題',
        nameEn: 'Single Choice Questions',
        description: '複数の選択肢から1つを選ぶ問題形式',
        descriptionEn: 'Choose one answer from multiple options',
        category: 'BASIC',
        displayOrder: 2,
      },
      {
        type: 'MULTIPLE_CHOICE_QUESTION',
        name: '複数選択問題',
        nameEn: 'Multiple Choice Questions',
        description: '複数の選択肢から複数を選ぶ問題形式',
        descriptionEn: 'Choose multiple answers from options',
        category: 'BASIC',
        displayOrder: 3,
      },
      {
        type: 'FREE_TEXT_QUESTION',
        name: '自由記述問題',
        nameEn: 'Free Text Questions',
        description: '自由に文章で回答する問題形式',
        descriptionEn: 'Open-ended text response questions',
        category: 'BASIC',
        displayOrder: 4,
      },
      {
        type: 'AUTO_GRADING',
        name: '自動採点',
        nameEn: 'Auto Grading',
        description: '回答を自動的に採点する機能',
        descriptionEn: 'Automatically grade responses',
        category: 'BASIC',
        displayOrder: 5,
      },
      {
        type: 'MANUAL_GRADING',
        name: '手動採点',
        nameEn: 'Manual Grading',
        description: '回答を手動で採点する機能',
        descriptionEn: 'Manually grade responses',
        category: 'BASIC',
        displayOrder: 6,
      },
      {
        type: 'PASSWORD_PROTECTION',
        name: 'パスワード保護',
        nameEn: 'Password Protection',
        description: 'クイズにパスワードを設定する機能',
        descriptionEn: 'Protect quizzes with passwords',
        category: 'BASIC',
        displayOrder: 7,
      },
      // Pro機能
      {
        type: 'SUBDOMAIN',
        name: '独自サブドメイン',
        nameEn: 'Custom Subdomain',
        description: 'クイズごとに独自のサブドメインを設定',
        descriptionEn: 'Set custom subdomains for quizzes',
        category: 'PRO',
        displayOrder: 20,
      },
      {
        type: 'MEDIA_UPLOAD',
        name: '画像・動画アップロード',
        nameEn: 'Media Upload',
        description: '問題に画像や動画を追加する機能',
        descriptionEn: 'Add images and videos to questions',
        category: 'PRO',
        displayOrder: 21,
      },
      {
        type: 'QUESTION_BANK',
        name: '問題バンク',
        nameEn: 'Question Bank',
        description: '問題を保存・再利用できる機能',
        descriptionEn: 'Save and reuse questions',
        category: 'PRO',
        displayOrder: 22,
      },
      {
        type: 'ADVANCED_QUESTION_TYPES',
        name: '高度な問題形式',
        nameEn: 'Advanced Question Types',
        description: '並び替え、穴埋め、マッチングなどの高度な問題形式',
        descriptionEn: 'Advanced formats like sorting, fill-in-blank, matching',
        category: 'PRO',
        displayOrder: 23,
      },
      {
        type: 'ANALYTICS',
        name: '詳細分析',
        nameEn: 'Detailed Analytics',
        description: '回答結果の詳細な分析機能',
        descriptionEn: 'Detailed analysis of quiz results',
        category: 'PRO',
        displayOrder: 24,
      },
      {
        type: 'SECTIONS',
        name: 'セクション機能',
        nameEn: 'Section Management',
        description: 'クイズを複数のセクションに分割',
        descriptionEn: 'Divide quizzes into multiple sections',
        category: 'PRO',
        displayOrder: 25,
      },
      {
        type: 'CERTIFICATES',
        name: '修了証発行',
        nameEn: 'Certificate Generation',
        description: 'クイズ合格者への修了証発行機能',
        descriptionEn: 'Generate certificates for quiz completers',
        category: 'PRO',
        displayOrder: 26,
      },
      {
        type: 'EXCEL_EXPORT',
        name: 'Excel出力',
        nameEn: 'Excel Export',
        description: '回答結果をExcelファイルで出力',
        descriptionEn: 'Export results to Excel files',
        category: 'PRO',
        displayOrder: 27,
      },
      {
        type: 'TEAM_MANAGEMENT',
        name: 'チーム管理',
        nameEn: 'Team Management',
        description: '複数メンバーでの共同作業機能',
        descriptionEn: 'Collaborate with team members',
        category: 'PRO',
        displayOrder: 28,
      },
      {
        type: 'CUSTOM_DESIGN',
        name: 'カスタムデザイン',
        nameEn: 'Custom Design',
        description: 'ブランドに合わせたデザインカスタマイズ',
        descriptionEn: 'Customize design to match your brand',
        category: 'PRO',
        displayOrder: 29,
      },
      {
        type: 'AI_QUIZ_GENERATION',
        name: 'AI問題生成',
        nameEn: 'AI Quiz Generation',
        description: 'AIを使った問題の自動生成機能',
        descriptionEn: 'Generate questions using AI',
        category: 'PRO',
        displayOrder: 30,
      },
      // PREMIUM機能
      {
        type: 'PERMISSIONS_MANAGEMENT',
        name: '権限管理',
        nameEn: 'Permission Management',
        description: '詳細な権限設定と管理機能',
        descriptionEn: 'Detailed permission settings and management',
        category: 'PRO',
        displayOrder: 40,
      },
      {
        type: 'AUDIT_LOG',
        name: '監査ログ',
        nameEn: 'Audit Log',
        description: 'すべての操作履歴を記録・追跡',
        descriptionEn: 'Track and record all operations',
        category: 'PRO',
        displayOrder: 41,
      },
      {
        type: 'SLA_GUARANTEE',
        name: 'SLA保証',
        nameEn: 'SLA Guarantee',
        description: 'サービスレベル保証',
        descriptionEn: 'Service Level Agreement guarantee',
        category: 'PRO',
        displayOrder: 42,
      },
      {
        type: 'CUSTOM_DEVELOPMENT',
        name: 'カスタム開発',
        nameEn: 'Custom Development',
        description: '要望に応じたカスタム機能開発',
        descriptionEn: 'Custom feature development on request',
        category: 'PRO',
        displayOrder: 43,
      },
      {
        type: 'ON_PREMISE',
        name: 'オンプレミス対応',
        nameEn: 'On-Premise Support',
        description: '自社サーバーでの運用対応',
        descriptionEn: 'Support for on-premise deployment',
        category: 'PRO',
        displayOrder: 44,
      },
      {
        type: 'PRIORITY_SUPPORT',
        name: '優先サポート',
        nameEn: 'Priority Support',
        description: '24時間365日の優先技術サポート',
        descriptionEn: '24/7 priority technical support',
        category: 'PRO',
        displayOrder: 45,
      },
    ];

    // 機能マスターデータの投入
    console.log('\n📝 機能マスターデータを投入中...');
    for (const featureData of features) {
      try {
        const feature = await prisma.feature.upsert({
          where: { type: featureData.type },
          update: featureData,
          create: featureData,
        });
        console.log(`✅ 機能マスター作成/更新: ${feature.name}`);
      } catch (error) {
        console.error(
          `❌ 機能マスター作成エラー (${featureData.type}):`,
          error
        );
        throw error;
      }
    }

    // プランマスターデータ
    const plans: Prisma.PlanCreateInput[] = [
      {
        type: 'FREE',
        name: 'フリープラン',
        description: '個人や小規模チームに最適',
        monthlyPrice: 0,
        yearlyPrice: 0,
        monthlyPricePerMember: 0,
        yearlyPricePerMember: 0,
        includedMembers: 1,
        maxQuizzes: 5,
        maxMembers: 1,
        maxQuestionsPerQuiz: 20,
        maxResponsesPerMonth: 100,
        maxStorageMB: 100,
        isActive: true,
        displayOrder: 1,
      },
      {
        type: 'PRO',
        name: 'プロプラン',
        description: '教育機関や企業に最適',
        monthlyPrice: 0, // 基本料金なし（ユーザー単価制）
        yearlyPrice: 0, // 基本料金なし（ユーザー単価制）
        monthlyPricePerMember: 2980, // ¥2,980/user/month
        yearlyPricePerMember: 29760, // ¥29,760/user/year (¥2,480/month)
        includedMembers: 0, // 含まれるメンバーなし（全員課金）
        maxQuizzes: null, // 無制限
        maxMembers: 50, // 最大50名まで
        maxQuestionsPerQuiz: 200,
        maxResponsesPerMonth: 3000,
        maxStorageMB: 10240, // 10GB
        isActive: true,
        displayOrder: 2,
      },
      {
        type: 'PRO',
        name: 'エンタープライズ',
        description: '大規模組織・教育機関向け',
        monthlyPrice: 0, // カスタム価格
        yearlyPrice: 0, // カスタム価格
        monthlyPricePerMember: 0, // カスタム価格
        yearlyPricePerMember: 0, // カスタム価格
        includedMembers: 0, // カスタム
        maxQuizzes: null,
        maxMembers: null,
        maxQuestionsPerQuiz: null,
        maxResponsesPerMonth: null,
        maxStorageMB: null,
        isActive: true,
        displayOrder: 3,
      },
    ];

    // プランの投入
    console.log('\n📋 プランマスターデータを投入中...');
    for (const planData of plans) {
      try {
        const plan = await prisma.plan.upsert({
          where: { type: planData.type },
          update: {
            name: planData.name,
            description: planData.description,
            monthlyPrice: planData.monthlyPrice,
            yearlyPrice: planData.yearlyPrice,
            monthlyPricePerMember: planData.monthlyPricePerMember,
            yearlyPricePerMember: planData.yearlyPricePerMember,
            includedMembers: planData.includedMembers,
            maxQuizzes: planData.maxQuizzes,
            maxMembers: planData.maxMembers,
            maxQuestionsPerQuiz: planData.maxQuestionsPerQuiz,
            maxResponsesPerMonth: planData.maxResponsesPerMonth,
            maxStorageMB: planData.maxStorageMB,
            isActive: planData.isActive,
            displayOrder: planData.displayOrder,
          },
          create: planData,
        });
        console.log(`✅ プランマスター作成/更新: ${plan.name}`);
      } catch (error) {
        console.error(`❌ プランマスター作成エラー (${planData.type}):`, error);
        throw error;
      }
    }

    // プランと機能の関連付け
    const planFeatures: {
      plan: PlanType;
      features: FeatureType[];
    }[] = [
      // フリープラン: 基本機能のみ
      {
        plan: 'FREE',
        features: [
          'TRUE_FALSE_QUESTION',
          'SINGLE_CHOICE_QUESTION',
          'MULTIPLE_CHOICE_QUESTION',
          'FREE_TEXT_QUESTION',
          'AUTO_GRADING',
          'MANUAL_GRADING',
          'PASSWORD_PROTECTION',
        ],
      },
      // プロプラン: 基本機能 + Pro機能
      {
        plan: 'PRO',
        features: [
          'TRUE_FALSE_QUESTION',
          'SINGLE_CHOICE_QUESTION',
          'MULTIPLE_CHOICE_QUESTION',
          'FREE_TEXT_QUESTION',
          'AUTO_GRADING',
          'MANUAL_GRADING',
          'PASSWORD_PROTECTION',
          'SUBDOMAIN',
          'MEDIA_UPLOAD',
          'QUESTION_BANK',
          'ADVANCED_QUESTION_TYPES',
          'ANALYTICS',
          'SECTIONS',
          'CERTIFICATES',
          'EXCEL_EXPORT',
          'TEAM_MANAGEMENT',
          'CUSTOM_DESIGN',
          'AI_QUIZ_GENERATION',
        ],
      },
      // エンタープライズ: すべての機能
      { plan: 'PRO', features: features.map(f => f.type) },
    ];

    // プランと機能の関連付けを投入
    console.log('\n🔗 プランと機能の関連付けを設定中...');
    for (const { plan: planType, features: featureTypes } of planFeatures) {
      const plan = await prisma.plan.findUnique({ where: { type: planType } });
      if (!plan) {
        console.warn(`⚠️ プラン ${planType} が見つかりません`);
        continue;
      }

      let featureCount = 0;
      for (const featureType of featureTypes) {
        const feature = await prisma.feature.findUnique({
          where: { type: featureType },
        });
        if (!feature) {
          console.warn(`⚠️ 機能 ${featureType} が見つかりません`);
          continue;
        }

        try {
          await prisma.planFeature.upsert({
            where: {
              planId_featureId: {
                planId: plan.id,
                featureId: feature.id,
              },
            },
            update: { isEnabled: true },
            create: {
              planId: plan.id,
              featureId: feature.id,
              isEnabled: true,
              // AI機能は無料プランで月3回まで
              limit:
                planType === 'FREE' && featureType === 'AI_QUIZ_GENERATION'
                  ? 3
                  : null,
            },
          });
          featureCount++;
        } catch (error) {
          console.error(
            `❌ プラン機能関連付けエラー (${planType} - ${featureType}):`,
            error
          );
          throw error;
        }
      }
      console.log(`✅ ${plan.name}の機能設定完了 (${featureCount}個の機能)`);
    }

    console.log('\n✨ マスターデータのシード完了！');
  } catch (error) {
    console.error('\n❌ マスターデータのシードでエラー:', error);

    // エラーの詳細情報を出力
    if (error instanceof Error) {
      console.error('エラーメッセージ:', error.message);
      console.error('スタックトレース:', error.stack);
    }

    throw error;
  }
}
