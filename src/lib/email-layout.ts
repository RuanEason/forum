import { brandName } from "@/lib/email-transport";

/**
 * 邮件 HTML 布局骨架
 *
 * 设计来源：RUAN 的浅灰卡片风格（白卡片 + 黑蓝渐变装饰条 + 等宽验证码框 + 落款印章）。
 *
 * 邮件客户端兼容性说明（重要）：
 * - 内联 SVG 在 Gmail / Outlook / QQ 邮箱中基本不渲染，因此图标一律走 `<img>` + 真实 HTTP URL
 * - Gmail 会通过代理重写 `<img src>`，并直接丢弃 `data:` URI，所以不能用 data URI 塞图
 * - 布局全部使用 `<table>` + 内联样式，不依赖 `<style>` 标签与 flex/grid
 * - 渐变装饰条用 background-image 实现，Outlook 不支持时退化为纯色 background-color
 */

/** 邮件主色板，与 RUAN 模板保持一致 */
const palette = {
  /** 页面背景 */
  pageBg: "#f4f4f5",
  /** 卡片背景 */
  cardBg: "#ffffff",
  /** 卡片描边 */
  border: "#e4e4e7",
  /** 主文字 */
  text: "#18181b",
  /** 正文段落文字 */
  paragraph: "#3f3f46",
  /** 次要文字 */
  muted: "#71717a",
  /** 极浅文字 */
  faint: "#a1a1aa",
  /** 高亮框背景 */
  panelBg: "#fafafa",
  /** 分割线 */
  divider: "#f4f4f5",
  /** 底栏背景 */
  footerBg: "#fafafa",
} as const;

/** 邮件图标最大显示尺寸（像素） */
const LOGO_SIZE = 28;

/**
 * 判断是否配置了可用的 logo 图片地址
 *
 * 只接受 http/https 绝对地址：相对路径在邮件里无法解析，
 * data: URI 会被 Gmail 丢弃，二者都不可用。
 *
 * @returns 可用于邮件 `<img src>` 的绝对地址，未配置则返回空字符串
 */
function getLogoSrc(): string {
  const raw = (process.env.MAIL_LOGO_URL || "").trim();
  return /^https?:\/\//i.test(raw) ? raw : "";
}

/** 构建邮件骨架所需的内容参数 */
export interface EmailLayoutOptions {
  /** 邮件标题（同时用于 `<title>` 与主标题） */
  title: string;
  /** 正文段落数组，按顺序渲染 */
  paragraphs: string[];
  /** 可选：高亮信息框（验证码、状态说明等） */
  highlight?: {
    /** 小标题，如 "Verification Code / 验证码" */
    label: string;
    /** 主体内容，等宽大字号显示 */
    content: string;
    /** 内容下方的小字提示 */
    hint?: string;
    /** 内容是否使用等宽字体且带字间距（验证码场景为 true） */
    monospace?: boolean;
  };
  /** 可选：行动按钮（重置密码、确认邮箱变更等），仅跳转论坛自身地址 */
  action?: {
    /** 按钮文案 */
    label: string;
    /** 按钮跳转地址 */
    url: string;
  };
  /** 可选：按钮下方的备用链接提示（部分客户端按钮不可点时复制此链接） */
  actionFallbackLabel?: string;
}

/**
 * 渲染完整的邮件 HTML
 *
 * @param options - 标题、段落、可选高亮框与可选行动按钮
 * @returns 可直接交给 Resend 发送的完整 HTML 文档
 * @example
 * buildEmailHtml({ title: "验证码", paragraphs: ["你好"], highlight: { label: "验证码", content: "123456", monospace: true } });
 */
export function buildEmailHtml(options: EmailLayoutOptions): string {
  const year = new Date().getFullYear();
  const logoSrc = getLogoSrc();

  // logo 优先用图片；未配置时退化为黑底圆角方块，不依赖任何外部资源
  const logoHtml = logoSrc
    ? `<img src="${logoSrc}" alt="${brandName}" width="${LOGO_SIZE}" height="${LOGO_SIZE}" style="vertical-align: middle; margin-right: 8px; display: inline-block; border: none; border-radius: 7px; width: ${LOGO_SIZE}px; height: ${LOGO_SIZE}px; object-fit: cover;" />`
    : `<span style="display: inline-block; width: ${LOGO_SIZE}px; height: ${LOGO_SIZE}px; line-height: ${LOGO_SIZE}px; text-align: center; background-color: ${palette.text}; color: #ffffff; border-radius: 7px; font-size: 17px; font-weight: 700; vertical-align: middle; margin-right: 8px;">R</span>`;

  const paragraphsHtml = options.paragraphs
    .map(
      (paragraph) =>
        `<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.65; color: ${palette.paragraph};">${paragraph}</p>`,
    )
    .join("\n");

  const highlightHtml = options.highlight
    ? `
              <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: ${palette.panelBg}; border: 1px solid ${palette.border}; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <div style="font-size: 12px; font-weight: 600; letter-spacing: 0.08em; color: ${palette.muted}; margin-bottom: 8px;">
                      ${options.highlight.label}
                    </div>
                    <div style="font-family: ${options.highlight.monospace ? "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace" : "inherit"}; font-size: ${options.highlight.monospace ? "28px" : "18px"}; font-weight: 700; letter-spacing: ${options.highlight.monospace ? "0.2em" : "normal"}; color: ${palette.text}; word-break: break-all;">
                      ${options.highlight.content}
                    </div>
                    ${
                      options.highlight.hint
                        ? `<div style="font-size: 12px; color: ${palette.faint}; margin-top: 8px;">${options.highlight.hint}</div>`
                        : ""
                    }
                  </td>
                </tr>
              </table>`
    : "";

  const actionHtml = options.action
    ? `
              <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 28px;">
                <tr>
                  <td align="left">
                    <a href="${options.action.url}" target="_blank" style="display: inline-block; background-color: ${palette.text}; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 8px;">
                      ${options.action.label}
                    </a>
                  </td>
                </tr>
              </table>
              ${
                options.actionFallbackLabel
                  ? `<p style="margin: -12px 0 24px 0; font-size: 12px; line-height: 1.6; color: ${palette.faint}; word-break: break-all;">
                如果按钮无法点击，请复制以下链接在浏览器中打开：<br>${options.action.url}
              </p>`
                  : ""
              }`
    : "";

  return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>${options.title}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: ${palette.pageBg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; color: ${palette.text};">
    <!-- 顶部预览摘要（收件箱列表显示的隐藏文字） -->
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">${options.title}</div>

    <!-- 外层背景容器 -->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: ${palette.pageBg};">
      <tr>
        <td align="center" style="padding: 40px 16px;">

          <!-- 核心卡片容器 (最大宽度 560px) -->
          <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 560px; width: 100%; background-color: ${palette.cardBg}; border: 1px solid ${palette.border}; border-radius: 16px; overflow: hidden;">

            <!-- 顶部品牌装饰条 -->
            <tr>
              <td bgcolor="${palette.text}" style="height: 4px; line-height: 4px; font-size: 0; background-color: ${palette.text}; background-image: linear-gradient(90deg, #18181b 0%, #3b82f6 100%);">&nbsp;</td>
            </tr>

            <!-- Header: 品牌标识区 -->
            <tr>
              <td style="padding: 32px 36px 20px 36px;">
                ${logoHtml}<span style="font-size: 18px; font-weight: 700; letter-spacing: -0.03em; color: ${palette.text}; vertical-align: middle;">${brandName}</span>
              </td>
            </tr>

            <!-- 正文主内容区 -->
            <tr>
              <td style="padding: 12px 36px 32px 36px;">
                <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; color: ${palette.text}; line-height: 1.4;">
                  ${options.title}
                </h1>

                ${paragraphsHtml}
                ${highlightHtml}
                ${actionHtml}

                <!-- 分割线 -->
                <hr style="border: none; border-top: 1px solid ${palette.divider}; margin: 28px 0 24px 0;" />

                <!-- 个人落款区 -->
                <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 600; color: ${palette.text};">
                  Best regards,
                </p>
                <p style="margin: 0; font-size: 14px; color: #52525b;">
                  <strong style="color: ${palette.text};">${brandName}</strong>
                </p>
              </td>
            </tr>

            <!-- Footer: 底部边栏 -->
            <tr>
              <td style="background-color: ${palette.footerBg}; border-top: 1px solid ${palette.divider}; padding: 20px 36px;">
                <div style="font-size: 12px; color: ${palette.faint}; line-height: 1.6;">
                  此邮件由系统自动发送，请勿直接回复本邮箱。
                </div>
              </td>
            </tr>

          </table>
          <!-- 核心卡片容器结束 -->

          <!-- 卡片外底部版权声明 -->
          <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 560px; width: 100%; margin-top: 20px;">
            <tr>
              <td align="center" style="font-size: 12px; color: ${palette.faint};">
                © ${year} ${brandName}. All rights reserved.
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * 把正文段落转成纯文本版本
 *
 * @param lines - 逐行文本
 * @returns 以换行连接的纯文本，用于不支持 HTML 的客户端
 */
export function joinPlainText(lines: string[]): string {
  return lines.join("\n");
}
