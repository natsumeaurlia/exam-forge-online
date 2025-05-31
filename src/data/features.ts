import {
  Award,
  BarChart3,
  Edit,
  List,
} from 'lucide-react';
import { FeatureProps } from '@/types/feature';

export const getFeaturesData = (t: (key: string) => string): FeatureProps[] => [
  {
    icon: <Edit className="h-6 w-6" />,
    title: t('features.list.builder.title'),
    description: t('features.list.builder.description'),
  },
  {
    icon: <List className="h-6 w-6" />,
    title: t('features.list.questionTypes.title'),
    description: t('features.list.questionTypes.description'),
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: t('features.list.analytics.title'),
    description: t('features.list.analytics.description'),
  },
  {
    icon: <Award className="h-6 w-6" />,
    title: t('features.list.certificates.title'),
    description: t('features.list.certificates.description'),
  },
];