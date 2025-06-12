'use client';

import { useTranslations } from 'next-intl';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MediaDisplay } from '@/components/common/MediaDisplay';
import type { Question, QuestionOption, QuestionMedia } from '@prisma/client';

interface QuestionDisplayProps {
  question: Question & {
    options: QuestionOption[];
    media: QuestionMedia[];
  };
  answer: any;
  onAnswer: (answer: any) => void;
  lng: string;
}

export function QuestionDisplay({
  question,
  answer,
  onAnswer,
  lng,
}: QuestionDisplayProps) {
  const t = useTranslations('quiz.taking');

  const renderQuestionContent = () => {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="mb-2 text-xl font-semibold">
            {question.text}
            {question.isRequired && (
              <span className="ml-1 text-red-500">*</span>
            )}
          </h2>
          {question.explanation && (
            <p className="text-sm text-gray-600">{question.explanation}</p>
          )}
        </div>

        {/* Media Display */}
        {question.media.length > 0 && (
          <MediaDisplay
            media={question.media.map(m => ({
              id: m.id,
              url: m.url,
              type: m.type,
            }))}
            mode="gallery"
          />
        )}
      </div>
    );
  };

  const renderAnswerInput = () => {
    switch (question.type) {
      case 'MULTIPLE_CHOICE':
        return (
          <RadioGroup
            value={answer || ''}
            onValueChange={onAnswer}
            className="space-y-3"
          >
            {question.options.map(option => (
              <div key={option.id} className="flex items-start space-x-3">
                <RadioGroupItem value={option.id} id={option.id} />
                <Label htmlFor={option.id} className="cursor-pointer">
                  {option.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'CHECKBOX':
        const selectedOptions = answer || [];
        return (
          <div className="space-y-3">
            {question.options.map(option => (
              <div key={option.id} className="flex items-start space-x-3">
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
                />
                <Label htmlFor={option.id} className="cursor-pointer">
                  {option.text}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'TRUE_FALSE':
        return (
          <RadioGroup
            value={answer?.toString() || ''}
            onValueChange={value => onAnswer(value === 'true')}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="true" id="true" />
              <Label htmlFor="true" className="cursor-pointer">
                {t('true')}
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="false" id="false" />
              <Label htmlFor="false" className="cursor-pointer">
                {t('false')}
              </Label>
            </div>
          </RadioGroup>
        );

      case 'SHORT_ANSWER':
        return (
          <Textarea
            value={answer || ''}
            onChange={e => onAnswer(e.target.value)}
            placeholder={t('typeYourAnswer')}
            className="min-h-[100px]"
          />
        );

      case 'NUMERIC':
        return (
          <Input
            type="number"
            value={answer || ''}
            onChange={e =>
              onAnswer(e.target.value ? parseFloat(e.target.value) : null)
            }
            placeholder={t('enterNumber')}
            step="any"
          />
        );

      case 'FILL_IN_BLANK':
        // Parse question text for blanks
        const parts = question.text.split(/___+/);
        const blanks = answer || [];

        return (
          <div className="space-y-4">
            {parts.map((part, index) => (
              <div key={index} className="flex flex-wrap items-center gap-2">
                <span>{part}</span>
                {index < parts.length - 1 && (
                  <Input
                    className="inline-block w-32"
                    value={blanks[index] || ''}
                    onChange={e => {
                      const newBlanks = [...blanks];
                      newBlanks[index] = e.target.value;
                      onAnswer(newBlanks);
                    }}
                    placeholder={`${t('blank')} ${index + 1}`}
                  />
                )}
              </div>
            ))}
          </div>
        );

      case 'MATCHING':
        // For MATCHING questions, we need to store pairs in options
        // Split options into left and right pairs based on order
        const halfLength = Math.ceil(question.options.length / 2);
        const leftOptions = question.options.slice(0, halfLength);
        const rightOptions = question.options.slice(halfLength);
        const pairs = leftOptions.map((opt, index) => ({
          left: opt.text,
          right: rightOptions[index]?.text || '',
        }));
        const matches = answer || {};

        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">{t('items')}</h4>
              {pairs.map((pair: any, index: number) => (
                <div key={index} className="rounded bg-gray-100 p-2">
                  {pair.left}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">{t('matches')}</h4>
              {pairs.map((pair: any, index: number) => (
                <select
                  key={index}
                  value={matches[index] || ''}
                  onChange={e => {
                    const newMatches = { ...matches };
                    newMatches[index] = e.target.value;
                    onAnswer(newMatches);
                  }}
                  className="w-full rounded border p-2"
                >
                  <option value="">{t('selectMatch')}</option>
                  {pairs.map((p: any, i: number) => (
                    <option key={i} value={i}>
                      {p.right}
                    </option>
                  ))}
                </select>
              ))}
            </div>
          </div>
        );

      case 'SORTING':
        // For SORTING questions, use options as items to sort
        const items = question.options.map(opt => opt.text);
        const sortedItems = answer || [...items];

        return (
          <div className="space-y-2">
            {sortedItems.map((item: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex flex-col gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (index > 0) {
                        const newItems = [...sortedItems];
                        [newItems[index], newItems[index - 1]] = [
                          newItems[index - 1],
                          newItems[index],
                        ];
                        onAnswer(newItems);
                      }
                    }}
                    disabled={index === 0}
                  >
                    ↑
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (index < sortedItems.length - 1) {
                        const newItems = [...sortedItems];
                        [newItems[index], newItems[index + 1]] = [
                          newItems[index + 1],
                          newItems[index],
                        ];
                        onAnswer(newItems);
                      }
                    }}
                    disabled={index === sortedItems.length - 1}
                  >
                    ↓
                  </Button>
                </div>
                <div className="flex-1 rounded bg-gray-100 p-2">{item}</div>
              </div>
            ))}
          </div>
        );

      default:
        return <p className="text-gray-500">{t('unsupportedQuestionType')}</p>;
    }
  };

  return (
    <div className="space-y-6">
      {renderQuestionContent()}
      <div className="pt-4">{renderAnswerInput()}</div>
    </div>
  );
}
