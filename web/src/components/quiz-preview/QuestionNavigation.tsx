"use client";

import { useTranslations } from "next-intl";
import { useQuizPreviewStore } from "@/stores/useQuizPreviewStore";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Send } from "lucide-react";

interface QuestionNavigationProps {
  currentIndex: number;
  totalQuestions: number;
  onComplete: () => void;
}

export function QuestionNavigation({
  currentIndex,
  totalQuestions,
  onComplete,
}: QuestionNavigationProps) {
  const t = useTranslations("quiz.preview");
  const { goToPreviousQuestion, goToNextQuestion, navigateToQuestion } =
    useQuizPreviewStore();

  const isFirstQuestion = currentIndex === 0;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <Button
        variant="outline"
        onClick={goToPreviousQuestion}
        disabled={isFirstQuestion}
        className="w-full sm:w-auto"
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        {t("previous")}
      </Button>

      <div className="flex gap-1 flex-wrap justify-center">
        {Array.from({ length: totalQuestions }, (_, i) => (
          <Button
            key={i}
            variant={i === currentIndex ? "default" : "outline"}
            size="sm"
            onClick={() => navigateToQuestion(i)}
            className="h-8 w-8 p-0"
          >
            {i + 1}
          </Button>
        ))}
      </div>

      {!isLastQuestion ? (
        <Button
          onClick={() => goToNextQuestion(totalQuestions)}
          className="w-full sm:w-auto"
        >
          {t("next")}
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      ) : (
        <Button
          onClick={onComplete}
          variant="default"
          className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
        >
          <Send className="h-4 w-4 mr-2" />
          {t("submit")}
        </Button>
      )}
    </div>
  );
}