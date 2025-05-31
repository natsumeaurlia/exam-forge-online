import { LucideIcon } from 'lucide-react';
import React from 'react';

export interface QuizTypeProps {
  id: string;
  title: string;
  description: string;
  icon: React.ReactElement;
  features: string[];
  featureInfo?: Record<string, boolean>;
  proOnly?: boolean;
}

export interface Question {
  id: string;
  type: string;
  text: string;
  options?: {
    id: string;
    text: string;
    isCorrect?: boolean;
  }[];
  correctAnswer?: string;
  explanation?: string;
}
