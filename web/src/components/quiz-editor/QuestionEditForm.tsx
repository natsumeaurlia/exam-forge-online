'use client';

import {
  QuestionType,
  Question,
  QuestionOption,
  MediaType,
} from '@prisma/client';
import { TrueFalseForm } from './QuestionTypeForm/TrueFalseForm';
import { MultipleChoiceForm } from './QuestionTypeForm/MultipleChoiceForm';
import { CheckboxForm } from './QuestionTypeForm/CheckboxForm';
import { ShortAnswerForm } from './QuestionTypeForm/ShortAnswerForm';
import { SortingForm } from './QuestionTypeForm/SortingForm';
import { FillInBlankForm } from './QuestionTypeForm/FillInBlankForm';
import { DiagramForm } from './QuestionTypeForm/DiagramForm';
import { MatchingForm } from './QuestionTypeForm/MatchingForm';
import { NumericForm } from './QuestionTypeForm/NumericForm';
import { QuestionWithMedia } from './QuestionWithMedia';
import { useQuizEditorStore } from '@/stores/useQuizEditorStore';

interface MediaItem {
  id: string;
  url: string;
  type: MediaType;
  fileName: string;
  fileSize: number;
  mimeType: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  questionId: string;
}

type QuestionWithOptions = Question & {
  options: QuestionOption[];
  media?: MediaItem[];
};

type QuestionUpdate = Partial<Question> & {
  options?: QuestionOption[];
  media?: MediaItem[];
};

interface QuestionEditFormProps {
  questionIndex: number;
}

export function QuestionEditForm({ questionIndex }: QuestionEditFormProps) {
  const { questions, updateQuestion, quiz } = useQuizEditorStore();
  const question = questions[questionIndex];

  if (!question || !quiz) return null;

  const handleChange = (updates: Record<string, unknown>) => {
    // Convert form data back to Prisma format based on question type
    let convertedUpdates = { ...updates };

    switch (question.type) {
      case QuestionType.SORTING:
        if ('items' in updates && Array.isArray(updates.items)) {
          // Convert SortingItem array to string array
          const items = updates.items as Array<{ text: string; order: number }>;
          convertedUpdates.correctAnswer = items
            .sort((a, b) => a.order - b.order)
            .map(item => item.text);
          delete convertedUpdates.items;
        }
        break;

      case QuestionType.FILL_IN_BLANK:
        if ('blanks' in updates && Array.isArray(updates.blanks)) {
          // Convert Blank array to Record<string, string>
          const blanks = updates.blanks as Array<{
            id: string;
            answer: string;
          }>;
          const blankRecord: Record<string, string> = {};
          blanks.forEach((blank, index) => {
            blankRecord[`blank_${index + 1}`] = blank.answer;
          });
          convertedUpdates.correctAnswer = blankRecord;
          delete convertedUpdates.blanks;
        }
        break;

      case QuestionType.DIAGRAM:
        if ('hotSpots' in updates && Array.isArray(updates.hotSpots)) {
          // Find the correct hotspot and convert to schema format
          const hotSpots = updates.hotSpots as Array<{
            x: number;
            y: number;
            label: string;
            isCorrect: boolean;
          }>;
          const correctHotSpot = hotSpots.find(hs => hs.isCorrect);
          if (correctHotSpot) {
            convertedUpdates.correctAnswer = {
              x: correctHotSpot.x,
              y: correctHotSpot.y,
              label: correctHotSpot.label,
            };
          }
          delete convertedUpdates.hotSpots;
        }
        if ('imageUrl' in updates) {
          // For diagram questions, we need to handle image as media
          // This will be handled separately through the media upload system
          delete convertedUpdates.imageUrl;
        }
        break;

      case QuestionType.MATCHING:
        if ('pairs' in updates && Array.isArray(updates.pairs)) {
          // Convert MatchingPair array to Record<string, string>
          const pairs = updates.pairs as Array<{ left: string; right: string }>;
          const pairRecord: Record<string, string> = {};
          pairs.forEach(pair => {
            pairRecord[pair.left] = pair.right;
          });
          convertedUpdates.correctAnswer = pairRecord;
          delete convertedUpdates.pairs;
        }
        break;
    }

    updateQuestion(questionIndex, convertedUpdates as QuestionUpdate);
  };

  const handleMediaChange = (
    media: Array<{
      id: string;
      url: string;
      type: 'IMAGE' | 'VIDEO';
      fileName: string;
      fileSize: number;
      mimeType: string;
      order: number;
    }>
  ) => {
    // Convert to full MediaItem type for store
    const fullMedia: MediaItem[] = media.map(m => ({
      ...m,
      type: m.type as MediaType,
      createdAt: new Date(),
      updatedAt: new Date(),
      questionId: question.id,
    }));
    updateQuestion(questionIndex, { media: fullMedia });
  };

  const isAutoGrading = quiz?.scoringType === 'AUTO';

  // Adapter functions to convert between Prisma types and form component types
  const adaptTrueFalseQuestion = () => ({
    text: question.text,
    correctAnswer: (question.correctAnswer as boolean) ?? false,
    points: question.points,
    hint: question.hint ?? undefined,
    explanation: question.explanation ?? undefined,
  });

  const adaptMultipleChoiceQuestion = () => ({
    text: question.text,
    options: question.options.map(opt => ({
      id: opt.id,
      text: opt.text,
      isCorrect: opt.isCorrect,
    })),
    correctAnswer: (question.correctAnswer as string) ?? '',
    points: question.points,
    hint: question.hint ?? undefined,
    explanation: question.explanation ?? undefined,
  });

  const adaptCheckboxQuestion = () => ({
    text: question.text,
    options: question.options.map(opt => ({
      id: opt.id,
      text: opt.text,
      isCorrect: opt.isCorrect,
    })),
    correctAnswer: (question.correctAnswer as string[]) ?? [],
    points: question.points,
    hint: question.hint ?? undefined,
    explanation: question.explanation ?? undefined,
  });

  const adaptShortAnswerQuestion = () => ({
    text: question.text,
    correctAnswer: (question.correctAnswer as string) ?? undefined,
    gradingCriteria: question.gradingCriteria ?? undefined,
    points: question.points,
    hint: question.hint ?? undefined,
    explanation: question.explanation ?? undefined,
  });

  const adaptSortingQuestion = () => {
    // Convert string array to SortingItem array
    const correctAnswerArray = (question.correctAnswer as string[]) ?? [];
    const items = correctAnswerArray.map((text, index) => ({
      id: `${index + 1}`,
      text: text,
      order: index + 1,
    }));

    return {
      text: question.text,
      items: items.length > 0 ? items : undefined,
      points: question.points,
      hint: question.hint ?? undefined,
      explanation: question.explanation ?? undefined,
    };
  };

  const adaptFillInBlankQuestion = () => {
    // Convert Record<string, string> to Blank array
    const correctAnswerRecord =
      (question.correctAnswer as Record<string, string>) ?? {};
    const blanks = Object.entries(correctAnswerRecord).map(([key, answer]) => ({
      id: key,
      answer: answer,
      alternativeAnswers: [],
    }));

    return {
      text: question.text,
      blanks: blanks.length > 0 ? blanks : undefined,
      points: question.points,
      hint: question.hint ?? undefined,
      explanation: question.explanation ?? undefined,
    };
  };

  const adaptDiagramQuestion = () => {
    // According to the schema, DIAGRAM correctAnswer is { x: number, y: number, label: string }
    // But DiagramForm expects imageUrl and hotSpots array
    // This suggests we might need to store imageUrl and hotSpots differently
    // For now, we'll assume correctAnswer stores the correct hotspot and imageUrl is from media
    const diagramAnswer = question.correctAnswer as {
      x: number;
      y: number;
      label: string;
    } | null;
    const firstImage = question.media?.find(m => m.type === 'IMAGE');

    return {
      text: question.text,
      imageUrl: firstImage?.url ?? undefined,
      hotSpots: diagramAnswer
        ? [
            {
              id: '1',
              x: diagramAnswer.x,
              y: diagramAnswer.y,
              label: diagramAnswer.label,
              isCorrect: true,
            },
          ]
        : undefined,
      points: question.points,
      hint: question.hint ?? undefined,
      explanation: question.explanation ?? undefined,
    };
  };

  const adaptMatchingQuestion = () => {
    // Convert Record<string, string> to MatchingPair array
    const correctAnswerRecord =
      (question.correctAnswer as Record<string, string>) ?? {};
    const pairs = Object.entries(correctAnswerRecord).map(
      ([left, right], index) => ({
        id: `${index + 1}`,
        left: left,
        right: right,
      })
    );

    return {
      text: question.text,
      pairs: pairs.length > 0 ? pairs : undefined,
      points: question.points,
      hint: question.hint ?? undefined,
      explanation: question.explanation ?? undefined,
    };
  };

  const adaptNumericQuestion = () => ({
    text: question.text,
    correctAnswer: (question.correctAnswer as number) ?? undefined,
    tolerance: undefined,
    allowRange: false,
    minValue: undefined,
    maxValue: undefined,
    unit: undefined,
    decimalPlaces: undefined,
    points: question.points,
    hint: question.hint ?? undefined,
    explanation: question.explanation ?? undefined,
  });

  const renderQuestionForm = () => {
    switch (question.type) {
      case QuestionType.TRUE_FALSE:
        return (
          <TrueFalseForm
            question={adaptTrueFalseQuestion()}
            isAutoGrading={isAutoGrading}
            onChange={handleChange}
          />
        );

      case QuestionType.MULTIPLE_CHOICE:
        return (
          <MultipleChoiceForm
            question={adaptMultipleChoiceQuestion()}
            isAutoGrading={isAutoGrading}
            onChange={handleChange}
          />
        );

      case QuestionType.CHECKBOX:
        return (
          <CheckboxForm
            question={adaptCheckboxQuestion()}
            isAutoGrading={isAutoGrading}
            onChange={handleChange}
          />
        );

      case QuestionType.SHORT_ANSWER:
        return (
          <ShortAnswerForm
            question={adaptShortAnswerQuestion()}
            isAutoGrading={isAutoGrading}
            onChange={handleChange}
          />
        );

      case QuestionType.SORTING:
        return (
          <SortingForm
            question={adaptSortingQuestion()}
            isAutoGrading={isAutoGrading}
            onChange={handleChange}
          />
        );

      case QuestionType.FILL_IN_BLANK:
        return (
          <FillInBlankForm
            question={adaptFillInBlankQuestion()}
            isAutoGrading={isAutoGrading}
            onChange={handleChange}
          />
        );

      case QuestionType.DIAGRAM:
        return (
          <DiagramForm
            question={adaptDiagramQuestion()}
            isAutoGrading={isAutoGrading}
            onChange={handleChange}
          />
        );

      case QuestionType.MATCHING:
        return (
          <MatchingForm
            question={adaptMatchingQuestion()}
            isAutoGrading={isAutoGrading}
            onChange={handleChange}
          />
        );

      case QuestionType.NUMERIC:
        return (
          <NumericForm
            question={adaptNumericQuestion()}
            isAutoGrading={isAutoGrading}
            onChange={handleChange}
          />
        );

      default:
        return (
          <div className="p-4 text-center text-gray-500">
            このタイプの問題はまだサポートされていません
          </div>
        );
    }
  };

  // Note: DiagramForm already has its own image upload functionality,
  // so we don't wrap it with QuestionWithImage
  if (question.type === QuestionType.DIAGRAM) {
    return renderQuestionForm();
  }

  // Adapt media to match QuestionWithMedia's expected type
  const adaptedMedia = (question.media || []).map(m => ({
    id: m.id,
    url: m.url,
    type: m.type as 'IMAGE' | 'VIDEO',
    fileName: m.fileName,
    fileSize: m.fileSize,
    mimeType: m.mimeType,
    order: m.order,
  }));

  return (
    <QuestionWithMedia
      questionId={question.id}
      media={adaptedMedia}
      onMediaChange={handleMediaChange}
    >
      {renderQuestionForm()}
    </QuestionWithMedia>
  );
}
