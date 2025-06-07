import { MessageSquare, Users } from 'lucide-react';
import { formatQuestionCount, formatResponseCount } from '@/lib/utils/quiz';

interface QuizCardStatsProps {
  questionsCount: number;
  responsesCount: number;
}

export function QuizCardStats({
  questionsCount,
  responsesCount,
}: QuizCardStatsProps) {
  return (
    <div className="text-muted-foreground flex items-center gap-4 text-sm">
      <div className="flex items-center gap-1">
        <MessageSquare className="h-4 w-4" />
        <span>{formatQuestionCount(questionsCount)}</span>
      </div>
      <div className="flex items-center gap-1">
        <Users className="h-4 w-4" />
        <span>{formatResponseCount(responsesCount)}</span>
      </div>
    </div>
  );
}
