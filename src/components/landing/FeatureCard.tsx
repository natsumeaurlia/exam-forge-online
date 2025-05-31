'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { FeatureCardProps } from '@/types/feature';

export function FeatureCard({ icon, title, description, index, className }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={cn("h-full", className)}
    >
      <Card
        className="group h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
        data-testid={`feature-item-${index}`}
      >
        <CardHeader className="pb-4">
          <div
            className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
            data-testid={`feature-icon-${index}`}
          >
            {icon}
          </div>
          <CardTitle
            className="text-lg font-semibold"
            data-testid={`feature-title-${index}`}
          >
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription
            className="text-sm text-muted-foreground"
            data-testid={`feature-description-${index}`}
          >
            {description}
          </CardDescription>
        </CardContent>
      </Card>
    </motion.div>
  );
}