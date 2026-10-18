import { Resend } from "resend";

/**
 * 邮件发送底层传输层
 *
 * 历史实现使用 nodemailer + QQ 邮箱 SMTP，现已迁移到 Resend HTTP API。
 * 选择 HTTP API 的原因：
 * - 无需维护 SMTP 长连接与授权码，Serverless 环境下连接更稳定
 * - 使用已绑定并完成 DNS 验证的自有域名发信，投递率与信誉更好
 * - 通过 HTTP 200 + 响应体中的 id 判断成功，失败原因（域名未验证、配额超限、API Key 无效等）明确可见
 *
 * 该模块只负责「把一封邮件发出去」，具体的 HTML 模板由 mailer.ts / security-mailer.ts 负责。
 */

/** Resend API 基础地址，可通过环境变量覆盖以便走代理或自建网关 */
const resendBaseUrl = process.env.RESEND_BASE_URL || undefined;

/** RESEND_API_KEY 仅服务端可见，绝不能添加 NEXT_PUBLIC_ 前缀 */
const resendApiKey = process.env.RESEND_API_KEY;

/**
 * Resend 客户端单例
 *
 * 未配置 API Key 时保持为 null，由 isEmailConfigured() 统一拦截，
 * 避免在模块加载阶段直接抛错导致整个应用启动失败。
 */
const resend = resendApiKey ? new Resend(resendApiKey, resendBaseUrl ? { baseUrl: resendBaseUrl } : undefined) : null;

/** 发件人地址，必须是已在 Resend 完成验证的域名，如 "RUAN <no-reply@your-domain.com>" */
const mailFrom = process.env.MAIL_FROM || "";

/**
 * 品牌署名，用于邮件 Logo、落款、页脚与发件人身份（属于开发者本人，如 RUAN）
 *
 * 注意：它**不是**论坛的名字，正文中提到服务时请用 forumName。
 */
export const brandName = process.env.MAIL_BRAND_NAME || "RUAN";

/**
 * 论坛名称，用于正文中描述用户正在使用的服务（如 Slept）
 *
 * 正文示例：「你正在使用 RUAN 名下的 Slept 论坛相关服务」
 */
export const forumName = process.env.MAIL_FORUM_NAME || "SLEPT";

/**
 * 判断邮件服务是否已完成配置
 *
 * 需要同时具备 API Key 与合法发件人地址，两者缺一都会导致 Resend 拒绝请求。
 *
 * @returns 配置完整返回 true，否则返回 false
 */
export function isEmailConfigured(): boolean {
  return Boolean(resendApiKey && mailFrom);
}

/** 单封邮件的发送参数 */
export interface SendEmailOptions {
  /** 收件人邮箱 */
  to: string;
  /** 邮件主题 */
  subject: string;
  /** 纯文本正文（用于不支持 HTML 的客户端） */
  text: string;
  /** HTML 正文 */
  html: string;
}

/**
 * 通过 Resend 发送一封邮件
 *
 * Resend SDK 不会抛出异常，而是把失败信息放在返回值的 error 字段中，
 * 因此这里必须显式检查 error 并转为异常，让上层 API 路由能够捕获并记录日志。
 *
 * @param options - 收件人、主题与正文
 * @throws {Error} 未配置邮件服务时抛出，或 Resend 返回错误时抛出（含错误码与原因）
 * @example
 * await sendEmail({ to: "a@b.com", subject: "hi", text: "hi", html: "<p>hi</p>" });
 */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
  if (!isEmailConfigured() || !resend) {
    throw new Error("Resend configuration is incomplete: RESEND_API_KEY and MAIL_FROM are required");
  }

  const { data, error } = await resend.emails.send({
    from: mailFrom,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });

  if (error) {
    // 保留 Resend 返回的原始错误码（如 invalid_from_address、daily_quota_exceeded），便于线上排查
    throw new Error(`Resend send failed [${error.name}]: ${error.message}`);
  }

  if (!data?.id) {
    throw new Error("Resend send failed: empty response");
  }
}
