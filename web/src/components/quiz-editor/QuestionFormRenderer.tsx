import { QuestionType } from '@prisma/client';
import { TrueFalseForm } from './QuestionTypeForm/TrueFalseForm';
import { MultipleChoiceForm } from './QuestionTypeForm/MultipleChoiceForm';
import { CheckboxForm } from './QuestionTypeForm/CheckboxForm';
import { ShortAnswerForm } from './QuestionTypeForm/ShortAnswerForm';
import { SortingForm } from './QuestionTypeForm/SortingForm';
import { FillInBlankForm } from './QuestionTypeForm/FillInBlankForm';
import { DiagramForm } from './QuestionTypeForm/DiagramForm';
import { MatchingForm } from './QuestionTypeForm/MatchingForm';
import { NumericForm } from './QuestionTypeForm/NumericForm';

interface QuestionFormRendererProps {
  questionType: QuestionType;
  question: any;
  isAutoGrading: boolean;
  onChange: (updates: Record<string, unknown>) => void;
}

export function QuestionFormRenderer({
  questionType,
  question,
  isAutoGrading,
  onChange,
}: QuestionFormRendererProps) {
  switch (questionType) {
    case QuestionType.TRUE_FALSE:
      return (
        <TrueFalseForm
          question={question}
          isAutoGrading={isAutoGrading}
          onChange={onChange}
        />
      );

    case QuestionType.MULTIPLE_CHOICE:
      return (
        <MultipleChoiceForm
          question={question}
          isAutoGrading={isAutoGrading}
          onChange={onChange}
        />
      );

    case QuestionType.CHECKBOX:
      return (
        <CheckboxForm
          question={question}
          isAutoGrading={isAutoGrading}
          onChange={onChange}
        />
      );

    case QuestionType.SHORT_ANSWER:
      return (
        <ShortAnswerForm
          question={question}
          isAutoGrading={isAutoGrading}
          onChange={onChange}
        />
      );

    case QuestionType.SORTING:
      return (
        <SortingForm
          question={question}
          isAutoGrading={isAutoGrading}
          onChange={onChange}
        />
      );

    case QuestionType.FILL_IN_BLANK:
      return (
        <FillInBlankForm
          question={question}
          isAutoGrading={isAutoGrading}
          onChange={onChange}
        />
      );

    case QuestionType.DIAGRAM:
      return (
        <DiagramForm
          question={question}
          isAutoGrading={isAutoGrading}
          onChange={onChange}
        />
      );

    case QuestionType.MATCHING:
      return (
        <MatchingForm
          question={question}
          isAutoGrading={isAutoGrading}
          onChange={onChange}
        />
      );

    case QuestionType.NUMERIC:
      return (
        <NumericForm
          question={question}
          isAutoGrading={isAutoGrading}
          onChange={onChange}
        />
      );

    default:
      return (
        <div className="p-4 text-center text-gray-500">
          このタイプの問題はまだサポートされていません
        </div>
      );
  }
}
