"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useQuizPreviewStore } from "@/stores/useQuizPreviewStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Monitor, Smartphone, ExternalLink } from "lucide-react";

interface QuizPreviewHeaderProps {
  quizId: string;
  lng: string;
}

export function QuizPreviewHeader({ quizId, lng }: QuizPreviewHeaderProps) {
  const t = useTranslations("quiz.preview");
  const { deviceMode, setDeviceMode } = useQuizPreviewStore();

  return (
    <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href={`/${lng}/dashboard/quizzes/${quizId}/edit`}>
              <Button variant="ghost" size="sm" className="px-2 sm:px-4">
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{t("backToEdit")}</span>
              </Button>
            </Link>
            
            <Badge variant="secondary" className="text-xs sm:text-sm">
              {t("previewMode")}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5 sm:p-1">
              <Button
                variant={deviceMode === "desktop" ? "default" : "ghost"}
                size="sm"
                onClick={() => setDeviceMode("desktop")}
                className="h-7 sm:h-8 px-2 sm:px-3"
              >
                <Monitor className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                <span className="ml-1.5 hidden lg:inline">{t("desktop")}</span>
              </Button>
              <Button
                variant={deviceMode === "mobile" ? "default" : "ghost"}
                size="sm"
                onClick={() => setDeviceMode("mobile")}
                className="h-7 sm:h-8 px-2 sm:px-3"
              >
                <Smartphone className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                <span className="ml-1.5 hidden lg:inline">{t("mobile")}</span>
              </Button>
            </div>
            
            <Link href={`/${lng}/quizzes/${quizId}/preview`} className="hidden sm:block">
              <Button variant="outline" size="sm">
                {t("detailedPreview")}
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}