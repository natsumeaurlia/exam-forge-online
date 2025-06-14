import { Button, Section, Text } from '@react-email/components';
import { BaseEmailTemplate } from './BaseEmailTemplate';

interface TeamInvitationEmailProps {
  inviterName: string;
  teamName: string;
  inviteUrl: string;
  lng?: string;
}

export const TeamInvitationEmail = ({
  inviterName,
  teamName,
  inviteUrl,
  lng = 'ja',
}: TeamInvitationEmailProps) => {
  const isJapanese = lng === 'ja';

  const preview = isJapanese
    ? `${inviterName}さんからチーム「${teamName}」への招待が届きました`
    : `You've been invited to join team "${teamName}" by ${inviterName}`;

  const heading = isJapanese ? 'チーム招待' : 'Team Invitation';

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
          {isJapanese
            ? `${inviterName}さんからチーム「${teamName}」への招待が届きました。`
            : `${inviterName} has invited you to join the team "${teamName}".`}
        </Text>

        <Text className="mb-6 text-gray-600">
          {isJapanese
            ? 'ExamForgeでクイズやテストを作成・管理できるチームに参加して、一緒に学習体験を向上させましょう。'
            : 'Join our team on ExamForge to create and manage quizzes and tests together, improving the learning experience.'}
        </Text>

        <Section className="mb-6 text-center">
          <Button
            href={inviteUrl}
            className="rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white"
          >
            {isJapanese ? 'チームに参加する' : 'Join Team'}
          </Button>
        </Section>

        <Text className="text-center text-sm text-gray-500">
          {isJapanese
            ? 'このリンクは7日間有効です。期限切れの場合は、チーム管理者に再度招待を依頼してください。'
            : 'This link is valid for 7 days. If it expires, please ask the team administrator to send another invitation.'}
        </Text>
      </Section>
    </BaseEmailTemplate>
  );
};
