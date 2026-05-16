"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

type SignInFormProps = {
  redirectPath: string;
};

export default function SignInForm({ redirectPath }: SignInFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("登录失败，请检查邮箱和密码");
        return;
      }

      router.push(redirectPath);
      router.refresh();
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const signupPath =
    redirectPath === "/"
      ? "/auth/signup"
      : `/auth/signup?redirect=${encodeURIComponent(redirectPath)}`;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
            登录到Slept论坛
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            欢迎回来，请登录您的账号
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
            <Input
              id="password"
              name="password"
              label="密码"
              type="password"
              required
              placeholder="请输入您的密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <div className="text-red-600 text-sm text-center">{error}</div>}

          <div>
            <Button type="submit" variant="primary" fullWidth disabled={loading}>
              {loading ? "登录中..." : "登录"}
            </Button>
          </div>

          <div className="text-center">
            <Link href={signupPath} className="font-medium text-indigo-600 hover:text-indigo-500">
              还没有账号？注册
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
