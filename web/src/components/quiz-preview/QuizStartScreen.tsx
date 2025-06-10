"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, Target } from "lucide-react";
import type { Quiz, Tag } from "@/types/quiz";

interface QuizStartScreenProps {
  quiz: Quiz & {
    questions?: { id: string }[];
    tags?: Tag[];
  };
  onStart: () => void;
}

export function QuizStartScreen({ quiz, onStart }: QuizStartScreenProps) {
  const t = useTranslations("quiz.preview");

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">{quiz.title}</CardTitle>
        <CardDescription className="text-base mt-2">
          {quiz.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("questions")}</p>
              <p className="font-semibold">{quiz.questions?.length || 0}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Target className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("passingScore")}</p>
              <p className="font-semibold">{quiz.passingScore}%</p>
            </div>
          </div>
          
          {quiz.timeLimit && (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("timeLimit")}</p>
                <p className="font-semibold">{quiz.timeLimit} {t("minutes")}</p>
              </div>
            </div>
          )}
        </div>
        
        {quiz.tags && quiz.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">{t("tags")}:</span>
            {quiz.tags.map((tag) => (
              <Badge key={tag.id} variant="secondary">
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
        
        <div className="pt-4">
          <Button onClick={onStart} className="w-full" size="lg">
            {t("startQuiz")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}