'use server';

import { Resend } from 'resend';
import { render } from '@react-email/render';
import PasswordResetEmail from '@/components/emails/PasswordResetEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendPasswordResetEmailProps {
  to: string;
  resetUrl: string;
  userName: string;
  expiresAt: Date;
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
  userName,
  expiresAt,
}: SendPasswordResetEmailProps): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return {
        success: false,
        error: 'メール送信サービスが設定されていません',
      };
    }

    const emailHtml = await render(
      PasswordResetEmail({
        userName,
        resetUrl,
        expiresAt,
      })
    );

    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'ExamForge <noreply@examforge.com>',
      to: [to],
      subject: 'パスワードリセットのご案内 - ExamForge',
      html: emailHtml,
    });

    if (error) {
      console.error('Email sending error:', error);
      return { success: false, error: 'メールの送信に失敗しました' };
    }

    console.log('Password reset email sent successfully:', data?.id);
    return { success: true };
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return { success: false, error: 'メールの送信中にエラーが発生しました' };
  }
}

export interface SendWelcomeEmailProps {
  to: string;
  userName: string;
  loginUrl: string;
}

export async function sendWelcomeEmail({
  to,
  userName,
  loginUrl,
}: SendWelcomeEmailProps): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return {
        success: false,
        error: 'メール送信サービスが設定されていません',
      };
    }

    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'ExamForge <noreply@examforge.com>',
      to: [to],
      subject: 'ExamForgeへようこそ！アカウントが作成されました',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1f2937;">ExamForgeへようこそ！</h1>
          <p>こんにちは、${userName}さん</p>
          <p>ExamForgeへのアカウント登録が完了しました。</p>
          <p>以下のボタンからログインして、クイズ作成を始めましょう！</p>
          <a href="${loginUrl}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            ログインする
          </a>
          <p>ご質問がございましたら、お気軽にお問い合わせください。</p>
          <p>ExamForgeチーム</p>
        </div>
      `,
    });

    if (error) {
      console.error('Welcome email sending error:', error);
      return { success: false, error: 'ウェルカムメールの送信に失敗しました' };
    }

    console.log('Welcome email sent successfully:', data?.id);
    return { success: true };
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return {
      success: false,
      error: 'ウェルカムメールの送信中にエラーが発生しました',
    };
  }
}
