/**
 * Resend 迁移验证脚本
 *
 * 直接调用项目里的真实邮件模块，而不是裸调 Resend API，
 * 这样可以验证 email-transport / mailer / security-mailer 的完整链路。
 *
 * 用法: node scripts/test-resend.mjs [收件人邮箱]
 */

import { readFileSync } from "node:fs";
import { register } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

// 读取 .env —— 项目没有引入 dotenv，这里手动解析
const envText = readFileSync(new URL("../.env", import.meta.url), "utf8");
for (const line of envText.split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (!match) continue;
  const key = match[1];
  let value = match[2].trim();
  // 去掉包裹的引号
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  if (!process.env[key]) process.env[key] = value;
}

const recipient = process.argv[2] || "3630987098@qq.com";

// 注册一个极简的解析钩子，把 "@/xxx" 别名映射到 src/xxx，
// 否则 mailer.ts 里的 `@/lib/email-transport` 无法被 Node 解析。
const srcUrl = new URL("../src/", import.meta.url).href;
register(
  "data:text/javascript," +
    encodeURIComponent(`
      import { fileURLToPath } from "node:url";
      const srcUrl = ${JSON.stringify(srcUrl)};
      export async function resolve(specifier, context, nextResolve) {
        if (specifier.startsWith("@/")) {
          const url = new URL(specifier.slice(2), srcUrl).href;
          try {
            return await nextResolve(url, context);
          } catch {
            // TS 源码里的相对导入不带扩展名，这里补上 .ts
            return nextResolve(url + ".ts", context);
          }
        }
        return nextResolve(specifier, context);
      }
    `),
  import.meta.url,
);

const mailerUrl = pathToFileURL(fileURLToPath(new URL("../src/lib/mailer.ts", import.meta.url)));

console.log("=== 配置检查 ===");
console.log("RESEND_API_KEY:", process.env.RESEND_API_KEY ? "已设置 (" + process.env.RESEND_API_KEY.slice(0, 8) + "...)" : "❌ 未设置");
console.log("MAIL_FROM:", process.env.MAIL_FROM || "❌ 未设置");
console.log("收件人:", recipient);
console.log("");

const { isMailConfigured, sendVerificationCodeEmail } = await import(mailerUrl.href);

console.log("=== isMailConfigured() ===");
console.log(isMailConfigured() ? "✅ 邮件服务已配置" : "❌ 邮件服务未配置");
console.log("");

const code = String(Math.floor(100000 + Math.random() * 900000));

console.log("=== 发送注册验证码邮件 ===");
console.log("验证码:", code);
try {
  await sendVerificationCodeEmail(recipient, code);
  console.log("✅ 发送成功，请检查收件箱（含垃圾箱）");
} catch (error) {
  console.error("❌ 发送失败:", error.message);
  process.exitCode = 1;
}
