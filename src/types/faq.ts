export interface FaqItem {
  id: string;
  questionKey: string;
  answerKey: string;
}

export interface FaqData {
  items: FaqItem[];
}