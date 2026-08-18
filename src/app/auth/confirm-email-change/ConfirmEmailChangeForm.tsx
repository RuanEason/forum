"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

type ConfirmEmailChangeFormProps = {
  token: string;
};

export default function ConfirmEmailChangeForm({ token }: ConfirmEmailChangeFormProps) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("邮箱变更链接无效或已过期");
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/auth/email/change/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = (await response.json()) as { error?: string; message?: string };
        if (cancelled) return;
        if (!response.ok) {
          setError(data.error || "邮箱验证失败");
          return;
        }
        setSuccess(data.message || "邮箱已更新，请使用新邮箱登录");
      } catch {
        if (!cancelled) setError("网络错误，请稍后重试");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md space-y-7 p-8 text-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">验证新邮箱</h1>
          <p className="mt-2 text-sm text-gray-600">正在确认你的邮箱变更请求。</p>
        </div>
        {loading && <p className="text-sm text-gray-600">验证中...</p>}
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        {success && <p className="text-sm text-emerald-700" role="status">{success}</p>}
        {!loading && (
          <div className="space-y-3">
            <Link href="/auth/signin" className="inline-flex w-full">
              <Button type="button" fullWidth>前往登录</Button>
            </Link>
            {error && (
              <Link href="/auth/signin" className="inline-flex font-medium text-indigo-600 hover:text-indigo-500">
                返回登录页
              </Link>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
