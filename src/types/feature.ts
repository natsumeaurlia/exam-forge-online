import { ReactNode } from 'react';

export interface FeatureProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export interface FeatureCardProps extends FeatureProps {
  index: number;
  className?: string;
}