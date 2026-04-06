import { Resend } from 'resend';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: { filename: string, content: string | Buffer }[];
}

export async function sendEmail({ to, subject, html, attachments }: SendEmailOptions) {
  const isSmtpEnabled = !!(process.env.SMTP_HOST && process.env.SMTP_USER);

  if (isSmtpEnabled) {
    // Dynamic import so webpack doesn't fail if nodemailer isn't hoisted
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Afterword" <noreply@example.com>',
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      attachments,
    });

    return { success: true, id: info.messageId };
  } else if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM || 'Afterword <noreply@example.com>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      attachments,
    });

    if (error) {
      console.error('Resend Error:', error);
      throw new Error(error.message);
    }
    return { success: true, id: data?.id };
  } else {
    // Fallback: log to console in local development
    console.warn('[EMAIL DISABLED] No SMTP or Resend config found. Set RESEND_API_KEY or SMTP_HOST to send real emails.');
    console.log(`[SIMULATED EMAIL] To: ${Array.isArray(to) ? to.join(', ') : to} | Subject: ${subject}`);
    return { success: true, simulated: true };
  }
}
