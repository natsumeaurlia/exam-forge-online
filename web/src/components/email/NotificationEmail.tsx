import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Tailwind,
} from '@react-email/components';
import { NotificationType } from '@prisma/client';

interface NotificationEmailProps {
  title: string;
  content: string;
  type: NotificationType;
  data?: any;
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
}

export function NotificationEmail({
  title,
  content,
  type,
  data,
  user,
}: NotificationEmailProps) {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://examforge.com';
  const userName = user.name || 'ユーザー';

  const getActionButton = () => {
    switch (type) {
      case 'QUIZ_COMPLETED':
        return (
          <Button
            href={`${baseUrl}/dashboard/quizzes/${data?.quizId}/analytics`}
            style={buttonStyle}
          >
            結果を確認する
          </Button>
        );
      case 'QUIZ_PUBLISHED':
        return (
          <Button href={`${baseUrl}/quiz/${data?.quizId}`} style={buttonStyle}>
            クイズを開始する
          </Button>
        );
      case 'TEAM_MEMBER_JOINED':
        return (
          <Button
            href={`${baseUrl}/dashboard/team/members`}
            style={buttonStyle}
          >
            メンバー一覧を見る
          </Button>
        );
      case 'SUBSCRIPTION_CREATED':
      case 'SUBSCRIPTION_UPDATED':
      case 'SUBSCRIPTION_CANCELED':
      case 'PAYMENT_SUCCESS':
      case 'PAYMENT_FAILED':
        return (
          <Button
            href={`${baseUrl}/dashboard/subscription`}
            style={buttonStyle}
          >
            サブスクリプション管理
          </Button>
        );
      case 'USAGE_LIMIT_WARNING':
      case 'USAGE_LIMIT_EXCEEDED':
        return (
          <Button href={`${baseUrl}/dashboard/usage`} style={buttonStyle}>
            使用量を確認する
          </Button>
        );
      case 'CERTIFICATE_ISSUED':
        return (
          <Button
            href={`${baseUrl}/certificates/${data?.certificateId}`}
            style={buttonStyle}
          >
            証明書を確認する
          </Button>
        );
      default:
        return (
          <Button href={`${baseUrl}/dashboard`} style={buttonStyle}>
            ダッシュボードを開く
          </Button>
        );
    }
  };

  const getNotificationColor = () => {
    switch (type) {
      case 'PAYMENT_FAILED':
      case 'USAGE_LIMIT_EXCEEDED':
        return '#dc2626'; // red
      case 'USAGE_LIMIT_WARNING':
        return '#f59e0b'; // amber
      case 'QUIZ_COMPLETED':
      case 'CERTIFICATE_ISSUED':
      case 'PAYMENT_SUCCESS':
        return '#059669'; // green
      case 'SUBSCRIPTION_CREATED':
      case 'QUIZ_PUBLISHED':
        return '#2563eb'; // blue
      default:
        return '#6366f1'; // indigo
    }
  };

  return (
    <Html>
      <Head />
      <Preview>{title}</Preview>
      <Tailwind>
        <Body style={bodyStyle}>
          <Container style={containerStyle}>
            {/* Header */}
            <Section style={headerStyle}>
              <Img
                src={`${baseUrl}/logo-email.png`}
                width="40"
                height="40"
                alt="ExamForge"
                style={{ margin: '0 auto', display: 'block' }}
              />
              <Heading
                style={{ ...headingStyle, color: getNotificationColor() }}
              >
                ExamForge
              </Heading>
            </Section>

            {/* Main Content */}
            <Section style={contentStyle}>
              <Heading style={titleStyle}>{title}</Heading>

              <Text style={greetingStyle}>{userName}さん</Text>

              {/* Notification content */}
              <div
                style={messageStyle}
                dangerouslySetInnerHTML={{ __html: content }}
              />

              {/* Action Button */}
              <Section style={buttonSectionStyle}>{getActionButton()}</Section>

              {/* Additional Info */}
              {data?.additionalInfo && (
                <Section style={infoStyle}>
                  <Text style={infoTextStyle}>{data.additionalInfo}</Text>
                </Section>
              )}
            </Section>

            {/* Footer */}
            <Section style={footerStyle}>
              <Text style={footerTextStyle}>
                この通知メールは ExamForge から自動送信されています。
              </Text>
              <Text style={footerTextStyle}>
                通知設定は{' '}
                <Link
                  href={`${baseUrl}/dashboard/settings/notifications`}
                  style={linkStyle}
                >
                  こちら
                </Link>{' '}
                から変更できます。
              </Text>
              <Text style={footerTextStyle}>
                <Link href={`${baseUrl}`} style={linkStyle}>
                  ExamForge
                </Link>{' '}
                © 2025 ExamForge Inc. All rights reserved.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

// Styles
const bodyStyle = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const containerStyle = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '580px',
};

const headerStyle = {
  padding: '32px 24px',
  textAlign: 'center' as const,
  borderBottom: '1px solid #e5e7eb',
};

const headingStyle = {
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '8px 0 0 0',
};

const contentStyle = {
  padding: '32px 24px',
};

const titleStyle = {
  fontSize: '20px',
  fontWeight: '600',
  margin: '0 0 16px 0',
  color: '#111827',
};

const greetingStyle = {
  fontSize: '16px',
  margin: '0 0 24px 0',
  color: '#374151',
};

const messageStyle = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#374151',
  marginBottom: '32px',
};

const buttonSectionStyle = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const buttonStyle = {
  backgroundColor: '#2563eb',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  border: 'none',
};

const infoStyle = {
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
};

const infoTextStyle = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0',
};

const footerStyle = {
  borderTop: '1px solid #e5e7eb',
  padding: '24px',
  textAlign: 'center' as const,
};

const footerTextStyle = {
  fontSize: '12px',
  color: '#6b7280',
  margin: '4px 0',
};

const linkStyle = {
  color: '#2563eb',
  textDecoration: 'none',
};

export default NotificationEmail;
