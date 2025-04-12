
import {
  CheckSquare,
  FileText,
  AlignJustify,
  BookOpen,
  Clock,
  Sparkles
} from "lucide-react";
import { QuizTypeProps } from "@/types/quiz";

export const QUIZ_TYPES: QuizTypeProps[] = [
  {
    id: "simple-quiz",
    title: "シンプルクイズ",
    description: "基本的なクイズ形式で、マルバツ問題や選択問題などを含みます。",
    icon: <CheckSquare className="h-6 w-6" />,
    features: ["truefalse", "single", "multiple", "freetext"],
    featureInfo: {
      "truefalse": true,
      "single": true,
      "multiple": true,
      "freetext": true
    }
  },
  {
    id: "exam",
    title: "試験",
    description: "合格点設定や時間制限のある本格的な試験モード。",
    icon: <Clock className="h-6 w-6" />,
    features: ["passingScore", "analytics", "certificate", "timeLimit"],
    featureInfo: {
      "passingScore": true,
      "analytics": true,
      "certificate": true,
      "timeLimit": true
    }
  },
  {
    id: "survey",
    title: "アンケート",
    description: "正誤のない、意見や情報収集のためのフォーム。",
    icon: <AlignJustify className="h-6 w-6" />,
    features: ["freeAnswer", "choice", "matrix", "analytics"],
    featureInfo: {
      "freeAnswer": true,
      "choice": true,
      "matrix": true,
      "analytics": true
    }
  },
  {
    id: "assessment",
    title: "アセスメント",
    description: "より高度な評価のための複合的な問題セット。",
    icon: <FileText className="h-6 w-6" />,
    features: ["sections", "branching", "scoring", "reports"],
    featureInfo: {
      "sections": true,
      "branching": true,
      "scoring": true,
      "reports": true
    },
    proOnly: true,
  },
  {
    id: "course",
    title: "コース",
    description: "学習コンテンツとクイズを組み合わせた学習体験。",
    icon: <BookOpen className="h-6 w-6" />,
    features: ["lessons", "progress", "quizzes", "certificates"],
    featureInfo: {
      "lessons": true,
      "progress": true,
      "quizzes": true,
      "certificates": true
    },
    proOnly: true,
  },
  {
    id: "ai-quiz",
    title: "AI自動生成クイズ",
    description: "AIがトピックに基づいてクイズを自動生成します。",
    icon: <Sparkles className="h-6 w-6" />,
    features: ["autoGenerate", "customPrompt", "instant", "edit"],
    featureInfo: {
      "autoGenerate": true,
      "customPrompt": true,
      "instant": true,
      "edit": true
    },
    proOnly: true,
  }
];
