'use client';

import { motion } from 'framer-motion';
import {
  useScrollAnimation,
  ScrollAnimationOptions,
} from '@/hooks/useScrollAnimation';
import { ReactNode } from 'react';

export interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  animation?: 'fadeInUp' | 'fadeIn' | 'slideInLeft' | 'slideInRight';
  delay?: number;
  duration?: number;
  threshold?: number;
  triggerOnce?: boolean;
  staggerChildren?: number;
  'data-testid'?: string;
}

const animationVariants = {
  fadeInUp: {
    hidden: {
      opacity: 0,
      y: 30,
    },
    visible: {
      opacity: 1,
      y: 0,
    },
  },
  fadeIn: {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
    },
  },
  slideInLeft: {
    hidden: {
      opacity: 0,
      x: -30,
    },
    visible: {
      opacity: 1,
      x: 0,
    },
  },
  slideInRight: {
    hidden: {
      opacity: 0,
      x: 30,
    },
    visible: {
      opacity: 1,
      x: 0,
    },
  },
};

export function AnimatedSection({
  children,
  className = '',
  animation = 'fadeInUp',
  delay = 0,
  duration = 0.6,
  threshold = 0.5,
  triggerOnce = true,
  staggerChildren,
  'data-testid': testId,
}: AnimatedSectionProps) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>({
    threshold,
    delay,
    triggerOnce,
  });

  const variants = animationVariants[animation];

  const containerVariants = staggerChildren
    ? {
        hidden: {},
        visible: {
          transition: {
            staggerChildren,
            delayChildren: delay / 1000,
          },
        },
      }
    : variants;

  return (
    <motion.div
      ref={ref}
      className={`${className} gpu-accelerated`}
      data-testid={testId}
      initial="hidden"
      animate={isVisible ? 'visible' : 'hidden'}
      variants={containerVariants}
      transition={{
        duration,
        ease: [0.25, 0.46, 0.45, 0.94], // Custom easing
      }}
      style={{
        willChange: isVisible ? 'auto' : 'transform, opacity',
      }}
    >
      {staggerChildren ? (
        Array.isArray(children) ? (
          children.map((child, index) => (
            <motion.div
              key={index}
              variants={variants}
              transition={{ duration }}
            >
              {child}
            </motion.div>
          ))
        ) : (
          <motion.div variants={variants} transition={{ duration }}>
            {children}
          </motion.div>
        )
      ) : (
        children
      )}
    </motion.div>
  );
}
