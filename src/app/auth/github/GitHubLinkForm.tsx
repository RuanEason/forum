"use client";

import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

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

type FlowMode = "register" | "bind";
type FlowStep = "choice" | "transition" | "input" | "confirm";

const TRANSITION_DURATION_MS = 900;

const modeCopy: Record<
  FlowMode,
  {
    subtitle: string;
    inputTitle: string;
    confirmTitle: string;
    confirmDescription: string;
    fallbackError: string;
  }
> = {
  register: {
    subtitle: "注册新账号",
    inputTitle: "输入您要设置的密码",
    confirmTitle: "确认您的账号信息",
    confirmDescription: "确认邮箱与密码无误后，即可完成 GitHub 账号绑定并创建论坛新账号。",
    fallbackError: "创建并绑定账号失败，请稍后重试。",
  },
  bind: {
    subtitle: "绑定已有账号",
    inputTitle: "输入您已有账号的邮箱和密码",
    confirmTitle: "确认您要绑定的账号信息",
    confirmDescription: "确认后会将这个 GitHub 账号绑定到你现有的论坛账号上。",
    fallbackError: "绑定已有账号失败，请稍后重试。",
  },
};

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M0 0h24v24H0z" fill="none" />
      <path
        fill="currentColor"
        d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2"
      />
    </svg>
  );
}

function LoadingBars({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M0 0h24v24H0z" fill="none" />
      <rect width="2.8" height="12" x="1" y="6" fill="currentColor">
        <animate
          id="SVGLQdHQe4p"
          attributeName="y"
          begin="0;SVGg3vsIeGm.end-0.1s"
          calcMode="spline"
          dur="0.6s"
          keySplines=".36,.61,.3,.98;.36,.61,.3,.98"
          values="6;1;6"
        />
        <animate
          attributeName="height"
          begin="0;SVGg3vsIeGm.end-0.1s"
          calcMode="spline"
          dur="0.6s"
          keySplines=".36,.61,.3,.98;.36,.61,.3,.98"
          values="12;22;12"
        />
      </rect>
      <rect width="2.8" height="12" x="5.8" y="6" fill="currentColor">
        <animate
          attributeName="y"
          begin="SVGLQdHQe4p.begin+0.1s"
          calcMode="spline"
          dur="0.6s"
          keySplines=".36,.61,.3,.98;.36,.61,.3,.98"
          values="6;1;6"
        />
        <animate
          attributeName="height"
          begin="SVGLQdHQe4p.begin+0.1s"
          calcMode="spline"
          dur="0.6s"
          keySplines=".36,.61,.3,.98;.36,.61,.3,.98"
          values="12;22;12"
        />
      </rect>
      <rect width="2.8" height="12" x="10.6" y="6" fill="currentColor">
        <animate
          attributeName="y"
          begin="SVGLQdHQe4p.begin+0.2s"
          calcMode="spline"
          dur="0.6s"
          keySplines=".36,.61,.3,.98;.36,.61,.3,.98"
          values="6;1;6"
        />
        <animate
          attributeName="height"
          begin="SVGLQdHQe4p.begin+0.2s"
          calcMode="spline"
          dur="0.6s"
          keySplines=".36,.61,.3,.98;.36,.61,.3,.98"
          values="12;22;12"
        />
      </rect>
      <rect width="2.8" height="12" x="15.4" y="6" fill="currentColor">
        <animate
          attributeName="y"
          begin="SVGLQdHQe4p.begin+0.3s"
          calcMode="spline"
          dur="0.6s"
          keySplines=".36,.61,.3,.98;.36,.61,.3,.98"
          values="6;1;6"
        />
        <animate
          attributeName="height"
          begin="SVGLQdHQe4p.begin+0.3s"
          calcMode="spline"
          dur="0.6s"
          keySplines=".36,.61,.3,.98;.36,.61,.3,.98"
          values="12;22;12"
        />
      </rect>
      <rect width="2.8" height="12" x="20.2" y="6" fill="currentColor">
        <animate
          id="SVGg3vsIeGm"
          attributeName="y"
          begin="SVGLQdHQe4p.begin+0.4s"
          calcMode="spline"
          dur="0.6s"
          keySplines=".36,.61,.3,.98;.36,.61,.3,.98"
          values="6;1;6"
        />
        <animate
          attributeName="height"
          begin="SVGLQdHQe4p.begin+0.4s"
          calcMode="spline"
          dur="0.6s"
          keySplines=".36,.61,.3,.98;.36,.61,.3,.98"
          values="12;22;12"
        />
      </rect>
    </svg>
  );
}

function PillInput({
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  showToggle,
  isVisible,
  onToggleVisibility,
}: {
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "password";
  placeholder: string;
  autoComplete?: string;
  showToggle?: boolean;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
}) {
  return (
    <div className="relative w-full">
      <input
        className="h-14 w-full rounded-full border border-[#d7dbe3] bg-white px-5 pr-14 text-base text-[#1f2937] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] outline-none transition focus:border-[#2a78ff] focus:ring-4 focus:ring-[#2a78ff]/10"
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
      />
      {showToggle ? (
        <button
          type="button"
          aria-label={isVisible ? "隐藏密码" : "显示密码"}
          className="absolute inset-y-0 right-4 flex items-center text-[#b4bbc8] transition hover:text-[#6b7280]"
          onClick={onToggleVisibility}
        >
          {isVisible ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
        </button>
      ) : null}
    </div>
  );
}

function FlowShell({
  subtitle,
  children,
}: {
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[526px] overflow-hidden rounded-[4px] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
      <div className="border-b border-[#e5e7eb] px-6 py-6 text-center">
        <GitHubIcon className="mx-auto h-11 w-11 text-black" />
        <h2 className="mt-3 text-[30px] font-semibold tracking-[-0.02em] text-[#353535] sm:text-[32px]">
          绑定你的GitHub账号
        </h2>
        <p className="mt-1 text-lg text-[#d0d0d0]">{subtitle}</p>
      </div>
      <div className="min-h-[620px] px-6 pb-8 pt-10 sm:px-11">{children}</div>
    </div>
  );
}

function maskPassword(value: string) {
  if (!value) {
    return "未填写";
  }

  return "•".repeat(Math.max(value.length, 6));
}

export default function GitHubLinkForm({ pending }: GitHubLinkFormProps) {
  const router = useRouter();
  const { update } = useSession();
  const [mode, setMode] = useState<FlowMode | null>(null);
  const [step, setStep] = useState<FlowStep>("choice");
  const [error, setError] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [bindEmail, setBindEmail] = useState(pending.email ?? "");
  const [bindPassword, setBindPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showBindPassword, setShowBindPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (step !== "transition") {
      return;
    }

    const timer = window.setTimeout(() => {
      setStep("input");
    }, TRANSITION_DURATION_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [step]);

  const activeMode = mode ?? "register";
  const activeCopy = modeCopy[activeMode];

  const startFlow = (nextMode: FlowMode) => {
    setMode(nextMode);
    setError("");
    setShowConfirmPassword(false);
    setStep("transition");
  };

  const goBackToInput = () => {
    setError("");
    setShowConfirmPassword(false);
    setStep("input");
  };

  const goBackToChoice = () => {
    setError("");
    setShowConfirmPassword(false);
    setStep("choice");
    setMode(null);
  };

  const handleInputNext = (event: FormEvent) => {
    event.preventDefault();

    if (!mode) {
      return;
    }

    if (mode === "register") {
      if (!pending.email) {
        setError("GitHub 未提供邮箱地址，当前无法创建新账号。");
        return;
      }

      if (registerPassword.trim().length < 6) {
        setError("密码长度不能少于 6 位。");
        return;
      }
    }

    if (mode === "bind") {
      if (!bindEmail.trim() || !bindPassword) {
        setError("请输入已有账号的邮箱和密码。");
        return;
      }
    }

    setError("");
    setShowConfirmPassword(false);
    setStep("confirm");
  };

  const handleConfirm = async () => {
    if (!mode) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(
        mode === "register" ? "/api/auth/github/register" : "/api/auth/github/bind",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            mode === "register"
              ? {
                  name: (pending.name ?? pending.login ?? "").trim(),
                  password: registerPassword,
                }
              : {
                  email: bindEmail.trim().toLowerCase(),
                  password: bindPassword,
                },
          ),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || activeCopy.fallbackError);
        return;
      }

      await update();
      router.push(data.redirectPath || pending.redirectPath);
      router.refresh();
    } catch {
      setError("网络异常，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderChoicePage = () => {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center">
        <div className="max-w-3xl text-center">
          <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-[#111827] sm:text-[38px]">
            完成 GitHub 登录
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#7b8291]">
            当前 GitHub 账号还没有绑定论坛账号，请选择创建新账号，或绑定已有账号继续登录。
          </p>
        </div>

        <div className="mt-14 grid w-full gap-6 md:grid-cols-2">
          <button
            type="button"
            className="min-h-[156px] rounded-[22px] bg-white px-8 py-8 text-left shadow-[0_10px_26px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(15,23,42,0.12)]"
            onClick={() => startFlow("register")}
          >
            <h2 className="text-[19px] font-semibold text-[#111827]">新用户：创建账号</h2>
            <p className="mt-5 text-base leading-8 text-[#6b7280]">
              使用 GitHub 提供的邮箱创建论坛账号，并设置一个密码。创建完成后，这个 GitHub 账号会自动与新账号绑定。
            </p>
          </button>

          <button
            type="button"
            className="min-h-[156px] rounded-[22px] bg-white px-8 py-8 text-left shadow-[0_10px_26px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(15,23,42,0.12)]"
            onClick={() => startFlow("bind")}
          >
            <h2 className="text-[19px] font-semibold text-[#111827]">老用户：绑定已有账号</h2>
            <p className="mt-5 text-base leading-8 text-[#6b7280]">
              输入你已有论坛账号的邮箱和密码。绑定成功后，后续可以直接使用 GitHub 登录这个账号。
            </p>
          </button>
        </div>

        <div className="mt-24 flex w-full max-w-md items-center gap-6 text-[#c4c8d0]">
          <div className="h-px flex-1 bg-[#d7dbe3]" />
          <p className="whitespace-nowrap text-sm">点击卡片选择不同的情况</p>
          <div className="h-px flex-1 bg-[#d7dbe3]" />
        </div>
      </div>
    );
  };

  const renderTransitionOrLoading = () => {
    return (
      <FlowShell subtitle={activeCopy.subtitle}>
        <div className="flex min-h-[540px] items-center justify-center">
          <LoadingBars className="h-[92px] w-[92px] text-[#56b7ff]" />
        </div>
      </FlowShell>
    );
  };

  const renderInputPage = () => {
    return (
      <FlowShell subtitle={activeCopy.subtitle}>
        <div className="flex min-h-[540px] flex-col">
          <div className="text-center">
            <h3 className="text-[22px] font-medium text-[#3c3c3c] sm:text-[24px]">{activeCopy.inputTitle}</h3>
          </div>

          <form className="mt-auto flex flex-col items-center pb-8" onSubmit={handleInputNext}>
            <div className="w-full max-w-[430px] space-y-4">
              {mode === "bind" ? (
                <PillInput
                  type="email"
                  value={bindEmail}
                  placeholder="Email"
                  autoComplete="email"
                  onChange={setBindEmail}
                />
              ) : null}

              <PillInput
                type={mode === "register" ? (showRegisterPassword ? "text" : "password") : showBindPassword ? "text" : "password"}
                value={mode === "register" ? registerPassword : bindPassword}
                placeholder="Password"
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                showToggle
                isVisible={mode === "register" ? showRegisterPassword : showBindPassword}
                onToggleVisibility={() => {
                  if (mode === "register") {
                    setShowRegisterPassword((current) => !current);
                    return;
                  }

                  setShowBindPassword((current) => !current);
                }}
                onChange={(value) => {
                  if (mode === "register") {
                    setRegisterPassword(value);
                    return;
                  }

                  setBindPassword(value);
                }}
              />
            </div>

            {error ? <p className="mt-5 text-center text-sm text-[#ef4444]">{error}</p> : null}

            <button
              type="submit"
              className="mt-12 inline-flex min-w-[130px] items-center justify-center rounded-full bg-[#2373ff] px-10 py-4 text-base font-medium text-white shadow-[0_16px_30px_rgba(35,115,255,0.25)] transition hover:bg-[#1d67ea]"
            >
              下一步
            </button>

            <button
              type="button"
              className="mt-5 text-sm text-[#9aa3b2] transition hover:text-[#2373ff]"
              onClick={goBackToChoice}
            >
              重新选择绑定方式
            </button>
          </form>
        </div>
      </FlowShell>
    );
  };

  const renderConfirmPage = () => {
    const confirmEmail = mode === "register" ? pending.email ?? "未提供" : bindEmail.trim().toLowerCase();
    const rawConfirmPassword = mode === "register" ? registerPassword : bindPassword;
    const confirmPassword = showConfirmPassword ? rawConfirmPassword || "未填写" : maskPassword(rawConfirmPassword);

    return (
      <FlowShell subtitle={activeCopy.subtitle}>
        <div className="flex min-h-[540px] flex-col">
          <div className="text-center">
            <h3 className="text-[22px] font-medium text-[#3c3c3c] sm:text-[24px]">{activeCopy.confirmTitle}</h3>
            <p className="mx-auto mt-4 max-w-[360px] text-sm leading-7 text-[#8a8f98]">{activeCopy.confirmDescription}</p>
          </div>

          <div className="mt-20 space-y-8 text-center text-[24px] text-[#3f3f46] sm:text-[26px]">
            <p>邮箱：{confirmEmail}</p>
            <div className="flex items-center justify-center gap-3">
              <p>密码：{confirmPassword}</p>
              <button
                type="button"
                aria-label={showConfirmPassword ? "隐藏密码" : "显示密码"}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d7dbe3] bg-white text-[#9aa3b2] transition hover:border-[#2373ff] hover:text-[#2373ff]"
                onClick={() => setShowConfirmPassword((current) => !current)}
              >
                {showConfirmPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error ? <p className="mt-8 text-center text-sm text-[#ef4444]">{error}</p> : null}

          <div className="mt-auto flex items-center justify-between gap-4 pt-10">
            <button
              type="button"
              className="inline-flex min-w-[112px] items-center justify-center rounded-full border border-[#2373ff] bg-white px-8 py-3 text-base font-medium text-[#2373ff] transition hover:bg-[#eff6ff]"
              onClick={goBackToInput}
            >
              上一步
            </button>
            <button
              type="button"
              className="inline-flex min-w-[130px] items-center justify-center rounded-full bg-[#2373ff] px-10 py-4 text-base font-medium text-white shadow-[0_16px_30px_rgba(35,115,255,0.25)] transition hover:bg-[#1d67ea]"
              onClick={handleConfirm}
            >
              确认
            </button>
          </div>

          <button
            type="button"
            className="mt-5 text-center text-sm text-[#9aa3b2] transition hover:text-[#2373ff]"
            onClick={goBackToChoice}
          >
            重新选择绑定方式
          </button>
        </div>
      </FlowShell>
    );
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f7f9ff] px-4 py-10 sm:px-6 sm:py-14">
      <div
        className={cn(
          "mx-auto flex w-full items-start justify-center",
          step === "choice" ? "max-w-6xl pt-6 sm:pt-10" : "max-w-3xl pt-2 sm:pt-6",
        )}
      >
        {step === "choice" ? renderChoicePage() : null}
        {step === "transition" || isSubmitting ? renderTransitionOrLoading() : null}
        {step === "input" ? renderInputPage() : null}
        {step === "confirm" && !isSubmitting ? renderConfirmPage() : null}
      </div>
    </div>
  );
}
