"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuizPreviewStore } from "@/stores/useQuizPreviewStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ParticipantFormProps {
  onSubmit: () => void;
}

export function ParticipantForm({ onSubmit }: ParticipantFormProps) {
  const t = useTranslations("quiz.preview");
  const { setParticipantInfo } = useQuizPreviewStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setParticipantInfo({ name, email });
    onSubmit();
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{t("participantInfo.title")}</CardTitle>
        <CardDescription>
          {t("participantInfo.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("participantInfo.name")}</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("participantInfo.namePlaceholder")}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">{t("participantInfo.email")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("participantInfo.emailPlaceholder")}
              required
            />
          </div>
          
          <Button type="submit" className="w-full">
            {t("startQuiz")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}