import { QuestionType } from '@prisma/client';

export function useQuestionUpdateHandler() {
  const convertFormDataToPrisma = (
    questionType: QuestionType,
    updates: Record<string, unknown>
  ) => {
    let convertedUpdates = { ...updates };

    switch (questionType) {
      case QuestionType.SORTING:
        if ('items' in updates && Array.isArray(updates.items)) {
          const items = updates.items as Array<{ text: string; order: number }>;
          convertedUpdates.correctAnswer = items
            .sort((a, b) => a.order - b.order)
            .map(item => item.text);
          delete convertedUpdates.items;
        }
        break;

      case QuestionType.FILL_IN_BLANK:
        if ('blanks' in updates && Array.isArray(updates.blanks)) {
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
          delete convertedUpdates.imageUrl;
        }
        break;

      case QuestionType.MATCHING:
        if ('pairs' in updates && Array.isArray(updates.pairs)) {
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

    return convertedUpdates;
  };

  return { convertFormDataToPrisma };
}
