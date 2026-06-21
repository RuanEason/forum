import type { DevToolScenarioDefinition } from "./types";

export const devToolScenarios = [
  {
    id: "github-pending-login",
    category: "认证调试",
    name: "GitHub 待绑定登录态",
    summary: "跳过真实 GitHub OAuth 回调，直接写入待绑定 cookie 并进入账号选择页。",
    description:
      "适用于本地开发环境无法接收公网 GitHub 回调时的调试。它不会创建数据库数据，只会写入一个临时登录态 cookie，供你直接打开 GitHub 新用户/老用户选择页。",
    riskLevel: "low",
    writes: ["cookie", "mock-state"],
    successLabel: "已生成模拟 GitHub 登录态",
    fields: [
      {
        key: "githubUserId",
        label: "GitHub 用户 ID",
        type: "text",
        required: true,
        placeholder: "例如 12345678",
        helperText: "仅用于模拟第三方身份，建议每次调试使用固定值方便复现。",
        defaultValue: "10000001",
      },
      {
        key: "email",
        label: "GitHub 邮箱",
        type: "email",
        placeholder: "you@example.com",
        helperText: "留空时依然可以打开选择页，但无法完整测试“创建新账号”流程。",
        defaultValue: "debug-github@example.com",
      },
      {
        key: "login",
        label: "GitHub 用户名",
        type: "text",
        placeholder: "octocat",
        defaultValue: "debug-octocat",
      },
      {
        key: "name",
        label: "GitHub 显示名称",
        type: "text",
        placeholder: "Debug Octocat",
        defaultValue: "开发调试账号",
      },
      {
        key: "avatar",
        label: "头像 URL",
        type: "url",
        placeholder: "https://avatars.githubusercontent.com/u/1?v=4",
        helperText: "可选。仅用于模拟页面展示，不会持久化。",
      },
      {
        key: "redirectPath",
        label: "登录后跳转地址",
        type: "text",
        required: true,
        placeholder: "/",
        helperText: "建议填写站内路径，例如 `/settings`、`/post/create`。",
        defaultValue: "/",
      },
    ],
  },
] satisfies DevToolScenarioDefinition[];

export function getDevToolScenarioById(id: string) {
  return devToolScenarios.find((scenario) => scenario.id === id) ?? null;
}
