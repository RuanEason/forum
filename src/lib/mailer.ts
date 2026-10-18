import { brandName, forumName, isEmailConfigured, sendEmail } from "@/lib/email-transport";
import { buildEmailHtml, joinPlainText } from "@/lib/email-layout";

/** 验证码有效期（分钟），与 emailVerification.ts 中的 CODE_EXPIRE_SECONDS 保持一致 */
const CODE_EXPIRE_MINUTES = 5;

/**
 * 判断注册验证码邮件是否可发送
 *
 * @returns 已配置 Resend API Key 与发件人地址返回 true
 */
export function isMailConfigured(): boolean {
  return isEmailConfigured();
}

/**
 * 发送注册邮箱验证码
 *
 * @param email - 收件人邮箱
 * @param code - 6 位数字验证码
 * @throws {Error} 邮件服务未配置或 Resend 发送失败时抛出
 * @example
 * await sendVerificationCodeEmail("user@example.com", "849206");
 */
export async function sendVerificationCodeEmail(email: string, code: string): Promise<void> {
  if (!isMailConfigured()) {
    throw new Error("Resend configuration is incomplete");
  }

  const title = "邮箱验证码";
  const paragraphs = [
    `你正在使用 <strong>${brandName}</strong> 名下的 <strong>${forumName}</strong> 论坛相关服务，以下是你本次操作所需的信息。`,
    "请将下方验证码填写到注册页面，完成邮箱验证：",
  ];

  const html = buildEmailHtml({
    title,
    paragraphs,
    highlight: {
      label: "Verification Code / 验证码",
      content: code,
      hint: `该代码将在 ${CODE_EXPIRE_MINUTES} 分钟后失效，请勿泄露给他人。`,
      monospace: true,
    },
  });

  const text = joinPlainText([
    `${forumName} ${title}`,
    "",
    `你正在使用 ${brandName} 名下的 ${forumName} 论坛相关服务。`,
    "请将下方验证码填写到注册页面，完成邮箱验证：",
    "",
    `验证码：${code}`,
    `该代码将在 ${CODE_EXPIRE_MINUTES} 分钟后失效，请勿泄露给他人。`,
    "",
    "此邮件由系统自动发送，请勿直接回复本邮箱。",
  ]);

  await sendEmail({
    to: email,
    subject: `${forumName} ${title}`,
    text,
    html,
  });
}
