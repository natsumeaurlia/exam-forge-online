import { useAction } from 'next-safe-action/hooks';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { deleteTemplate } from '@/lib/actions/template';

export function useTemplateCardActions(templateId: string, lng: string) {
  const router = useRouter();

  const { execute: executeDelete, isExecuting: isDeleting } = useAction(
    deleteTemplate,
    {
      onSuccess: () => {
        toast.success('テンプレートが削除されました');
      },
      onError: ({ error }) => {
        toast.error(error.serverError || 'テンプレートの削除に失敗しました');
      },
    }
  );

  const handlePreview = () => {
    router.push(`/${lng}/dashboard/templates/${templateId}/preview`);
  };

  const handleEdit = () => {
    router.push(`/${lng}/dashboard/templates/${templateId}/edit`);
  };

  const handleDuplicate = () => {
    // TODO: Implement template duplication
    toast.info('この機能は現在開発中です');
  };

  const handleCreateQuiz = () => {
    router.push(`/${lng}/dashboard/templates/${templateId}/create-quiz`);
  };

  const handleDelete = () => {
    executeDelete({ id: templateId });
  };

  return {
    handlePreview,
    handleEdit,
    handleDuplicate,
    handleCreateQuiz,
    handleDelete,
    isDeleting,
  };
}
