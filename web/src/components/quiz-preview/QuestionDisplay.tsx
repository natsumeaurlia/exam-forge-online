"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useQuizPreviewStore } from "@/stores/useQuizPreviewStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Clock, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Question, QuestionOption, QuestionMedia, MediaType } from "@prisma/client";

interface QuestionDisplayProps {
  question: Question & {
    options: QuestionOption[];
    media: QuestionMedia[];
  };
  questionNumber: number;
  totalQuestions: number;
  timeLimit?: number;
}

export function QuestionDisplay({
  question,
  questionNumber,
  totalQuestions,
  timeLimit,
}: QuestionDisplayProps) {
  const t = useTranslations("quiz.preview");
  const { mockAnswers, submitAnswer } = useQuizPreviewStore();
  const [showHint, setShowHint] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<any>(
    mockAnswers[question.id] || null
  );

  useEffect(() => {
    setSelectedAnswer(mockAnswers[question.id] || null);
    setShowHint(false);
  }, [question.id, mockAnswers]);

  const handleAnswerChange = (value: any) => {
    setSelectedAnswer(value);
    submitAnswer(question.id, value);
  };

  const progress = (questionNumber / totalQuestions) * 100;

  const renderQuestionContent = () => {
    switch (question.type) {
      case "TRUE_FALSE":
        return (
          <RadioGroup
            value={selectedAnswer}
            onValueChange={handleAnswerChange}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id="true" />
              <Label htmlFor="true" className="cursor-pointer">
                {t("true")}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id="false" />
              <Label htmlFor="false" className="cursor-pointer">
                {t("false")}
              </Label>
            </div>
          </RadioGroup>
        );

      case "MULTIPLE_CHOICE":
        return (
          <RadioGroup
            value={selectedAnswer}
            onValueChange={handleAnswerChange}
            className="space-y-3"
          >
            {question.options?.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <RadioGroupItem value={option.id} id={option.id} />
                <Label htmlFor={option.id} className="cursor-pointer">
                  {option.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case "CHECKBOX":
        return (
          <div className="space-y-3">
            {question.options?.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={option.id}
                  checked={selectedAnswer?.includes(option.id) || false}
                  onCheckedChange={(checked) => {
                    const newAnswer = selectedAnswer || [];
                    if (checked) {
                      handleAnswerChange([...newAnswer, option.id]);
                    } else {
                      handleAnswerChange(
                        newAnswer.filter((id: string) => id !== option.id)
                      );
                    }
                  }}
                />
                <Label htmlFor={option.id} className="cursor-pointer">
                  {option.text}
                </Label>
              </div>
            ))}
          </div>
        );

      case "SHORT_ANSWER":
        return (
          <Textarea
            value={selectedAnswer || ""}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder={t("typeYourAnswer")}
            className="min-h-[100px]"
          />
        );

      default:
        return <div>{t("unsupportedQuestionType")}</div>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <Badge variant="outline">
            {t("question")} {questionNumber} / {totalQuestions}
          </Badge>
          {timeLimit && (
            <div className="flex items-center text-muted-foreground">
              <Clock className="h-4 w-4 mr-1" />
              <span className="text-sm">{t("timeRemaining")}: --:--</span>
            </div>
          )}
        </div>
        <Progress value={progress} className="mb-4" />
        <CardTitle className="text-lg">{question.text}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {question.media && question.media.length > 0 && (
          <div className="space-y-2">
            {question.media.map((media) => (
              <div key={media.id}>
                {media.type === "IMAGE" && (
                  <img
                    src={media.url}
                    alt=""
                    className="max-w-full h-auto rounded-lg"
                  />
                )}
                {media.type === "VIDEO" && (
                  <video controls className="max-w-full rounded-lg">
                    <source src={media.url} />
                  </video>
                )}
              </div>
            ))}
          </div>
        )}

        {renderQuestionContent()}

        {question.hint && (
          <div className="pt-4">
            {!showHint ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHint(true)}
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                {t("showHint")}
              </Button>
            ) : (
              <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
                <p className="font-medium">{t("hint")}:</p>
                <p>{question.hint}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}