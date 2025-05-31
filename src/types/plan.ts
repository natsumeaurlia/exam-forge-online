/**
 * Plan type definition for the exam forge application
 * Supports plan comparison functionality with monthly/yearly pricing
 */
export interface Plan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  isPopular: boolean;
  features: {
    members: number | string;
    quizzes: number | string;
    questionsPerQuiz: number | string;
    responsesPerMonth: number | string;
    storage: string;
  };
  includedFeatures: string[];
}
