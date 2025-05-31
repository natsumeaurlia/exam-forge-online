import type { Preview } from '@storybook/nextjs-vite';
import '../src/index.css';

import { withThemeByClassName } from '@storybook/addon-themes';
import { NextIntlClientProvider } from 'next-intl';

// next-intl用のメッセージ
const messages = {
  'cta.title': '今すぐExamForgeを始めよう',
  'cta.description':
    '無料でアカウントを作成して、プロフェッショナルなクイズを作成しましょう。',
  'cta.buttons.demo': 'デモを見る',
  'cta.buttons.signup': '無料で始める',
  'hero.tagline': '最新のクイズ作成プラットフォーム',
  'hero.title': 'プロフェッショナルなクイズを簡単に作成',
  'hero.description':
    'ExamForgeで効率的なオンライン試験・クイズシステムを構築しましょう。',
  'hero.cta.start': '無料で始める',
  'hero.cta.demo': 'デモを見る',
  'hero.benefits.noCard': 'クレジットカード不要',
  'hero.benefits.freeQuizzes': '無料で3つのクイズ作成',
  'hero.benefits.scoring': '自動採点機能',
  'hero.quiz.title': 'JavaScript基礎',
  'hero.quiz.question': 'JavaScriptで変数を宣言するキーワードはどれですか？',
  'hero.quiz.options.0': 'var',
  'hero.quiz.options.1': 'let',
  'hero.quiz.options.2': 'const',
  'hero.quiz.options.3': 'function',
  'hero.quiz.progress': '問題 1/10',
  'hero.quiz.nextButton': '次へ',
  'features.title': '豊富な機能',
  'features.description':
    'ExamForgeは教育・企業研修・資格試験に必要な全ての機能を提供します。',
  'features.list.builder.title': '直感的なクイズビルダー',
  'features.list.builder.description': 'ドラッグ&ドロップで簡単にクイズを作成',
  'features.list.questionTypes.title': '多様な問題形式',
  'features.list.questionTypes.description':
    '択一、複数選択、記述式など豊富な問題タイプ',
  'features.list.analytics.title': '詳細な分析',
  'features.list.analytics.description': '受験者の成績を詳細に分析・可視化',
  'features.list.scoring.title': '自動採点',
  'features.list.scoring.description':
    '即座に結果を表示し、フィードバックを提供',
  'features.list.import.title': 'データインポート',
  'features.list.import.description': 'ExcelやCSVから問題を一括インポート',
  'features.list.certificates.title': '修了証発行',
  'features.list.certificates.description':
    'カスタマイズ可能な修了証を自動発行',
  'features.list.security.title': 'セキュリティ',
  'features.list.security.description': '不正行為防止機能で公正な試験を実現',
  'features.list.feedback.title': 'フィードバック',
  'features.list.feedback.description': '詳細な解説とヒントで学習をサポート',
  'pricing.title': '料金プラン',
  'pricing.description':
    'あなたのニーズに合わせた柔軟な料金プランをご用意しています。',
  'pricing.plans.free.name': 'フリー',
  'pricing.plans.free.period': '月',
  'pricing.plans.free.description': '個人利用や小規模な試験に最適',
  'pricing.plans.free.cta': '無料で始める',
  'pricing.plans.pro.name': 'プロ',
  'pricing.plans.pro.period': '月',
  'pricing.plans.pro.description': '中規模な組織や教育機関に最適',
  'pricing.plans.pro.popular': '人気',
  'pricing.plans.pro.cta': 'プロプランを選択',
  'pricing.plans.enterprise.name': 'エンタープライズ',
  'pricing.plans.enterprise.price': 'お問い合わせ',
  'pricing.plans.enterprise.period': '',
  'pricing.plans.enterprise.description': '大規模な組織や企業に最適',
  'pricing.plans.enterprise.cta': 'お問い合わせ',
  'pricing.plans.features.included': '含まれる機能',
  'pricing.plans.features.quizzes.free': '3つのクイズ',
  'pricing.plans.features.quizzes.pro': '無制限のクイズ',
  'pricing.plans.features.quizzes.enterprise': '無制限のクイズ',
  'pricing.plans.features.members.free': '10名まで',
  'pricing.plans.features.members.pro': '100名まで',
  'pricing.plans.features.members.enterprise': '無制限',
  'pricing.plans.features.questions.free': '問題数50問まで',
  'pricing.plans.features.questions.pro': '問題数1000問まで',
  'pricing.plans.features.questions.enterprise': '無制限の問題数',
  'pricing.plans.features.responses.free': '月100回答まで',
  'pricing.plans.features.responses.pro': '月10,000回答まで',
  'pricing.plans.features.responses.enterprise': '無制限の回答',
  'pricing.plans.features.storage.free': 'ストレージ100MB',
  'pricing.plans.features.storage.pro': 'ストレージ10GB',
  'pricing.plans.features.storage.enterprise': '無制限ストレージ',
  'pricing.plans.features.truefalse': '○×問題',
  'pricing.plans.features.singlechoice': '択一選択問題',
  'pricing.plans.features.multiplechoice': '複数選択問題',
  'pricing.plans.features.freetext': '自由記述問題',
  'pricing.plans.features.autograding': '自動採点',
  'pricing.plans.features.manualgrading': '手動採点',
  'pricing.plans.features.password': 'パスワード保護',
  'pricing.plans.features.subdomain': 'カスタムサブドメイン',
  'pricing.plans.features.media': '画像・動画対応',
  'pricing.plans.features.questionbank': '問題バンク',
  'pricing.plans.features.advancedtypes': '高度な問題タイプ',
  'pricing.plans.features.analytics': '詳細分析',
  'pricing.plans.features.sections': 'セクション分け',
  'pricing.plans.features.certificates': '修了証発行',
  'pricing.plans.features.excel': 'Excel/CSV出力',
  'pricing.plans.features.teams': 'チーム管理',
  'pricing.plans.features.customdesign': 'カスタムデザイン',
  'pricing.plans.features.permissions': '権限管理',
  'pricing.plans.features.audit': '監査ログ',
  'pricing.plans.features.sla': 'SLA保証',
  'pricing.plans.features.allpro': 'プロプランの全機能',
  'pricing.plans.features.customdev': 'カスタム開発',
  'pricing.plans.features.onpremise': 'オンプレミス対応',
  'pricing.plans.features.support': '専用サポート',
  'pricing.guarantee': '30日間返金保証',
  'usecases.title': '活用事例',
  'usecases.description': 'ExamForgeは様々な分野で活用されています。',
  'usecases.tabs.education.title': '教育機関',
  'usecases.tabs.education.description':
    '学校や大学での試験・課題作成に最適です。',
  'usecases.tabs.education.benefits.0': 'オンライン授業での理解度確認',
  'usecases.tabs.education.benefits.1': '期末試験のデジタル化',
  'usecases.tabs.education.benefits.2': '学習進捗の可視化',
  'usecases.tabs.education.benefits.3': '自動採点による効率化',
  'usecases.tabs.corporate.title': '企業研修',
  'usecases.tabs.corporate.description':
    '社員研修や資格試験の実施に活用できます。',
  'usecases.tabs.corporate.benefits.0': '新入社員研修の効率化',
  'usecases.tabs.corporate.benefits.1': 'スキルアセスメント',
  'usecases.tabs.corporate.benefits.2': 'コンプライアンス研修',
  'usecases.tabs.corporate.benefits.3': '研修効果の測定',
  'usecases.tabs.certification.title': '資格・認定',
  'usecases.tabs.certification.description':
    '資格試験や認定試験の実施に最適です。',
  'usecases.tabs.certification.benefits.0': 'オンライン資格試験',
  'usecases.tabs.certification.benefits.1': '修了証の自動発行',
  'usecases.tabs.certification.benefits.2': '不正行為防止機能',
  'usecases.tabs.certification.benefits.3': '受験者管理',
};

// styled-jsx の問題を回避するためのモック
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.__NEXT_DATA__ = {
    props: {},
    page: '/',
    query: {},
    buildId: 'development',
    nextExport: false,
    autoExport: false,
    isFallback: false,
    dynamicIds: [],
    err: undefined,
    gsp: false,
    gssp: false,
    customServer: false,
    gip: false,
    appGip: false,
  };
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: 'hsl(222.2 84% 4.9%)',
        },
      ],
    },
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },

  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
  },

  decorators: [
    withThemeByClassName({
      themes: {
        // nameOfTheme: 'classNameForTheme',
        light: '',
        dark: 'dark',
      },
      defaultTheme: 'light',
    }),
    Story => (
      <NextIntlClientProvider locale="ja" messages={messages}>
        <Story />
      </NextIntlClientProvider>
    ),
  ],
};

export default preview;
