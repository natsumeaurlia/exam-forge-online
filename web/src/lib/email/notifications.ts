import { Resend } from 'resend';
import { NotificationType } from '@prisma/client';
import { NotificationEmail } from '@/components/email/NotificationEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendNotificationEmailParams {
  to: string;
  type: NotificationType;
  title: string;
  message?: string;
  data?: any;
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
}

export async function sendNotificationEmail({
  to,
  type,
  title,
  message,
  data,
  user,
}: SendNotificationEmailParams) {
  try {
    const subject = getEmailSubject(type, title, data);
    const emailContent = getEmailContent(type, title, message, data, user);

    const result = await resend.emails.send({
      from: 'ExamForge <notifications@examforge.com>',
      to,
      subject,
      react: NotificationEmail({
        title: subject,
        content: emailContent,
        type,
        data,
        user,
      }),
    });

    console.log('Notification email sent:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to send notification email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function getEmailSubject(
  type: NotificationType,
  title: string,
  data?: any
): string {
  switch (type) {
    case 'QUIZ_COMPLETED':
      return `クイズ完了通知 - ${title}`;
    case 'QUIZ_PUBLISHED':
      return `新しいクイズが公開されました - ${title}`;
    case 'TEAM_MEMBER_JOINED':
      return `チームに新しいメンバーが参加しました`;
    case 'TEAM_MEMBER_LEFT':
      return `チームメンバーが退出しました`;
    case 'SUBSCRIPTION_CREATED':
      return `サブスクリプションが開始されました`;
    case 'SUBSCRIPTION_UPDATED':
      return `サブスクリプションが更新されました`;
    case 'SUBSCRIPTION_CANCELED':
      return `サブスクリプションがキャンセルされました`;
    case 'PAYMENT_SUCCESS':
      return `お支払いが完了しました`;
    case 'PAYMENT_FAILED':
      return `お支払いが失敗しました`;
    case 'USAGE_LIMIT_WARNING':
      return `使用量制限の警告`;
    case 'USAGE_LIMIT_EXCEEDED':
      return `使用量制限を超過しました`;
    case 'CERTIFICATE_ISSUED':
      return `証明書が発行されました`;
    case 'SYSTEM_MAINTENANCE':
      return `システムメンテナンスのお知らせ`;
    case 'SYSTEM_UPDATE':
      return `システムアップデートのお知らせ`;
    case 'MARKETING':
      return title;
    default:
      return title;
  }
}

function getEmailContent(
  type: NotificationType,
  title: string,
  message?: string,
  data?: any,
  user?: any
): string {
  const userName = user?.name || 'ユーザー';

  switch (type) {
    case 'QUIZ_COMPLETED':
      return `
        <h2>クイズが完了しました</h2>
        <p>${userName}さん、お疲れ様でした！</p>
        <p><strong>クイズ名:</strong> ${data?.quizTitle || 'クイズ'}</p>
        ${data?.score !== undefined ? `<p><strong>スコア:</strong> ${data.score}点</p>` : ''}
        ${message ? `<p>${message}</p>` : ''}
        <p>結果の詳細は<a href="${process.env.NEXTAUTH_URL}/dashboard">ダッシュボード</a>でご確認いただけます。</p>
      `;

    case 'QUIZ_PUBLISHED':
      return `
        <h2>新しいクイズが公開されました</h2>
        <p>${userName}さん</p>
        <p>新しいクイズ「${data?.quizTitle || title}」が公開されました。</p>
        ${message ? `<p>${message}</p>` : ''}
        <p><a href="${process.env.NEXTAUTH_URL}/quiz/${data?.quizId}">クイズを開始する</a></p>
      `;

    case 'TEAM_MEMBER_JOINED':
      return `
        <h2>チームに新しいメンバーが参加しました</h2>
        <p>${userName}さん</p>
        <p>チーム「${data?.teamName}」に新しいメンバーが参加しました。</p>
        ${message ? `<p>${message}</p>` : ''}
        <p><a href="${process.env.NEXTAUTH_URL}/dashboard/team/members">メンバー一覧を見る</a></p>
      `;

    case 'SUBSCRIPTION_CREATED':
      return `
        <h2>サブスクリプションが開始されました</h2>
        <p>${userName}さん</p>
        <p>ExamForge ${data?.planName || 'Pro'}プランのサブスクリプションが開始されました。</p>
        ${message ? `<p>${message}</p>` : ''}
        <p><a href="${process.env.NEXTAUTH_URL}/dashboard/subscription">サブスクリプション管理</a></p>
      `;

    case 'PAYMENT_SUCCESS':
      return `
        <h2>お支払いが完了しました</h2>
        <p>${userName}さん</p>
        <p>月額料金のお支払いが正常に処理されました。</p>
        ${data?.amount ? `<p><strong>金額:</strong> ¥${data.amount.toLocaleString()}</p>` : ''}
        ${message ? `<p>${message}</p>` : ''}
        <p>ご利用ありがとうございます。</p>
      `;

    case 'PAYMENT_FAILED':
      return `
        <h2>お支払いが失敗しました</h2>
        <p>${userName}さん</p>
        <p>月額料金のお支払い処理に失敗しました。</p>
        ${message ? `<p>${message}</p>` : ''}
        <p>お支払い方法をご確認いただき、<a href="${process.env.NEXTAUTH_URL}/dashboard/subscription">こちら</a>から再度お手続きください。</p>
      `;

    case 'USAGE_LIMIT_WARNING':
      return `
        <h2>使用量制限の警告</h2>
        <p>${userName}さん</p>
        <p>現在のプランの使用量制限に近づいています。</p>
        ${message ? `<p>${message}</p>` : ''}
        <p><a href="${process.env.NEXTAUTH_URL}/dashboard/usage">使用量を確認する</a></p>
        <p>必要に応じて<a href="${process.env.NEXTAUTH_URL}/plans">プランのアップグレード</a>をご検討ください。</p>
      `;

    case 'USAGE_LIMIT_EXCEEDED':
      return `
        <h2>使用量制限を超過しました</h2>
        <p>${userName}さん</p>
        <p>現在のプランの使用量制限を超過しました。</p>
        ${message ? `<p>${message}</p>` : ''}
        <p>サービスを継続してご利用いただくには、<a href="${process.env.NEXTAUTH_URL}/plans">プランのアップグレード</a>が必要です。</p>
      `;

    case 'CERTIFICATE_ISSUED':
      return `
        <h2>証明書が発行されました</h2>
        <p>${userName}さん、おめでとうございます！</p>
        <p>クイズ「${data?.quizTitle}」の証明書が発行されました。</p>
        ${message ? `<p>${message}</p>` : ''}
        <p><a href="${process.env.NEXTAUTH_URL}/certificates/${data?.certificateId}">証明書を確認する</a></p>
      `;

    case 'SYSTEM_MAINTENANCE':
      return `
        <h2>システムメンテナンスのお知らせ</h2>
        <p>${userName}さん</p>
        <p>ExamForgeのシステムメンテナンスを実施いたします。</p>
        ${message ? `<p>${message}</p>` : ''}
        <p>ご不便をおかけして申し訳ございません。</p>
      `;

    case 'SYSTEM_UPDATE':
      return `
        <h2>システムアップデートのお知らせ</h2>
        <p>${userName}さん</p>
        <p>ExamForgeに新機能が追加されました。</p>
        ${message ? `<p>${message}</p>` : ''}
        <p><a href="${process.env.NEXTAUTH_URL}/dashboard">ダッシュボード</a>をご確認ください。</p>
      `;

    default:
      return `
        <h2>${title}</h2>
        <p>${userName}さん</p>
        ${message ? `<p>${message}</p>` : ''}
      `;
  }
}

// Template-based email notifications (future enhancement)
export async function sendTemplatedNotificationEmail(
  templateId: string,
  to: string,
  variables: Record<string, any>
) {
  // This function can be enhanced to use database-stored templates
  // with variable substitution for more flexible email content
  console.log('Templated email not implemented yet');
}
