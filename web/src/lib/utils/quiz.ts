import { Badge } from '@/components/ui/badge';

// 日付フォーマット関数
export function formatQuizDate(date: Date | string): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

// クイズステータスの設定を取得
export function getQuizStatusConfig(status: string) {
  const statusMap = {
    PUBLISHED: {
      label: '公開済み',
      variant: 'default' as const,
      className: 'bg-green-100 text-green-800 hover:bg-green-100',
    },
    DRAFT: {
      label: '下書き',
      variant: 'secondary' as const,
      className: '',
    },
    ARCHIVED: {
      label: 'アーカイブ',
      variant: 'outline' as const,
      className: '',
    },
  };

  return (
    statusMap[status as keyof typeof statusMap] || {
      label: status,
      variant: 'secondary' as const,
      className: '',
    }
  );
}

// 応答数のフォーマット
export function formatResponseCount(count: number): string {
  if (count === 0) return '応答なし';
  if (count === 1) return '1件の応答';
  return `${count}件の応答`;
}

// 質問数のフォーマット
export function formatQuestionCount(count: number): string {
  if (count === 0) return '質問なし';
  if (count === 1) return '1問';
  return `${count}問`;
}

// クイズのシェアURLを生成
export function getQuizShareUrl(quizId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  return `${baseUrl}/quiz/${quizId}`;
}

// クイズのプレビューURLを生成
export function getQuizPreviewUrl(lng: string, quizId: string): string {
  return `/${lng}/quiz/${quizId}/preview`;
}

// クイズの編集URLを生成
export function getQuizEditUrl(lng: string, quizId: string): string {
  return `/${lng}/dashboard/quizzes/${quizId}/edit`;
}

// クイズの分析URLを生成
export function getQuizAnalyticsUrl(lng: string, quizId: string): string {
  return `/${lng}/dashboard/quizzes/${quizId}/analytics`;
}

// クイズを受けるURLを生成
export function getQuizTakeUrl(quizId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  return `${baseUrl}/quiz/${quizId}`;
}
