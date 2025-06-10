import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface QuestionHintProps {
  hint: string | null;
  showHint: boolean;
  onToggleHint: () => void;
}

export function QuestionHint({
  hint,
  showHint,
  onToggleHint,
}: QuestionHintProps) {
  const t = useTranslations('quiz.preview');

  if (!hint) return null;

  return (
    <div className="pt-4">
      {!showHint ? (
        <Button variant="outline" size="sm" onClick={onToggleHint}>
          <HelpCircle className="mr-2 h-4 w-4" />
          {t('showHint')}
        </Button>
      ) : (
        <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
          <p className="font-medium">{t('hint')}:</p>
          <p>{hint}</p>
        </div>
      )}
    </div>
  );
}
