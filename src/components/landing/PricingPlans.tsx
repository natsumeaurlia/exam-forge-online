
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

const plans = [
  {
    name: "フリープラン",
    price: "¥0",
    period: "永久無料",
    description: "個人や小規模チームに最適",
    features: [
      "クイズ作成数: 5件まで",
      "メンバー数: 最大3人",
      "問題数: クイズあたり20問まで",
      "回答上限: クイズあたり月100回まで",
      "ストレージ: 100MB",
      "マルバツ問題",
      "指定択一問題",
      "複数選択問題",
      "自由記述問題",
      "自動採点",
      "手動採点",
      "パスワード保護",
    ],
    notIncluded: [
      "カスタムサブドメイン",
      "メディア埋め込み",
      "問題バンク",
      "高度な問題タイプ",
      "詳細な分析",
      "セクション分け"
    ],
    color: "examforge-blue",
    popular: false
  },
  {
    name: "プロプラン",
    price: "¥2,980",
    period: "月額/テナント",
    description: "教育機関や企業に最適",
    features: [
      "クイズ作成数: 無制限",
      "メンバー数: 最大20人",
      "問題数: クイズあたり200問まで",
      "回答上限: クイズあたり月3,000回まで",
      "ストレージ: 10GB",
      "マルバツ問題",
      "指定択一問題",
      "複数選択問題",
      "自由記述問題",
      "自動採点",
      "手動採点",
      "パスワード保護",
      "カスタムサブドメイン",
      "メディア埋め込み",
      "問題バンク",
      "高度な問題タイプ",
      "詳細な分析",
      "セクション分け",
      "合格証発行",
      "Excel/CSV連携",
      "チーム作成",
      "デザインカスタマイズ",
    ],
    notIncluded: [
      "高度な権限管理",
      "監査ログ",
      "SLA保証"
    ],
    color: "examforge-orange",
    popular: true
  },
  {
    name: "エンタープライズ",
    price: "要問合せ",
    period: "カスタムプラン",
    description: "大規模組織・教育機関向け",
    features: [
      "クイズ作成数: 無制限",
      "メンバー数: 無制限",
      "問題数: 無制限",
      "回答上限: 無制限",
      "ストレージ: 無制限",
      "プロプランのすべての機能",
      "高度な権限管理",
      "監査ログ",
      "SLA保証",
      "カスタム開発",
      "オンプレミス対応",
      "専任サポート担当者",
    ],
    notIncluded: [],
    color: "examforge-blue-dark",
    popular: false
  }
];

export function PricingPlans() {
  return (
    <div id="pricing" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-4">
            シンプルな<span className="heading-gradient">料金プラン</span>
          </h2>
          <p className="text-lg text-gray-600">
            ニーズに合わせて選べる3つのプラン。成長に合わせてアップグレード可能です。
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`bg-white rounded-xl border-2 ${
                plan.popular 
                  ? `border-examforge-${plan.color} shadow-lg` 
                  : 'border-gray-200'
              } p-6 flex flex-col relative`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-examforge-orange text-white text-xs font-bold py-1 px-3 rounded-bl-lg rounded-tr-lg">
                  人気
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-end mb-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-500 ml-2">{plan.period}</span>
                </div>
                <p className="text-gray-600 text-sm">{plan.description}</p>
              </div>
              
              <div className="mb-8 flex-1">
                <div className="border-t pt-4 mb-4">
                  <span className="font-semibold">含まれる機能:</span>
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className={`h-5 w-5 text-examforge-${plan.color} mr-2 shrink-0 mt-0.5`} />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                  {plan.notIncluded.map((feature, featureIndex) => (
                    <li key={`not-${featureIndex}`} className="flex items-start text-gray-400">
                      <X className="h-5 w-5 mr-2 shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <Button 
                className={`w-full ${
                  plan.popular 
                    ? `bg-examforge-${plan.color} hover:bg-examforge-${plan.color}/90` 
                    : ''
                }`}
                variant={plan.name === "エンタープライズ" ? "outline" : "default"}
              >
                {plan.name === "フリープラン" ? "無料で始める" : 
                 plan.name === "プロプラン" ? "アップグレード" : "お問い合わせ"}
              </Button>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-gray-500">
            すべてのプランに30日間の返金保証付き。不明点は
            <a href="#" className="text-examforge-blue font-medium">お問い合わせ</a>
            ください。
          </p>
        </div>
      </div>
    </div>
  );
}
