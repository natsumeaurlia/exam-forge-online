
import { 
  Award,
  BarChartBig,
  FileStack,
  LayoutDashboard, 
  LockKeyhole, 
  MessageSquare,
  Timer,
  Upload
} from "lucide-react";

const features = [
  {
    icon: <LayoutDashboard className="h-6 w-6" />,
    title: "直感的なクイズビルダー",
    description: "ドラッグ＆ドロップで簡単に問題を作成・並び替え。プログラミング知識不要で誰でも使いこなせます。"
  },
  {
    icon: <FileStack className="h-6 w-6" />,
    title: "多彩な問題タイプ",
    description: "マルバツ、択一、複数選択、自由記述など、様々な問題形式に対応。プロプランではさらに高度な問題タイプも利用可能。"
  },
  {
    icon: <BarChartBig className="h-6 w-6" />,
    title: "詳細な分析レポート",
    description: "受験者の成績や問題ごとの正答率などを視覚的に確認。学習効果を最大化するためのインサイトを提供します。"
  },
  {
    icon: <Timer className="h-6 w-6" />,
    title: "自動採点システム",
    description: "選択問題や指定回答の自動採点で、結果をすぐに確認。手動採点モードでより柔軟な評価も可能です。"
  },
  {
    icon: <Upload className="h-6 w-6" />,
    title: "Excel/CSV連携",
    description: "既存の問題をExcelやCSVから一括インポート。大量の問題も効率的に登録できます。（プロプラン）"
  },
  {
    icon: <Award className="h-6 w-6" />,
    title: "合格証発行機能",
    description: "カスタマイズ可能な合格証を自動生成し、PDFでダウンロードや受験者への自動送信が可能です。（プロプラン）"
  },
  {
    icon: <LockKeyhole className="h-6 w-6" />,
    title: "セキュリティ対策",
    description: "パスワード保護やアクセス制限機能で、大切な試験コンテンツを安全に管理できます。"
  },
  {
    icon: <MessageSquare className="h-6 w-6" />,
    title: "フィードバック機能",
    description: "問題ごとの解説や採点時のコメント機能で、学習者の理解度向上をサポートします。"
  }
];

export function Features() {
  return (
    <div id="features" className="py-24 bg-examforge-gray-light">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-4">
            簡単な操作で<span className="heading-gradient">プロ品質</span>の試験を作成
          </h2>
          <p className="text-lg text-gray-600">
            ExamForgeが提供する多彩な機能で、あらゆるタイプのクイズや試験を効率的に作成・管理・分析できます。
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="feature-icon-container">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
