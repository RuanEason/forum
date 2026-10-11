import { brandName, isEmailConfigured, sendEmail } from "@/lib/email-transport";
import { getSiteOriginOrThrow } from "@/lib/site-url";

function isMailConfigured(): boolean {
  return isEmailConfigured();
}

function buildHtml(options: {
  title: string;
  description: string;
  actionLabel: string;
  actionUrl: string;
  expiry: string;
}): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${options.title}</title>
  </head>
  <body style="margin:0;padding:32px 16px;background:#f3f5f7;font-family:Arial,sans-serif;color:#111827;">
    <main style="max-width:620px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:12px;">
      <h1 style="margin:0;font-size:24px;">${options.title}</h1>
      <p style="margin:20px 0 0;line-height:1.7;">${options.description}</p>
      <p style="margin:24px 0;text-align:center;">
        <a href="${options.actionUrl}" style="display:inline-block;padding:12px 20px;border-radius:8px;background:#4f46e5;color:#fff;text-decoration:none;font-weight:600;">${options.actionLabel}</a>
      </p>
      <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.7;">This link ${options.expiry}. If you did not request this, ignore this email.</p>
      <p style="margin:20px 0 0;color:#9ca3af;font-size:12px;">${brandName}</p>
    </main>
  </body>
</html>`;
}

/**
 * 发送账号安全类邮件（重置密码、更换邮箱验证）
 *
 * @param options - 收件人、主题、正文文案与跳转路径
 * @throws {Error} 邮件服务未配置或 Resend 发送失败时抛出
 */
async function sendSecurityEmail(options: {
  email: string;
  subject: string;
  title: string;
  description: string;
  actionLabel: string;
  actionPath: string;
  expiry: string;
}): Promise<void> {
  if (!isMailConfigured()) {
    throw new Error("Resend configuration is incomplete");
  }

  const origin = getSiteOriginOrThrow({ allowLocalhost: true });
  const actionUrl = `${origin}${options.actionPath}`;
  const text = [
    options.title,
    "",
    options.description,
    actionUrl,
    `This link ${options.expiry}.`,
  ].join("\n");

  await sendEmail({
    to: options.email,
    subject: options.subject,
    text,
    html: buildHtml({ ...options, actionUrl }),
  });
}

export function isSecurityMailConfigured(): boolean {
  return isMailConfigured();
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  await sendSecurityEmail({
    email,
    subject: `${brandName} password reset`,
    title: `${brandName} password reset`,
    description: "We received a request to reset your forum password.",
    actionLabel: "Reset password",
    actionPath: `/auth/reset-password?token=${encodeURIComponent(token)}`,
    expiry: "is valid for 30 minutes",
  });
}

export async function sendEmailChangeVerificationEmail(email: string, token: string): Promise<void> {
  await sendSecurityEmail({
    email,
    subject: `${brandName} verify your new email`,
    title: `${brandName} email change verification`,
    description: "We received a request to use this address as your forum login email.",
    actionLabel: "Verify new email",
    actionPath: `/auth/confirm-email-change?token=${encodeURIComponent(token)}`,
    expiry: "is valid for 30 minutes",
  });
}
