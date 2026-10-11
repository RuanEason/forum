import { brandName, isEmailConfigured, sendEmail } from "@/lib/email-transport";

const brandLogoUrl = process.env.MAIL_LOGO_URL || "";

/**
 * 判断注册验证码邮件是否可发送
 *
 * @returns 已配置 Resend API Key 与发件人地址返回 true
 */
export function isMailConfigured(): boolean {
  return isEmailConfigured();
}

function buildVerificationEmailHtml(code: string): string {
  const year = new Date().getFullYear();
  const logoHtml = brandLogoUrl
    ? `<img src="${brandLogoUrl}" alt="${brandName} Logo" width="56" height="56" style="display:block;width:56px;height:56px;border-radius:999px;background-color:#ffffff;object-fit:cover;" />`
    : `<div style="width:56px;height:56px;border-radius:999px;background-color:#ffffff;font-size:28px;font-weight:700;color:#1d4ed8;line-height:56px;text-align:center;">S</div>`;

  return `
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${brandName} 注册验证码</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f3f5f7;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f3f5f7;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:620px;background-color:#ffffff;overflow:hidden;">
            <tr>
              <td align="center" style="padding:32px 24px 18px;background:gray;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center">
                      ${logoHtml}
                    </td>
                  </tr>
                </table>
                <div style="margin-top:14px;font-size:22px;line-height:30px;font-weight:700;color:#ffffff;">
                  ${brandName} 邮箱验证码
                </div>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:30px 24px 24px;">
                <div style="font-size:16px;line-height:26px;color:#111827;text-align:center;">
                  你好，欢迎注册 ${brandName} 论坛
                </div>
                <div style="margin-top:10px;font-size:15px;line-height:24px;color:#4b5563;text-align:center;">
                  请输入以下验证码完成邮箱验证
                </div>
                <div style="margin-top:20px;display:inline-block;padding:14px 22px;border-radius:12px;border:1px solid #dbe3ff;background-color:#f7f9ff;">
                  <span style="font-size:34px;line-height:40px;letter-spacing:8px;font-weight:700;color:gray;">${code}</span>
                </div>
                <div style="margin-top:16px;font-size:13px;line-height:22px;color:#6b7280;text-align:center;">
                  验证码 5 分钟内有效，请勿泄露给他人
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:0 24px;">
                <div style="height:1px;background-color:#e5e7eb;"></div>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:20px 24px 28px;">
                <div style="font-size:12px;line-height:20px;color:#9ca3af;text-align:center;">
                  本邮件由系统自动发送，请勿直接回复
                </div>
                <div style="margin-top:6px;font-size:12px;line-height:20px;color:#9ca3af;text-align:center;">
                  © ${year} ${brandName} 版权所有
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}

/**
 * 发送注册邮箱验证码
 *
 * @param email - 收件人邮箱
 * @param code - 6 位数字验证码
 * @throws {Error} 邮件服务未配置或 Resend 发送失败时抛出
 */
export async function sendVerificationCodeEmail(email: string, code: string): Promise<void> {
  if (!isMailConfigured()) {
    throw new Error("Resend configuration is incomplete");
  }

  const html = buildVerificationEmailHtml(code);
  const text = [
    `${brandName} 邮箱验证码`,
    "",
    `你的验证码是：${code}`,
    "验证码 5 分钟内有效，请勿泄露给他人。",
    "",
    `© ${new Date().getFullYear()} ${brandName} 版权所有`,
  ].join("\n");

  await sendEmail({
    to: email,
    subject: `${brandName} 注册验证码`,
    text,
    html,
  });
}
