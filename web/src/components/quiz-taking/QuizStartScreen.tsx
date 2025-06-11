'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, FileQuestion, Lock } from 'lucide-react';
import type { Quiz } from '@prisma/client';

interface QuizStartScreenProps {
  quiz: Quiz & { team: { name: string } };
  lng: string;
  requiresPassword: boolean;
  password: string;
  passwordError: boolean;
  participantInfo: {
    name: string;
    email: string;
  };
  error: string | null;
  onPasswordChange: (password: string) => void;
  onParticipantInfoChange: (info: { name: string; email: string }) => void;
  onStart: () => void;
}

export function QuizStartScreen({
  quiz,
  lng,
  requiresPassword,
  password,
  passwordError,
  participantInfo,
  error,
  onPasswordChange,
  onParticipantInfoChange,
  onStart,
}: QuizStartScreenProps) {
  const t = useTranslations('quiz.taking');

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Card className="p-8">
        {/* Quiz Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold">{quiz.title}</h1>
          {quiz.description && (
            <p className="mb-4 text-gray-600">{quiz.description}</p>
          )}
          <p className="text-sm text-gray-500">
            {t('createdBy', { teamName: quiz.team.name })}
          </p>
        </div>

        {/* Quiz Info */}
        <div className="mb-8 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-gray-600">
            <FileQuestion className="h-5 w-5" />
            <span>
              {t('questionCount', { count: quiz.questions?.length || 0 })}
            </span>
          </div>
          {quiz.timeLimit && (
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-5 w-5" />
              <span>{t('timeLimit', { minutes: quiz.timeLimit })}</span>
            </div>
          )}
        </div>

        {/* Password Input */}
        {requiresPassword && (
          <div className="mb-6">
            <Label htmlFor="password" className="mb-2 flex items-center gap-2">
              <Lock className="h-4 w-4" />
              {t('passwordRequired')}
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => onPasswordChange(e.target.value)}
              placeholder={t('enterPassword')}
              className={passwordError ? 'border-red-500' : ''}
            />
            {passwordError && (
              <p className="mt-1 text-sm text-red-500">
                {t('incorrectPassword')}
              </p>
            )}
          </div>
        )}

        {/* Participant Info */}
        {quiz.collectParticipantInfo && (
          <div className="mb-6 space-y-4">
            <h3 className="font-semibold">{t('participantInfo')}</h3>
            <div>
              <Label htmlFor="name">{t('name')}</Label>
              <Input
                id="name"
                type="text"
                value={participantInfo.name}
                onChange={e =>
                  onParticipantInfoChange({
                    ...participantInfo,
                    name: e.target.value,
                  })
                }
                placeholder={t('enterName')}
              />
            </div>
            <div>
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                value={participantInfo.email}
                onChange={e =>
                  onParticipantInfoChange({
                    ...participantInfo,
                    email: e.target.value,
                  })
                }
                placeholder={t('enterEmail')}
              />
            </div>
          </div>
        )}

        {/* Instructions */}
        {quiz.instructions && (
          <div className="mb-6 rounded-lg bg-blue-50 p-4">
            <h3 className="mb-2 font-semibold">{t('instructions')}</h3>
            <p className="text-sm whitespace-pre-wrap">{quiz.instructions}</p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Start Button */}
        <Button onClick={onStart} className="w-full" size="lg">
          {t('startQuiz')}
        </Button>

        {/* Additional Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>{t('quizInfo')}</p>
          {quiz.allowMultipleAttempts && <p>{t('multipleAttemptsAllowed')}</p>}
          {quiz.showCorrectAnswers && <p>{t('answersShownAfter')}</p>}
        </div>
      </Card>
    </div>
  );
}
