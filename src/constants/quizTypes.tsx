import React from 'react';
import {
  CheckSquare,
  FileText,
  AlignJustify,
  BookOpen,
  Clock,
  Sparkles,
} from 'lucide-react';
import { QuizTypeProps } from '@/types/quiz';

export const getQuizTypes = (): QuizTypeProps[] => [
  {
    id: 'simple-quiz',
    title: 'quiz.types.simple-quiz.title',
    description: 'quiz.types.simple-quiz.description',
    icon: <CheckSquare className="h-6 w-6" />,
    features: ['truefalse', 'single', 'multiple', 'freetext'],
    featureInfo: {
      truefalse: true,
      single: true,
      multiple: true,
      freetext: true,
    },
  },
  {
    id: 'exam',
    title: 'quiz.types.exam.title',
    description: 'quiz.types.exam.description',
    icon: <Clock className="h-6 w-6" />,
    features: ['passingScore', 'analytics', 'certificate', 'timeLimit'],
    featureInfo: {
      passingScore: true,
      analytics: true,
      certificate: true,
      timeLimit: true,
    },
  },
  {
    id: 'survey',
    title: 'quiz.types.survey.title',
    description: 'quiz.types.survey.description',
    icon: <AlignJustify className="h-6 w-6" />,
    features: ['freeAnswer', 'choice', 'matrix', 'analytics'],
    featureInfo: {
      freeAnswer: true,
      choice: true,
      matrix: true,
      analytics: true,
    },
  },
  {
    id: 'assessment',
    title: 'quiz.types.assessment.title',
    description: 'quiz.types.assessment.description',
    icon: <FileText className="h-6 w-6" />,
    features: ['sections', 'branching', 'scoring', 'reports'],
    featureInfo: {
      sections: true,
      branching: true,
      scoring: true,
      reports: true,
    },
    proOnly: true,
  },
  {
    id: 'course',
    title: 'quiz.types.course.title',
    description: 'quiz.types.course.description',
    icon: <BookOpen className="h-6 w-6" />,
    features: ['lessons', 'progress', 'quizzes', 'certificates'],
    featureInfo: {
      lessons: true,
      progress: true,
      quizzes: true,
      certificates: true,
    },
    proOnly: true,
  },
  {
    id: 'ai-quiz',
    title: 'quiz.types.ai-quiz.title',
    description: 'quiz.types.ai-quiz.description',
    icon: <Sparkles className="h-6 w-6" />,
    features: ['autoGenerate', 'customPrompt', 'instant', 'edit'],
    featureInfo: {
      autoGenerate: true,
      customPrompt: true,
      instant: true,
      edit: true,
    },
    proOnly: true,
  },
];

// Export a function to get the current quiz types to ensure they're translated
export const QUIZ_TYPES = getQuizTypes();
