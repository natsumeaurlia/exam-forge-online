
import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { PricingPlans } from "@/components/landing/PricingPlans";
import { CallToAction } from "@/components/landing/CallToAction";
import { QuizTypeSelector } from "@/components/quiz/QuizTypeSelector";
import { QuestionForm, Question } from "@/components/quiz/QuestionForm";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

type AppView = "landing" | "create-quiz" | "create-question";

const Index = () => {
  const [view, setView] = useState<AppView>("landing");
  const [selectedQuizType, setSelectedQuizType] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question> | undefined>(undefined);
  
  const handleQuizTypeSelect = (type: string) => {
    setSelectedQuizType(type);
    toast({
      title: "クイズタイプを選択しました",
      description: `「${type === 'simple-quiz' ? 'シンプルクイズ' : 
                      type === 'exam' ? '試験' : 
                      type === 'survey' ? 'アンケート' : 
                      ''}」を作成します。`,
    });
    setView("create-question");
  };
  
  const handleQuestionSave = (question: Question) => {
    const isEdit = questions.some(q => q.id === question.id);
    
    if (isEdit) {
      setQuestions(questions.map(q => q.id === question.id ? question : q));
      toast({
        title: "問題を更新しました",
        description: "クイズの問題が正常に更新されました。",
      });
    } else {
      setQuestions([...questions, question]);
      toast({
        title: "問題を追加しました",
        description: "新しい問題がクイズに追加されました。",
      });
    }
    
    setCurrentQuestion(undefined);
    // 実際のアプリではここで問題作成画面に戻る処理を追加
  };

  const renderView = () => {
    switch (view) {
      case "create-quiz":
        return (
          <div className="container mx-auto px-4 py-8">
            <Button 
              variant="ghost" 
              className="mb-6 flex items-center gap-2"
              onClick={() => setView("landing")}
            >
              <ArrowLeft className="h-4 w-4" />
              ホームに戻る
            </Button>
            
            <QuizTypeSelector onSelect={handleQuizTypeSelect} />
          </div>
        );
        
      case "create-question":
        return (
          <div className="container mx-auto px-4 py-8">
            <Button 
              variant="ghost" 
              className="mb-6 flex items-center gap-2"
              onClick={() => setView("create-quiz")}
            >
              <ArrowLeft className="h-4 w-4" />
              クイズタイプ選択に戻る
            </Button>
            
            <div className="max-w-3xl mx-auto">
              <QuestionForm
                question={currentQuestion}
                onSave={handleQuestionSave}
                onCancel={() => {
                  setCurrentQuestion(undefined);
                  // 実際のアプリではここで問題一覧画面に戻る処理を追加
                  setView("landing"); // デモ用に一時的にホームに戻る
                }}
              />
            </div>
          </div>
        );
        
      default: // landing
        return (
          <>
            <Hero />
            <Features />
            <PricingPlans />
            <CallToAction />
            
            {/* デモ用のボタン */}
            <div className="bg-white py-12 text-center">
              <Button 
                size="lg" 
                onClick={() => setView("create-quiz")}
                className="bg-examforge-blue hover:bg-examforge-blue-dark"
              >
                クイズ作成デモを試す
              </Button>
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {renderView()}
      </main>
      
      <footer className="bg-gray-50 py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-8 md:mb-0">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-examforge-blue to-examforge-blue-dark flex items-center justify-center text-white font-bold">
                  E
                </div>
                <span className="text-lg font-bold">ExamForge</span>
              </div>
              <p className="text-gray-600 max-w-md">
                教育機関や企業向けのシンプルで使いやすいオンラインクイズ・試験作成プラットフォーム。
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="font-medium mb-4">製品</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-600 hover:text-examforge-blue text-sm">機能</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-examforge-blue text-sm">料金プラン</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-examforge-blue text-sm">よくある質問</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium mb-4">会社情報</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-600 hover:text-examforge-blue text-sm">会社概要</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-examforge-blue text-sm">お問い合わせ</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-examforge-blue text-sm">採用情報</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium mb-4">リソース</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-600 hover:text-examforge-blue text-sm">サポート</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-examforge-blue text-sm">ブログ</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-examforge-blue text-sm">開発者向け</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-500 text-sm mb-4 md:mb-0">
                © 2025 ExamForge Inc. All rights reserved.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-gray-500 hover:text-examforge-blue">利用規約</a>
                <a href="#" className="text-gray-500 hover:text-examforge-blue">プライバシーポリシー</a>
                <a href="#" className="text-gray-500 hover:text-examforge-blue">特定商取引法に基づく表記</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
