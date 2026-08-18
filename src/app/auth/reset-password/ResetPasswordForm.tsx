"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";

type ResetPasswordFormProps = {
  token: string;
};

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!token) {
      const normalizedEmail = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        setError("请输入有效的邮箱地址");
        return;
      }

      setLoading(true);
      try {
        const response = await fetch("/api/auth/password/reset/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: normalizedEmail }),
        });
        const data = (await response.json()) as { message?: string };
        if (!response.ok && response.status !== 202) {
          throw new Error("密码找回请求失败");
        }
        setSuccess(data.message || "如果该邮箱已注册，密码重置邮件将发送到该邮箱。");
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "密码找回请求失败");
      } finally {
        setLoading(false);
      }
      return;
    }
    if (newPassword.length < 6 || newPassword.length > 128) {
      setError("新密码长度需为 6 至 128 个字符");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("两次输入的新密码不一致");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/password/reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword, confirmPassword }),
      });
      const data = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        throw new Error(data.error || "密码重置失败");
      }
      setSuccess(data.message || "密码已重置，请使用新密码登录");
      setNewPassword("");
      setConfirmPassword("");
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "密码重置失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md space-y-7 p-8">
        <div>
          <h1 className="text-center text-2xl font-semibold text-gray-900">{token ? "重置密码" : "找回密码"}</h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            {token ? "设置一个新的论坛登录密码。" : "输入注册邮箱，我们会发送密码重置链接。"}
          </p>
        </div>

        {!success ? (
          <form className="space-y-5" onSubmit={handleSubmit}>
            {token ? <>
              <Input
                id="new-password"
                label="新密码"
                type="password"
                required
                minLength={6}
                maxLength={128}
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
              <Input
                id="confirm-password"
                label="确认新密码"
                type="password"
                required
                minLength={6}
                maxLength={128}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </> : (
              <Input
                id="reset-email"
                label="注册邮箱"
                type="email"
                required
                autoComplete="email"
                placeholder="请输入注册邮箱"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            )}
            {error && <p className="text-center text-sm text-red-600" role="alert">{error}</p>}
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? "处理中..." : token ? "确认重置密码" : "发送重置邮件"}
            </Button>
          </form>
        ) : (
          <div className="space-y-5 text-center">
            <p className="text-sm text-emerald-700" role="status">{success}</p>
            <Link href="/auth/signin" className="inline-flex font-medium text-indigo-600 hover:text-indigo-500">
              返回登录
            </Link>
          </div>
        )}

        {!success && (
          <p className="text-center text-sm text-gray-500">
            想起密码了？{" "}
            <Link href="/auth/signin" className="font-medium text-indigo-600 hover:text-indigo-500">返回登录</Link>
          </p>
        )}
      </Card>
    </div>
  );
}
