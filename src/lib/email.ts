import { Resend } from "resend";
import { env } from "@/lib/env";

const resend = new Resend(env.RESEND_API_KEY);

export interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(args: SendEmailArgs): Promise<void> {
  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
  });
  if (error) {
    throw new Error(`Resend send failed: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export async function sendVerificationEmail(args: {
  to: string;
  name: string;
  verifyUrl: string;
}): Promise<void> {
  const html = `<!doctype html>
<html>
  <body style="font-family: ui-sans-serif, system-ui, sans-serif; background: #F5EFE0; padding: 32px;">
    <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px;">
      <h1 style="color: #1A1A1A; margin: 0 0 16px;">Verify your email</h1>
      <p style="color: #1A1A1A; line-height: 1.5;">Hi ${escapeHtml(args.name)},</p>
      <p style="color: #1A1A1A; line-height: 1.5;">
        Welcome to Network Nerd! Click the button below to verify your email address and activate your account. This link expires in 24 hours.
      </p>
      <p style="margin: 24px 0;">
        <a href="${args.verifyUrl}" style="display: inline-block; padding: 12px 20px; background: #4FB8B5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">Verify email address</a>
      </p>
      <p style="color: #555; font-size: 14px; line-height: 1.5;">
        If you didn't create a Network Nerd account, you can safely ignore this email.
      </p>
    </div>
  </body>
</html>`;

  const text = `Hi ${args.name},\n\nWelcome to Network Nerd! Verify your email by visiting:\n${args.verifyUrl}\n\nThis link expires in 24 hours. If you didn't create an account, ignore this email.\n`;

  await sendEmail({
    to: args.to,
    subject: "Verify your Network Nerd email address",
    html,
    text,
  });
}

export async function sendPasswordResetEmail(args: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<void> {
  const html = `<!doctype html>
<html>
  <body style="font-family: ui-sans-serif, system-ui, sans-serif; background: #F5EFE0; padding: 32px;">
    <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px;">
      <h1 style="color: #1A1A1A; margin: 0 0 16px;">Reset your password</h1>
      <p style="color: #1A1A1A; line-height: 1.5;">Hi ${escapeHtml(args.name)},</p>
      <p style="color: #1A1A1A; line-height: 1.5;">
        We received a request to reset your Network Nerd password. Click the button below to choose a new one. This link expires in 30 minutes.
      </p>
      <p style="margin: 24px 0;">
        <a href="${args.resetUrl}" style="display: inline-block; padding: 12px 20px; background: #4FB8B5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">Reset password</a>
      </p>
      <p style="color: #555; font-size: 14px; line-height: 1.5;">
        If you didn't request this, you can safely ignore this email — your password won't change.
      </p>
    </div>
  </body>
</html>`;

  const text = `Hi ${args.name},\n\nReset your Network Nerd password by visiting:\n${args.resetUrl}\n\nThis link expires in 30 minutes. If you didn't request this, ignore this email.\n`;

  await sendEmail({
    to: args.to,
    subject: "Reset your Network Nerd password",
    html,
    text,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
