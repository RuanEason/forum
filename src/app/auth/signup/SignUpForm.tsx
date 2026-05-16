"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { toCompleteProfilePath } from "@/lib/auth-redirect";

const CODE_LENGTH = 6;
const DEFAULT_COOLDOWN_SECONDS = 60;

type SignUpFormProps = {
  redirectPath: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function parseCooldownSeconds(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_COOLDOWN_SECONDS;
  }
  return parsed;
}

export default function SignUpForm({ redirectPath }: SignUpFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCooldownSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [cooldownSeconds]);

  const handleSendCode = async () => {
    setError("");
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      setError("请先输入邮箱地址");
      return;
    }

    setSendingCode(true);

    try {
      const response = await fetch("/api/auth/register/send-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "验证码发送失败");
        return;
      }

      const nextCooldown = parseCooldownSeconds(data.cooldownSeconds);
      setCooldownSeconds(nextCooldown);
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      setError("请输入邮箱地址");
      return;
    }

    if (password !== confirmPassword) {
      setError("密码不匹配");
      return;
    }

    if (password.length < 6) {
      setError("密码至少需要6个字符");
      return;
    }

    if (!/^\d{6}$/.test(code.trim())) {
      setError("请输入6位验证码");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
          code: code.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "注册失败");
        return;
      }

      const signInResult = await signIn("credentials", {
        email: normalizedEmail,
        password,
        redirect: false,
      });

      if (signInResult?.error || !signInResult?.ok) {
        setError("注册成功，但自动登录失败，请手动登录后完善资料");
        return;
      }

      const completeProfilePath = toCompleteProfilePath(redirectPath);

      router.push(completeProfilePath);
      router.refresh();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  const signInPath =
    redirectPath === "/"
      ? "/auth/signin"
      : `/auth/signin?redirect=${encodeURIComponent(redirectPath)}`;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
            注册Slept论坛账号
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            加入我们，分享你的生活
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              id="email"
              name="email"
              label="邮箱地址"
              type="email"
              required
              placeholder="请输入您的邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                邮箱验证码
              </label>
              <div className="flex items-center gap-2">
                <Input
                  id="code"
                  name="code"
                  type="text"
                  required
                  placeholder="请输入6位验证码"
                  value={code}
                  maxLength={CODE_LENGTH}
                  className="flex-1"
                  onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, "").slice(0, CODE_LENGTH))}
                />
                <Button
                  type="button"
                  variant="secondary"
                  disabled={sendingCode || cooldownSeconds > 0 || loading}
                  onClick={handleSendCode}
                  className="shrink-0 px-4 whitespace-nowrap"
                >
                  {sendingCode ? "发送中..." : cooldownSeconds > 0 ? `${cooldownSeconds}s` : "发送验证码"}
                </Button>
              </div>
            </div>
            <Input
              id="password"
              name="password"
              label="密码"
              type="password"
              required
              placeholder="密码（至少6位）"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              id="confirmPassword"
              name="confirmPassword"
              label="确认密码"
              type="password"
              required
              placeholder="请再次输入密码"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {error && <div className="text-red-600 text-sm text-center">{error}</div>}

          <div>
            <Button type="submit" variant="primary" fullWidth disabled={loading}>
              {loading ? "注册中..." : "注册"}
            </Button>
          </div>

          <div className="text-center">
            <Link href={signInPath} className="font-medium text-indigo-600 hover:text-indigo-500">
              已有账号？登录
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
