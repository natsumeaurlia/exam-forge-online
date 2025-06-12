'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Quiz } from '@prisma/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, FileQuestion, Shield } from 'lucide-react';

interface QuizStartScreenProps {
  quiz: Quiz & {
    questions: any[];
    team: {
      name: string;
    } | null;
  };
  onStart: (info?: { name?: string; email?: string }) => void;
  requiresPassword?: boolean;
  onPasswordVerified?: () => void;
  isPublic?: boolean;
}

export function QuizStartScreen({
  quiz,
  onStart,
  requiresPassword = false,
  onPasswordVerified,
  isPublic = false,
}: QuizStartScreenProps) {
  const t = useTranslations('QuizTaking');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [participantName, setParticipantName] = useState('');
  const [participantEmail, setParticipantEmail] = useState('');

  const handlePasswordSubmit = async () => {
    try {
      const response = await fetch(`/api/quiz/${quiz.id}/verify-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordError(false);
        onPasswordVerified?.();
      } else {
        setPasswordError(true);
      }
    } catch (error) {
      console.error('Password verification error:', error);
      setPasswordError(true);
    }
  };

  const handleStart = () => {
    const info =
      isPublic &&
      (quiz.collectParticipantInfo || participantName || participantEmail)
        ? { name: participantName, email: participantEmail }
        : undefined;
    onStart(info);
  };

  if (requiresPassword && quiz.password) {
    return (
      <div className="container mx-auto max-w-md p-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('passwordRequired')}
            </CardTitle>
            <CardDescription>{t('passwordDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t('password')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={t('enterPassword')}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handlePasswordSubmit();
                  }
                }}
              />
            </div>
            {passwordError && (
              <Alert variant="destructive">
                <AlertDescription>{t('incorrectPassword')}</AlertDescription>
              </Alert>
            )}
            <Button onClick={handlePasswordSubmit} className="w-full">
              {t('continue')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl p-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{quiz.title}</CardTitle>
          {quiz.description && (
            <CardDescription className="mt-2 text-lg">
              {quiz.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3">
              <FileQuestion className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-sm font-medium">{t('questions')}</p>
                <p className="text-2xl font-bold">{quiz.questions.length}</p>
              </div>
            </div>
            {quiz.timeLimit && (
              <div className="flex items-center gap-3">
                <Clock className="text-muted-foreground h-5 w-5" />
                <div>
                  <p className="text-sm font-medium">{t('timeLimit')}</p>
                  <p className="text-2xl font-bold">
                    {quiz.timeLimit} {t('minutes')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {isPublic && quiz.collectParticipantInfo && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('participantInfo')}</h3>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    {t('name')} {quiz.requireParticipantInfo && '*'}
                  </Label>
                  <Input
                    id="name"
                    value={participantName}
                    onChange={e => setParticipantName(e.target.value)}
                    placeholder={t('enterName')}
                    required={quiz.requireParticipantInfo}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">
                    {t('email')} {quiz.requireParticipantInfo && '*'}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={participantEmail}
                    onChange={e => setParticipantEmail(e.target.value)}
                    placeholder={t('enterEmail')}
                    required={quiz.requireParticipantInfo}
                  />
                </div>
              </div>
            </div>
          )}

          <Alert>
            <AlertDescription>
              {quiz.showCorrectAnswers
                ? t('showCorrectAnswersInfo')
                : t('hideCorrectAnswersInfo')}
            </AlertDescription>
          </Alert>

          {quiz.team && (
            <p className="text-muted-foreground text-sm">
              {t('createdBy', { teamName: quiz.team.name })}
            </p>
          )}

          <Button
            onClick={handleStart}
            size="lg"
            className="w-full"
            disabled={
              isPublic &&
              quiz.collectParticipantInfo &&
              quiz.requireParticipantInfo &&
              (!participantName || !participantEmail)
            }
          >
            {t('startQuiz')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
