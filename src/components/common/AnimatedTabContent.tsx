'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

export interface AnimatedTabContentProps {
  children: ReactNode;
  value: string;
  className?: string;
  'data-testid'?: string;
}

export function AnimatedTabContent({
  children,
  value,
  className = '',
  'data-testid': testId,
}: AnimatedTabContentProps) {
  return (
    <motion.div
      key={value}
      className={className}
      data-testid={testId}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {children}
    </motion.div>
  );
}