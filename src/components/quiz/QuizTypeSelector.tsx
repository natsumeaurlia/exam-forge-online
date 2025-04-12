
import { useState } from "react";
import { 
  CheckSquare, 
  FileText, 
  AlignJustify, 
  BookOpen, 
  Check, 
  Clock 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

type QuizType = {
  id: string;
  title: string;
  description: string;
  icon: JSX.Element;
  features: string[];
  proOnly?: boolean;
};

const quizTypes: QuizType[] = [
  {
    id: "simple-quiz",
    title: "シンプルクイズ",
    description: "基本的なクイズ形式で、マルバツ問題や選択問題などを含みます。",
    icon: <CheckSquare className="h-6 w-6" />,
    features: ["マルバツ問題", "択一問題", "複数選択問題", "自由記述問題"],
  },
  {
    id: "exam",
    title: "試験",
    description: "合格点設定や時間制限のある本格的な試験モード。",
    icon: <Clock className="h-6 w-6" />,
    features: ["合格点設定", "詳細な分析", "証明書発行", "時間制限"],
  },
  {
    id: "survey",
    title: "アンケート",
    description: "正誤のない、意見や情報収集のためのフォーム。",
    icon: <AlignJustify className="h-6 w-6" />,
    features: ["自由回答形式", "選択形式", "マトリックス質問", "集計と分析"],
  },
  {
    id: "assessment",
    title: "アセスメント",
    description: "より高度な評価のための複合的な問題セット。",
    icon: <FileText className="h-6 w-6" />,
    features: ["セクション分け", "条件分岐", "複合採点", "詳細レポート"],
    proOnly: true,
  },
  {
    id: "course",
    title: "コース",
    description: "学習コンテンツとクイズを組み合わせた学習体験。",
    icon: <BookOpen className="h-6 w-6" />,
    features: ["レッスン構造", "学習進捗管理", "確認クイズ", "修了証発行"],
    proOnly: true,
  }
];

export function QuizTypeSelector({ onSelect }: { onSelect: (type: string) => void }) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  
  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    onSelect(typeId);
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">クイズタイプを選択</h2>
        <p className="text-gray-600">
          作成したいクイズのタイプを選択してください。目的に最適な形式が選べます。
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizTypes.map((type) => (
          <Card 
            key={type.id}
            className={`cursor-pointer transition-all hover:border-examforge-blue ${
              selectedType === type.id ? "border-2 border-examforge-blue shadow-md" : ""
            } ${type.proOnly ? "opacity-70" : ""}`}
            onClick={() => !type.proOnly && handleTypeSelect(type.id)}
          >
            <CardHeader className="pb-2">
              {type.proOnly && (
                <div className="absolute top-2 right-2">
                  <div className="bg-examforge-orange text-white text-xs font-bold px-2 py-1 rounded">
                    PRO
                  </div>
                </div>
              )}
              <div className="feature-icon-container">
                {type.icon}
              </div>
              <CardTitle className="text-lg">{type.title}</CardTitle>
              <CardDescription>{type.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {type.features.map((feature, index) => (
                  <li key={index} className="flex items-start text-sm">
                    <Check className="h-4 w-4 text-examforge-blue mr-2 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                variant={selectedType === type.id ? "default" : "outline"}
                className="w-full"
                disabled={type.proOnly}
              >
                {type.proOnly ? "プロプランで利用可能" : "このタイプを選択"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
