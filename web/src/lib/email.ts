import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not defined');
}

if (!process.env.RESEND_FROM_EMAIL) {
  throw new Error('RESEND_FROM_EMAIL is not defined');
}

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  react?: React.ReactElement;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  react,
}: EmailOptions) {
  try {
    const data = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      react,
    });

    console.log('Email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
}

export { resend };
