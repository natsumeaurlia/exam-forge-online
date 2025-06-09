import { Badge } from '@/components/ui/badge';
import { getQuizStatusConfig } from '@/lib/utils/quiz';

interface QuizStatusBadgeProps {
  status: string;
}

export function QuizStatusBadge({ status }: QuizStatusBadgeProps) {
  const config = getQuizStatusConfig(status);

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}
