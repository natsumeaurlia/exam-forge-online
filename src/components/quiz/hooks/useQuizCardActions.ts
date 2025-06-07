import { useAction } from 'next-safe-action/hooks';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { deleteQuiz } from '@/lib/actions/quiz';
import {
  getQuizShareUrl,
  getQuizPreviewUrl,
  getQuizEditUrl,
  getQuizAnalyticsUrl,
} from '@/lib/utils/quiz';

export function useQuizCardActions(quizId: string, lng: string) {
  const router = useRouter();

  const { execute: executeDelete, isExecuting: isDeleting } = useAction(
    deleteQuiz,
    {
      onSuccess: () => {
        toast.success('クイズが削除されました');
      },
      onError: ({ error }) => {
        toast.error(error.serverError || 'クイズの削除に失敗しました');
      },
    }
  );

  const handlePreview = () => {
    router.push(getQuizPreviewUrl(lng, quizId));
  };

  const handleEdit = () => {
    router.push(getQuizEditUrl(lng, quizId));
  };

  const handleShare = async () => {
    const shareUrl = getQuizShareUrl(quizId);
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('共有リンクをコピーしました');
    } catch {
      toast.error('共有リンクのコピーに失敗しました');
    }
  };

  const handleCopy = () => {
    toast.info('この機能は現在開発中です');
  };

  const handleAnalytics = () => {
    router.push(getQuizAnalyticsUrl(lng, quizId));
  };

  const handleDelete = () => {
    executeDelete({ id: quizId });
  };

  return {
    handlePreview,
    handleEdit,
    handleShare,
    handleCopy,
    handleAnalytics,
    handleDelete,
    isDeleting,
  };
}
