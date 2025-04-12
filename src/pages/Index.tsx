
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
import { Footer } from "@/components/layout/Footer";
import { useTranslation } from "react-i18next";

type AppView = "landing" | "create-quiz" | "create-question";

const Index = () => {
  const { t } = useTranslation();
  const [view, setView] = useState<AppView>("landing");
  const [selectedQuizType, setSelectedQuizType] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question> | undefined>(undefined);
  
  const handleQuizTypeSelect = (type: string) => {
    setSelectedQuizType(type);
    toast({
      title: t("quiz.selector.title"),
      description: t(`quiz.types.${type}.title`),
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
              {t("quiz.demo.backToHome")}
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
              {t("quiz.demo.backToQuiz")}
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
                {t("quiz.demo.try")}
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
      <Footer />
    </div>
  );
};

export default Index;
