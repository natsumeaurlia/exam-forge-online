'use client';

import {
  QuestionType,
  Question,
  QuestionOption,
  MediaType,
} from '@prisma/client';
import { useQuestionAdapters } from './hooks/useQuestionAdapters';
import { useQuestionUpdateHandler } from './hooks/useQuestionUpdateHandler';
import { QuestionFormRenderer } from './QuestionFormRenderer';
import { QuestionWithMedia } from './QuestionWithMedia';
import { RequiredToggle } from './RequiredToggle';
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
  const { convertFormDataToPrisma } = useQuestionUpdateHandler();
  const adapters = useQuestionAdapters(question as QuestionWithOptions);

  if (!question || !quiz) return null;

  const handleChange = (updates: Record<string, unknown>) => {
    const convertedUpdates = convertFormDataToPrisma(question.type, updates);
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

  const getAdaptedQuestion = () => {
    const adapterMap = {
      [QuestionType.TRUE_FALSE]: adapters.adaptTrueFalseQuestion,
      [QuestionType.MULTIPLE_CHOICE]: adapters.adaptMultipleChoiceQuestion,
      [QuestionType.CHECKBOX]: adapters.adaptCheckboxQuestion,
      [QuestionType.SHORT_ANSWER]: adapters.adaptShortAnswerQuestion,
      [QuestionType.SORTING]: adapters.adaptSortingQuestion,
      [QuestionType.FILL_IN_BLANK]: adapters.adaptFillInBlankQuestion,
      [QuestionType.DIAGRAM]: adapters.adaptDiagramQuestion,
      [QuestionType.MATCHING]: adapters.adaptMatchingQuestion,
      [QuestionType.NUMERIC]: adapters.adaptNumericQuestion,
    };

    const adapter = adapterMap[question.type];
    return adapter ? adapter() : null;
  };

  const adaptedQuestion = getAdaptedQuestion();

  // Note: DiagramForm already has its own image upload functionality,
  // so we don't wrap it with QuestionWithMedia
  if (question.type === QuestionType.DIAGRAM) {
    return (
      <div className="space-y-6">
        <QuestionFormRenderer
          questionType={question.type}
          question={adaptedQuestion}
          isAutoGrading={isAutoGrading}
          onChange={handleChange}
        />
        <RequiredToggle
          isRequired={question.isRequired ?? false}
          onChange={isRequired => updateQuestion(questionIndex, { isRequired })}
        />
      </div>
    );
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
    <div className="space-y-6">
      <QuestionWithMedia
        questionId={question.id}
        media={adaptedMedia}
        onMediaChange={handleMediaChange}
      >
        <QuestionFormRenderer
          questionType={question.type}
          question={adaptedQuestion}
          isAutoGrading={isAutoGrading}
          onChange={handleChange}
        />
      </QuestionWithMedia>
      <RequiredToggle
        isRequired={question.isRequired ?? false}
        onChange={isRequired => updateQuestion(questionIndex, { isRequired })}
      />
    </div>
  );
}
