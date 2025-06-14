'use server';

import { Resend } from 'resend';

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

    const expirationText = expiresAt.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Tokyo',
    });

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8fafc; padding: 40px 20px; text-align: center;">
          <h1 style="color: #1f2937; margin: 0 0 20px 0;">パスワードリセットのご案内</h1>
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">こんにちは、${userName}さん</p>
            <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">ExamForgeアカウントのパスワードリセットがリクエストされました。</p>
            <p style="color: #374151; line-height: 1.6; margin: 0 0 30px 0;">以下のボタンをクリックして、新しいパスワードを設定してください：</p>
            <a href="${resetUrl}" style="display: inline-block; background-color: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 0 0 30px 0;">パスワードをリセット</a>
            <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 16px; margin: 20px 0;">
              <p style="color: #dc2626; margin: 0; font-size: 14px; font-weight: bold;">⚠️ セキュリティに関する重要な情報</p>
              <ul style="color: #dc2626; font-size: 14px; margin: 10px 0 0 0; padding-left: 20px;">
                <li>このリンクは ${expirationText} まで有効です</li>
                <li>リンクは1回のみ使用可能です</li>
                <li>心当たりがない場合は、このメールを無視してください</li>
              </ul>
            </div>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
              上記のボタンが機能しない場合は、以下のURLをブラウザにコピー＆ペーストしてください：<br />
              <span style="word-break: break-all; color: #3b82f6;">${resetUrl}</span>
            </p>
          </div>
          <div style="margin-top: 30px; padding: 20px; background-color: #f3f4f6; border-radius: 6px;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              このメールはExamForgeから自動送信されています。<br />
              ご質問がございましたら、サポートまでお問い合わせください。
            </p>
          </div>
        </div>
      </div>
    `;

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
