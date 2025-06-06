'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { ScoringType, SharingMode } from '@prisma/client';
import { createQuiz } from '@/lib/actions/quiz';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CreateQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateQuizModal({ isOpen, onClose }: CreateQuizModalProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    scoringType: ScoringType;
    sharingMode: SharingMode;
    password: string;
  }>({
    title: '',
    description: '',
    scoringType: ScoringType.AUTO,
    sharingMode: SharingMode.URL,
    password: '',
  });

  const { execute, isExecuting } = useAction(createQuiz, {
    onSuccess: ({ data }) => {
      toast.success('クイズが作成されました');
      onClose();
      router.push(`/dashboard/quizzes/${data?.quiz.id}/edit`);
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'クイズの作成に失敗しました');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('タイトルを入力してください');
      return;
    }

    execute(formData);
  };

  const handleClose = () => {
    if (!isExecuting) {
      setFormData({
        title: '',
        description: '',
        scoringType: ScoringType.AUTO,
        sharingMode: SharingMode.URL,
        password: '',
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>新規クイズ作成</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">タイトル *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={e =>
                setFormData(prev => ({ ...prev, title: e.target.value }))
              }
              placeholder="クイズのタイトルを入力"
              disabled={isExecuting}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">説明</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e =>
                setFormData(prev => ({ ...prev, description: e.target.value }))
              }
              placeholder="クイズの説明を入力（任意）"
              disabled={isExecuting}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scoringType">採点モード</Label>
              <Select
                value={formData.scoringType}
                onValueChange={(value: ScoringType) =>
                  setFormData(prev => ({ ...prev, scoringType: value }))
                }
                disabled={isExecuting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ScoringType.AUTO}>自動採点</SelectItem>
                  <SelectItem value={ScoringType.MANUAL}>手動採点</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sharingMode">共有モード</Label>
              <Select
                value={formData.sharingMode}
                onValueChange={(value: SharingMode) =>
                  setFormData(prev => ({ ...prev, sharingMode: value }))
                }
                disabled={isExecuting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SharingMode.URL}>URL共有</SelectItem>
                  <SelectItem value={SharingMode.PASSWORD}>
                    パスワード保護
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.sharingMode === SharingMode.PASSWORD && (
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={e =>
                  setFormData(prev => ({ ...prev, password: e.target.value }))
                }
                placeholder="アクセス用パスワードを入力"
                disabled={isExecuting}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isExecuting}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={isExecuting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isExecuting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              作成して編集へ進む
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
