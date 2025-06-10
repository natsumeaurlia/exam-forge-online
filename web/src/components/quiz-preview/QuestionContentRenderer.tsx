import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { GripVertical } from 'lucide-react';
import type { Question, QuestionOption } from '@prisma/client';

interface QuestionContentRendererProps {
  question: Question & { options: QuestionOption[] };
  currentAnswer: any;
  onAnswerChange: (value: any) => void;
}

export function QuestionContentRenderer({
  question,
  currentAnswer,
  onAnswerChange,
}: QuestionContentRendererProps) {
  const t = useTranslations('quiz.preview');

  // Initialize state for SORTING question type
  const [sortingItems, setSortingItems] = useState<QuestionOption[]>([]);

  useEffect(() => {
    if (question.type === 'SORTING') {
      if (currentAnswer && Array.isArray(currentAnswer)) {
        // If we have a saved answer, use that order
        const orderedItems = currentAnswer
          .map(id => question.options.find(opt => opt.id === id))
          .filter(Boolean) as QuestionOption[];
        setSortingItems(orderedItems);
      } else {
        // Shuffle options for initial display
        const shuffled = [...question.options].sort(() => Math.random() - 0.5);
        setSortingItems(shuffled);
      }
    }
  }, [question.type, question.options, currentAnswer]);

  switch (question.type) {
    case 'TRUE_FALSE':
      return (
        <RadioGroup
          value={
            currentAnswer === true
              ? 'true'
              : currentAnswer === false
                ? 'false'
                : ''
          }
          onValueChange={value => onAnswerChange(value === 'true')}
          className="space-y-3"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="true" id="true" />
            <Label htmlFor="true" className="cursor-pointer">
              {t('true')}
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="false" id="false" />
            <Label htmlFor="false" className="cursor-pointer">
              {t('false')}
            </Label>
          </div>
        </RadioGroup>
      );

    case 'MULTIPLE_CHOICE':
      return (
        <RadioGroup
          value={(currentAnswer as string) || ''}
          onValueChange={value => onAnswerChange(value)}
          className="space-y-3"
        >
          {question.options?.map(option => (
            <div key={option.id} className="flex items-center space-x-2">
              <RadioGroupItem value={option.id} id={option.id} />
              <Label htmlFor={option.id} className="cursor-pointer">
                {option.text}
              </Label>
            </div>
          ))}
        </RadioGroup>
      );

    case 'CHECKBOX':
      const checkboxAnswer = (currentAnswer as string[]) || [];
      return (
        <div className="space-y-3">
          {question.options?.map(option => (
            <div key={option.id} className="flex items-center space-x-2">
              <Checkbox
                id={option.id}
                checked={checkboxAnswer.includes(option.id)}
                onCheckedChange={checked => {
                  if (checked) {
                    onAnswerChange([...checkboxAnswer, option.id]);
                  } else {
                    onAnswerChange(
                      checkboxAnswer.filter(id => id !== option.id)
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

    case 'SHORT_ANSWER':
      return (
        <Textarea
          value={(currentAnswer as string) || ''}
          onChange={e => onAnswerChange(e.target.value)}
          placeholder={t('typeYourAnswer')}
          className="min-h-[100px]"
        />
      );

    case 'NUMERIC':
      return (
        <Input
          type="number"
          value={(currentAnswer as string) || ''}
          onChange={e => onAnswerChange(e.target.value)}
          placeholder={t('enterNumber')}
          className="max-w-xs"
        />
      );

    case 'FILL_IN_BLANK':
      const fillInBlankAnswer = (currentAnswer as string[]) || [];
      const blanks = question.options || [];

      return (
        <div className="space-y-3">
          {blanks.map((blank, index) => (
            <div key={blank.id} className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">
                {t('blank')} {index + 1}:
              </span>
              <Input
                value={fillInBlankAnswer[index] || ''}
                onChange={e => {
                  const newAnswers = [...fillInBlankAnswer];
                  newAnswers[index] = e.target.value;
                  onAnswerChange(newAnswers);
                }}
                placeholder={t('typeYourAnswer')}
                className="flex-1"
              />
            </div>
          ))}
        </div>
      );

    case 'SORTING':
      const handleDragStart = (e: React.DragEvent, index: number) => {
        e.dataTransfer.setData('dragIndex', index.toString());
      };

      const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
      };

      const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        const dragIndex = parseInt(e.dataTransfer.getData('dragIndex'));
        const newItems = [...sortingItems];
        const [draggedItem] = newItems.splice(dragIndex, 1);
        newItems.splice(dropIndex, 0, draggedItem);
        setSortingItems(newItems);
        onAnswerChange(newItems.map(item => item.id));
      };

      return (
        <div className="space-y-2">
          {sortingItems.map((item, index) => (
            <div
              key={item.id}
              draggable
              onDragStart={e => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={e => handleDrop(e, index)}
              className="bg-card hover:bg-accent flex cursor-move items-center gap-2 rounded-lg border p-3 transition-colors"
            >
              <GripVertical className="text-muted-foreground h-4 w-4" />
              <span className="font-medium">{index + 1}.</span>
              <span className="flex-1">{item.text}</span>
            </div>
          ))}
        </div>
      );

    case 'MATCHING':
      const matchingAnswer = (currentAnswer as Record<string, string>) || {};
      const leftItems = question.options.filter((_, index) => index % 2 === 0);
      const rightItems = question.options.filter((_, index) => index % 2 === 1);

      return (
        <div className="space-y-4">
          {leftItems.map(leftItem => (
            <div key={leftItem.id} className="flex items-center gap-4">
              <div className="bg-card flex-1 rounded-lg border p-3">
                {leftItem.text}
              </div>
              <select
                value={matchingAnswer[leftItem.id] || ''}
                onChange={e => {
                  const newAnswer = { ...matchingAnswer };
                  if (e.target.value) {
                    newAnswer[leftItem.id] = e.target.value;
                  } else {
                    delete newAnswer[leftItem.id];
                  }
                  onAnswerChange(newAnswer);
                }}
                className="bg-background w-48 rounded-lg border p-2"
              >
                <option value="">{t('selectMatch')}</option>
                {rightItems.map(rightItem => (
                  <option key={rightItem.id} value={rightItem.id}>
                    {rightItem.text}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      );

    case 'DIAGRAM':
      // For diagram questions, we'll show clickable areas or input fields based on the question setup
      const diagramAnswer = (currentAnswer as Record<string, string>) || {};

      return (
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            {t('diagramInstructions')}
          </p>
          {question.options.map((option, index) => (
            <div key={option.id} className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {t('label')} {index + 1}:
              </span>
              <Input
                value={diagramAnswer[option.id] || ''}
                onChange={e => {
                  const newAnswer = { ...diagramAnswer };
                  newAnswer[option.id] = e.target.value;
                  onAnswerChange(newAnswer);
                }}
                placeholder={option.text || t('enterLabel')}
                className="flex-1"
              />
            </div>
          ))}
        </div>
      );

    default:
      return <div>{t('unsupportedQuestionType')}</div>;
  }
}
