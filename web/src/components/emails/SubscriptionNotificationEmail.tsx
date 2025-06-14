import { Button, Section, Text } from '@react-email/components';
import { BaseEmailTemplate } from './BaseEmailTemplate';

interface SubscriptionNotificationEmailProps {
  type:
    | 'downgrade_warning'
    | 'payment_failed'
    | 'subscription_canceled'
    | 'trial_ending';
  teamName: string;
  userName: string;
  lng?: string;
  actionUrl?: string;
  expiryDate?: string;
}

export const SubscriptionNotificationEmail = ({
  type,
  teamName,
  userName,
  lng = 'ja',
  actionUrl,
  expiryDate,
}: SubscriptionNotificationEmailProps) => {
  const isJapanese = lng === 'ja';

  const getEmailContent = () => {
    switch (type) {
      case 'downgrade_warning':
        return {
          preview: isJapanese
            ? `チーム「${teamName}」のプランがダウングレードされました`
            : `Team "${teamName}" plan has been downgraded`,
          heading: isJapanese
            ? 'プランダウングレード通知'
            : 'Plan Downgrade Notification',
          content: isJapanese
            ? `チーム「${teamName}」のサブスクリプションプランがダウングレードされました。一部の機能が制限される可能性があります。`
            : `The subscription plan for team "${teamName}" has been downgraded. Some features may be limited.`,
          buttonText: isJapanese ? 'プランを確認' : 'View Plan',
        };

      case 'payment_failed':
        return {
          preview: isJapanese
            ? `チーム「${teamName}」の支払いに失敗しました`
            : `Payment failed for team "${teamName}"`,
          heading: isJapanese
            ? '支払い失敗通知'
            : 'Payment Failed Notification',
          content: isJapanese
            ? `チーム「${teamName}」の定期支払いに失敗しました。サービスの継続利用のため、お支払い方法を更新してください。`
            : `The recurring payment for team "${teamName}" has failed. Please update your payment method to continue using the service.`,
          buttonText: isJapanese ? '支払い方法を更新' : 'Update Payment Method',
        };

      case 'subscription_canceled':
        return {
          preview: isJapanese
            ? `チーム「${teamName}」のサブスクリプションがキャンセルされました`
            : `Subscription canceled for team "${teamName}"`,
          heading: isJapanese
            ? 'サブスクリプションキャンセル通知'
            : 'Subscription Canceled',
          content: isJapanese
            ? `チーム「${teamName}」のサブスクリプションがキャンセルされました。${expiryDate}まで現在のプランをご利用いただけます。`
            : `The subscription for team "${teamName}" has been canceled. You can continue using the current plan until ${expiryDate}.`,
          buttonText: isJapanese ? '再開する' : 'Reactivate',
        };

      case 'trial_ending':
        return {
          preview: isJapanese
            ? `チーム「${teamName}」のトライアル期間が間もなく終了します`
            : `Trial period ending soon for team "${teamName}"`,
          heading: isJapanese ? 'トライアル終了通知' : 'Trial Ending Soon',
          content: isJapanese
            ? `チーム「${teamName}」のトライアル期間が${expiryDate}に終了します。継続してご利用いただくには、プランをアップグレードしてください。`
            : `The trial period for team "${teamName}" will end on ${expiryDate}. Please upgrade your plan to continue using the service.`,
          buttonText: isJapanese ? 'プランをアップグレード' : 'Upgrade Plan',
        };

      default:
        return {
          preview: '',
          heading: '',
          content: '',
          buttonText: '',
        };
    }
  };

  const { preview, heading, content, buttonText } = getEmailContent();

  return (
    <BaseEmailTemplate
      preview={preview}
      heading={heading}
      footerText={
        isJapanese
          ? 'このメールは ExamForge から送信されています。'
          : 'This email was sent from ExamForge.'
      }
    >
      <Section>
        <Text className="mb-4 text-lg text-gray-700">
          {isJapanese ? `${userName}さん、` : `Hello ${userName},`}
        </Text>

        <Text className="mb-6 text-gray-600">{content}</Text>

        {actionUrl && (
          <Section className="mb-6 text-center">
            <Button
              href={actionUrl}
              className="rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white"
            >
              {buttonText}
            </Button>
          </Section>
        )}

        <Text className="text-center text-sm text-gray-500">
          {isJapanese
            ? 'ご質問がございましたら、お気軽にお問い合わせください。'
            : 'If you have any questions, please feel free to contact us.'}
        </Text>
      </Section>
    </BaseEmailTemplate>
  );
};
