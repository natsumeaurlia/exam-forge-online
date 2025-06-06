'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAction } from 'next-safe-action/hooks';
import {
  MoreVertical,
  Edit,
  Eye,
  Copy,
  Share,
  Trash2,
  Calendar,
  Users,
  FileText,
  Globe,
  Lock,
} from 'lucide-react';
import { deleteQuiz } from '@/lib/actions/quiz';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  subdomain: string | null;
  tags: Array<{
    tag: {
      id: string;
      name: string;
      color: string | null;
    };
  }>;
  _count: {
    questions: number;
    responses: number;
  };
}

interface QuizCardProps {
  quiz: Quiz;
}

export function QuizCard({ quiz }: QuizCardProps) {
  console.log('=== QuizCard Rendering ===');
  console.log('Quiz title:', quiz.title);
  console.log('Quiz ID:', quiz.id);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { execute: executeDelete, isExecuting: isDeleting } = useAction(
    deleteQuiz,
    {
      onSuccess: () => {
        toast.success('クイズが削除されました');
        setShowDeleteDialog(false);
      },
      onError: ({ error }) => {
        toast.error(error.serverError || 'クイズの削除に失敗しました');
      },
    }
  );

  const handleDelete = () => {
    executeDelete({ id: quiz.id });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            公開済み
          </Badge>
        );
      case 'DRAFT':
        return <Badge variant="secondary">下書き</Badge>;
      case 'ARCHIVED':
        return <Badge variant="outline">アーカイブ</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  return (
    <>
      <Card
        className="group transition-shadow duration-200 hover:shadow-lg"
        data-testid="quiz-card"
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-lg font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
                <Link href={`/dashboard/quizzes/${quiz.id}`}>{quiz.title}</Link>
              </h3>
              {quiz.description && (
                <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                  {quiz.description}
                </p>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/quizzes/${quiz.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    編集
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/quizzes/${quiz.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    プレビュー
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Copy className="mr-2 h-4 w-4" />
                  複製
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share className="mr-2 h-4 w-4" />
                  共有
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  削除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pb-3">
          <div className="mb-3 flex items-center justify-between">
            {getStatusBadge(quiz.status)}
            <div className="flex items-center text-sm text-gray-500">
              {quiz.status === 'PUBLISHED' ? (
                quiz.subdomain ? (
                  <Globe className="h-4 w-4" />
                ) : (
                  <Lock className="h-4 w-4" />
                )
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <FileText className="mr-1 h-4 w-4" />
              {quiz._count.questions}問
            </div>
            <div className="flex items-center">
              <Users className="mr-1 h-4 w-4" />
              {quiz._count.responses}回答
            </div>
          </div>

          {quiz.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {quiz.tags.slice(0, 3).map(({ tag }) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="text-xs"
                  style={{
                    borderColor: tag.color || undefined,
                    color: tag.color || undefined,
                  }}
                >
                  {tag.name}
                </Badge>
              ))}
              {quiz.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{quiz.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t pt-3">
          <div className="flex w-full items-center text-xs text-gray-500">
            <Calendar className="mr-1 h-3 w-3" />
            <span>作成: {formatDate(quiz.createdAt)}</span>
            {quiz.updatedAt.getTime() !== quiz.createdAt.getTime() && (
              <span className="ml-auto">
                更新: {formatDate(quiz.updatedAt)}
              </span>
            )}
          </div>
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>クイズを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{quiz.title}」を削除します。この操作は取り消せません。
              すべての問題と回答データも削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? '削除中...' : '削除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
