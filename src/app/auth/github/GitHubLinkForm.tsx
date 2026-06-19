"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

type PendingGitHubLogin = {
  githubUserId: string;
  email: string | null;
  name: string | null;
  avatar: string | null;
  login: string | null;
  redirectPath: string;
};

type GitHubLinkFormProps = {
  pending: PendingGitHubLogin;
};

export default function GitHubLinkForm({ pending }: GitHubLinkFormProps) {
  const router = useRouter();
  const unavailableText = "未提供";
  const [registerName, setRegisterName] = useState(pending.name ?? "");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [bindEmail, setBindEmail] = useState(pending.email ?? "");
  const [bindPassword, setBindPassword] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [bindLoading, setBindLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [bindError, setBindError] = useState("");

  const handleRegister = async () => {
    setRegisterError("");

    if (registerPassword.length < 6) {
      setRegisterError("密码长度不能少于 6 位");
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      setRegisterError("两次输入的密码不一致");
      return;
    }

    setRegisterLoading(true);

    try {
      const response = await fetch("/api/auth/github/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: registerName.trim(),
          password: registerPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setRegisterError(data.error || "创建账号失败，请稍后重试");
        return;
      }

      router.push(data.redirectPath || pending.redirectPath);
      router.refresh();
    } catch {
      setRegisterError("网络异常，请稍后重试");
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleBind = async (e: React.FormEvent) => {
    e.preventDefault();
    setBindError("");
    setBindLoading(true);

    try {
      const response = await fetch("/api/auth/github/bind", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: bindEmail.trim().toLowerCase(),
          password: bindPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setBindError(data.error || "绑定账号失败，请稍后重试");
        return;
      }

      router.push(data.redirectPath || pending.redirectPath);
      router.refresh();
    } catch {
      setBindError("网络异常，请稍后重试");
    } finally {
      setBindLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">完成 GitHub 登录</h1>
          <p className="mt-3 text-sm text-gray-600">
            当前 GitHub 账号还没有绑定论坛账号，请选择创建新账号，或绑定已有账号继续登录。
          </p>
        </div>

        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-gray-900">当前 GitHub 账号信息</p>
          <div className="space-y-2 text-sm text-gray-700">
            <p><span className="font-medium">GitHub ID：</span>{pending.githubUserId}</p>
            {pending.login ? <p><span className="font-medium">GitHub 用户名：</span>{pending.login}</p> : null}
            <p><span className="font-medium">GitHub 邮箱：</span>{pending.email || unavailableText}</p>
            <p><span className="font-medium">GitHub 显示名称：</span>{pending.name || unavailableText}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="space-y-5 p-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900">新用户：创建账号</h2>
              <p className="mt-2 text-sm text-gray-600">
                使用 GitHub 提供的邮箱创建论坛账号，并设置一个密码。创建完成后，这个 GitHub 账号会自动与新账号绑定。
              </p>
            </div>

            <Input
              id="register-email"
              name="register-email"
              label="GitHub 邮箱"
              type="email"
              value={pending.email ?? ""}
              disabled
              readOnly
            />

            <Input
              id="register-name"
              name="register-name"
              label="显示名称"
              type="text"
              placeholder="选填，作为论坛昵称使用"
              value={registerName}
              onChange={(e) => setRegisterName(e.target.value)}
            />

            <Input
              id="register-password"
              name="register-password"
              label="登录密码"
              type="password"
              required
              placeholder="至少 6 位字符"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
            />

            <Input
              id="register-confirm-password"
              name="register-confirm-password"
              label="确认密码"
              type="password"
              required
              placeholder="请再次输入密码"
              value={registerConfirmPassword}
              onChange={(e) => setRegisterConfirmPassword(e.target.value)}
            />

            {registerError && <div className="text-sm text-red-600">{registerError}</div>}

            <Button type="button" variant="primary" fullWidth disabled={registerLoading} onClick={handleRegister}>
              {registerLoading ? "正在创建并绑定账号..." : "创建并绑定新账号"}
            </Button>
          </Card>

          <Card className="space-y-5 p-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900">老用户：绑定已有账号</h2>
              <p className="mt-2 text-sm text-gray-600">
                输入你已有论坛账号的邮箱和密码。绑定成功后，后续可以直接使用 GitHub 登录这个账号。
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleBind}>
              <Input
                id="bind-email"
                name="bind-email"
                label="账号邮箱"
                type="email"
                required
                placeholder="请输入已有账号邮箱"
                value={bindEmail}
                onChange={(e) => setBindEmail(e.target.value)}
              />
              <Input
                id="bind-password"
                name="bind-password"
                label="账号密码"
                type="password"
                required
                placeholder="请输入已有账号密码"
                value={bindPassword}
                onChange={(e) => setBindPassword(e.target.value)}
              />

              {bindError && <div className="text-sm text-red-600">{bindError}</div>}

              <Button type="submit" variant="secondary" fullWidth disabled={bindLoading}>
                {bindLoading ? "正在绑定账号..." : "绑定已有账号"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
