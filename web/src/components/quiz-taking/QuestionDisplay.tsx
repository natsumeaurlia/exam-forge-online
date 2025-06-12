'use client';

import { Question, QuestionOption } from '@prisma/client';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MediaDisplay } from '@/components/common/MediaDisplay';
import { useTranslations } from 'next-intl';

interface QuestionDisplayProps {
  question: Question & {
    options: QuestionOption[];
  };
  answer: any;
  onAnswer: (answer: any) => void;
}

export function QuestionDisplay({
  question,
  answer,
  onAnswer,
}: QuestionDisplayProps) {
  const t = useTranslations('QuizTaking');

  const renderQuestionContent = () => {
    switch (question.type) {
      case 'MULTIPLE_CHOICE':
        return (
          <RadioGroup
            value={answer || ''}
            onValueChange={value => onAnswer(value)}
          >
            <div className="space-y-3">
              {question.options.map(option => (
                <div key={option.id} className="flex items-start space-x-2">
                  <RadioGroupItem
                    value={option.id}
                    id={option.id}
                    className="mt-1"
                  />
                  <Label
                    htmlFor={option.id}
                    className="flex-1 cursor-pointer text-base"
                  >
                    {option.text}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        );

      case 'CHECKBOX':
        const selectedOptions = answer || [];
        return (
          <div className="space-y-3">
            {question.options.map(option => (
              <div key={option.id} className="flex items-start space-x-2">
                <Checkbox
                  id={option.id}
                  checked={selectedOptions.includes(option.id)}
                  onCheckedChange={checked => {
                    if (checked) {
                      onAnswer([...selectedOptions, option.id]);
                    } else {
                      onAnswer(
                        selectedOptions.filter((id: string) => id !== option.id)
                      );
                    }
                  }}
                  className="mt-1"
                />
                <Label
                  htmlFor={option.id}
                  className="flex-1 cursor-pointer text-base"
                >
                  {option.text}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'TRUE_FALSE':
        return (
          <RadioGroup
            value={answer || ''}
            onValueChange={value => onAnswer(value)}
          >
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="true" />
                <Label htmlFor="true" className="cursor-pointer text-base">
                  {t('true')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="false" />
                <Label htmlFor="false" className="cursor-pointer text-base">
                  {t('false')}
                </Label>
              </div>
            </div>
          </RadioGroup>
        );

      case 'SHORT_ANSWER':
        return (
          <Input
            value={answer || ''}
            onChange={e => onAnswer(e.target.value)}
            placeholder={t('enterAnswer')}
            className="max-w-md"
          />
        );

      case 'LONG_ANSWER':
        return (
          <Textarea
            value={answer || ''}
            onChange={e => onAnswer(e.target.value)}
            placeholder={t('enterAnswer')}
            rows={5}
            className="w-full"
          />
        );

      case 'NUMERIC':
        return (
          <Input
            type="number"
            value={answer || ''}
            onChange={e => onAnswer(e.target.value)}
            placeholder={t('enterNumber')}
            className="max-w-xs"
          />
        );

      case 'FILL_IN_BLANK':
        // Simple implementation for now - can be enhanced later
        const blanks = question.text.match(/___/g)?.length || 1;
        const answers = answer || Array(blanks).fill('');

        return (
          <div className="space-y-3">
            {Array.from({ length: blanks }, (_, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">
                  {t('blank')} {i + 1}:
                </span>
                <Input
                  value={answers[i] || ''}
                  onChange={e => {
                    const newAnswers = [...answers];
                    newAnswers[i] = e.target.value;
                    onAnswer(newAnswers);
                  }}
                  placeholder={t('enterAnswer')}
                  className="max-w-xs"
                />
              </div>
            ))}
          </div>
        );

      case 'MATCHING':
        const pairs = question.options.filter(opt => opt.isMatchingPair);
        const items = question.options.filter(opt => !opt.isMatchingPair);
        const matches = answer || {};

        return (
          <div className="space-y-4">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-4">
                <span className="min-w-[150px]">{item.text}</span>
                <select
                  value={matches[item.id] || ''}
                  onChange={e => {
                    onAnswer({
                      ...matches,
                      [item.id]: e.target.value,
                    });
                  }}
                  className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                >
                  <option value="">{t('selectMatch')}</option>
                  {pairs.map(pair => (
                    <option key={pair.id} value={pair.id}>
                      {pair.text}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        );

      case 'SORTING':
        const sortItems = answer || question.options.map(opt => opt.id);

        return (
          <div className="space-y-2">
            {sortItems.map((itemId: string, index: number) => {
              const option = question.options.find(opt => opt.id === itemId);
              if (!option) return null;

              return (
                <div
                  key={option.id}
                  className="flex items-center gap-2 rounded-md border p-3"
                >
                  <span className="font-semibold">{index + 1}.</span>
                  <span className="flex-1">{option.text}</span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (index > 0) {
                          const newOrder = [...sortItems];
                          [newOrder[index], newOrder[index - 1]] = [
                            newOrder[index - 1],
                            newOrder[index],
                          ];
                          onAnswer(newOrder);
                        }
                      }}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (index < sortItems.length - 1) {
                          const newOrder = [...sortItems];
                          [newOrder[index], newOrder[index + 1]] = [
                            newOrder[index + 1],
                            newOrder[index],
                          ];
                          onAnswer(newOrder);
                        }
                      }}
                      disabled={index === sortItems.length - 1}
                    >
                      ↓
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        );

      default:
        return (
          <p className="text-muted-foreground">
            {t('unsupportedQuestionType')}
          </p>
        );
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">
              {question.text}
              {question.required && (
                <span className="ml-1 text-red-500">*</span>
              )}
            </h2>
            {question.description && (
              <p className="text-muted-foreground">{question.description}</p>
            )}
          </div>

          {question.imageUrl && (
            <div className="my-4">
              <MediaDisplay
                url={question.imageUrl}
                type="image"
                className="max-w-full rounded-md"
              />
            </div>
          )}

          <div className="mt-6">{renderQuestionContent()}</div>

          {question.points && (
            <p className="text-muted-foreground mt-4 text-sm">
              {t('points', { points: question.points })}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
