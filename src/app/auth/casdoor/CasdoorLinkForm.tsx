"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

type PendingCasdoorLogin = {
  casdoorUserId: string;
  email: string | null;
  name: string | null;
  avatar: string | null;
  redirectPath: string;
};

type CasdoorLinkFormProps = {
  pending: PendingCasdoorLogin;
};

export default function CasdoorLinkForm({ pending }: CasdoorLinkFormProps) {
  const router = useRouter();
  const [registerName, setRegisterName] = useState(pending.name ?? "");
  const [bindEmail, setBindEmail] = useState(pending.email ?? "");
  const [bindPassword, setBindPassword] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [bindLoading, setBindLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [bindError, setBindError] = useState("");

  const handleRegister = async () => {
    setRegisterError("");
    setRegisterLoading(true);

    try {
      const response = await fetch("/api/auth/casdoor/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: registerName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setRegisterError(data.error || "注册失败");
        return;
      }

      router.push(data.redirectPath || pending.redirectPath);
      router.refresh();
    } catch {
      setRegisterError("网络错误，请稍后重试");
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleBind = async (e: React.FormEvent) => {
    e.preventDefault();
    setBindError("");
    setBindLoading(true);

    try {
      const response = await fetch("/api/auth/casdoor/bind", {
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
        setBindError(data.error || "绑定失败");
        return;
      }

      router.push(data.redirectPath || pending.redirectPath);
      router.refresh();
    } catch {
      setBindError("网络错误，请稍后重试");
    } finally {
      setBindLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">完成第三方账号接入</h1>
          <p className="mt-3 text-sm text-gray-600">
            当前 Casdoor 身份尚未绑定论坛账号，请选择注册新用户或绑定已有账号。
          </p>
        </div>

        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-700 space-y-2">
            <p><span className="font-medium">Casdoor ID：</span>{pending.casdoorUserId}</p>
            <p><span className="font-medium">第三方邮箱：</span>{pending.email || "未提供"}</p>
            <p><span className="font-medium">第三方昵称：</span>{pending.name || "未提供"}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="space-y-5 p-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900">注册新用户</h2>
              <p className="mt-2 text-sm text-gray-600">
                用当前 Casdoor 身份创建一个新的论坛账号，并使用第三方返回的邮箱自动完成绑定。
              </p>
            </div>

            <Input
              id="register-email"
              name="register-email"
              label="第三方邮箱"
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
              placeholder="给新账号起个名字"
              value={registerName}
              onChange={(e) => setRegisterName(e.target.value)}
            />

            {registerError && <div className="text-sm text-red-600">{registerError}</div>}

            <Button type="button" variant="primary" fullWidth disabled={registerLoading} onClick={handleRegister}>
              {registerLoading ? "注册中..." : "注册并绑定"}
            </Button>
          </Card>

          <Card className="space-y-5 p-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900">绑定老账号</h2>
              <p className="mt-2 text-sm text-gray-600">
                输入你已有论坛账号的邮箱和密码，绑定后以后可直接通过 Casdoor 登录。
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
                {bindLoading ? "绑定中..." : "绑定已有账号"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
