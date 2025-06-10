import { Question, QuestionOption, MediaType } from '@prisma/client';

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

export function useQuestionAdapters(question: QuestionWithOptions) {
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

  return {
    adaptTrueFalseQuestion,
    adaptMultipleChoiceQuestion,
    adaptCheckboxQuestion,
    adaptShortAnswerQuestion,
    adaptSortingQuestion,
    adaptFillInBlankQuestion,
    adaptDiagramQuestion,
    adaptMatchingQuestion,
    adaptNumericQuestion,
  };
}
