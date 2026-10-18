import { brandName, forumName, isEmailConfigured, sendEmail } from "@/lib/email-transport";
import { buildEmailHtml, joinPlainText } from "@/lib/email-layout";
import { getSiteOriginOrThrow } from "@/lib/site-url";

/**
 * 判断账号安全类邮件是否可发送
 *
 * @returns 已配置 Resend API Key 与发件人地址返回 true
 */
function isMailConfigured(): boolean {
  return isEmailConfigured();
}

/**
 * 发送账号安全类邮件（重置密码、更换邮箱验证）
 *
 * 按钮只跳转论坛自身的功能页面，不包含任何外部推广入口。
 *
 * @param options - 收件人、主题、正文文案与跳转路径
 * @throws {Error} 邮件服务未配置或 Resend 发送失败时抛出
 */
async function sendSecurityEmail(options: {
  email: string;
  subject: string;
  title: string;
  paragraphs: string[];
  actionLabel: string;
  actionPath: string;
  hint: string;
}): Promise<void> {
  if (!isMailConfigured()) {
    throw new Error("Resend configuration is incomplete");
  }

  const origin = getSiteOriginOrThrow({ allowLocalhost: true });
  const actionUrl = `${origin}${options.actionPath}`;

  const html = buildEmailHtml({
    title: options.title,
    paragraphs: options.paragraphs,
    highlight: {
      label: "Action Required / 请及时处理",
      content: options.hint,
    },
    action: {
      label: options.actionLabel,
      url: actionUrl,
    },
    actionFallbackLabel: "如果按钮无法点击，请复制以下链接在浏览器中打开：",
  });

  const text = joinPlainText([
    `${brandName} ${options.title}`,
    "",
    ...options.paragraphs.map((paragraph) => paragraph.replace(/<[^>]+>/g, "")),
    "",
    `${options.actionLabel}：${actionUrl}`,
    options.hint,
    "",
    "此邮件由系统自动发送，请勿直接回复本邮箱。",
  ]);

  await sendEmail({
    to: options.email,
    subject: options.subject,
    text,
    html,
  });
}

/**
 * 判断账号安全类邮件服务是否已配置
 *
 * @returns 已配置返回 true
 */
export function isSecurityMailConfigured(): boolean {
  return isMailConfigured();
}

/**
 * 发送重置密码邮件
 *
 * @param email - 收件人邮箱
 * @param token - 重置令牌
 * @throws {Error} 邮件服务未配置或 Resend 发送失败时抛出
 */
export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  await sendSecurityEmail({
    email,
    subject: `${forumName} 重置密码`,
    title: "重置密码",
    paragraphs: [
      `你正在使用 <strong>${brandName}</strong> 名下的 <strong>${forumName}</strong> 论坛相关服务，我们收到了一个重置你账号密码的请求。`,
      "点击下方按钮即可设置新密码：",
    ],
    actionLabel: "重置密码",
    actionPath: `/auth/reset-password?token=${encodeURIComponent(token)}`,
    hint: "该链接将在 30 分钟后失效，请勿转发给他人。",
  });
}

/**
 * 发送更换邮箱的验证邮件
 *
 * @param email - 收件人邮箱（待绑定的新邮箱）
 * @param token - 验证令牌
 * @throws {Error} 邮件服务未配置或 Resend 发送失败时抛出
 */
export async function sendEmailChangeVerificationEmail(email: string, token: string): Promise<void> {
  await sendSecurityEmail({
    email,
    subject: `${forumName} 确认新邮箱`,
    title: "确认新邮箱",
    paragraphs: [
      `你正在使用 <strong>${brandName}</strong> 名下的 <strong>${forumName}</strong> 论坛相关服务，我们收到了将这个邮箱绑定为论坛登录邮箱的请求。`,
      "点击下方按钮即可完成确认：",
    ],
    actionLabel: "确认新邮箱",
    actionPath: `/auth/confirm-email-change?token=${encodeURIComponent(token)}`,
    hint: "该链接将在 30 分钟后失效。如果不是你本人的操作，请忽略此邮件。",
  });
}
