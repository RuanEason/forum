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
      setRegisterError("Password must be at least 6 characters long");
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      setRegisterError("Passwords do not match");
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
        setRegisterError(data.error || "Failed to register");
        return;
      }

      router.push(data.redirectPath || pending.redirectPath);
      router.refresh();
    } catch {
      setRegisterError("Network error, please try again");
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
        setBindError(data.error || "Failed to bind account");
        return;
      }

      router.push(data.redirectPath || pending.redirectPath);
      router.refresh();
    } catch {
      setBindError("Network error, please try again");
    } finally {
      setBindLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">Complete GitHub sign in</h1>
          <p className="mt-3 text-sm text-gray-600">
            This GitHub account is not linked to a forum account yet. Choose whether to create a new account or bind an existing one.
          </p>
        </div>

        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="space-y-2 text-sm text-gray-700">
            <p><span className="font-medium">GitHub ID:</span> {pending.githubUserId}</p>
            {pending.login ? <p><span className="font-medium">GitHub username:</span> {pending.login}</p> : null}
            <p><span className="font-medium">GitHub email:</span> {pending.email || "Unavailable"}</p>
            <p><span className="font-medium">GitHub display name:</span> {pending.name || "Unavailable"}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="space-y-5 p-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Create a new account</h2>
              <p className="mt-2 text-sm text-gray-600">
                Confirm the email from GitHub, set a password for local login, and create a new forum account bound to this GitHub identity.
              </p>
            </div>

            <Input
              id="register-email"
              name="register-email"
              label="GitHub email"
              type="email"
              value={pending.email ?? ""}
              disabled
              readOnly
            />

            <Input
              id="register-name"
              name="register-name"
              label="Display name"
              type="text"
              placeholder="Optional display name"
              value={registerName}
              onChange={(e) => setRegisterName(e.target.value)}
            />

            <Input
              id="register-password"
              name="register-password"
              label="Password"
              type="password"
              required
              placeholder="At least 6 characters"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
            />

            <Input
              id="register-confirm-password"
              name="register-confirm-password"
              label="Confirm password"
              type="password"
              required
              placeholder="Enter the password again"
              value={registerConfirmPassword}
              onChange={(e) => setRegisterConfirmPassword(e.target.value)}
            />

            {registerError && <div className="text-sm text-red-600">{registerError}</div>}

            <Button type="button" variant="primary" fullWidth disabled={registerLoading} onClick={handleRegister}>
              {registerLoading ? "Creating account..." : "Create and bind account"}
            </Button>
          </Card>

          <Card className="space-y-5 p-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Bind an existing account</h2>
              <p className="mt-2 text-sm text-gray-600">
                Enter the email and password of your existing forum account. After binding, you can sign in directly with GitHub.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleBind}>
              <Input
                id="bind-email"
                name="bind-email"
                label="Account email"
                type="email"
                required
                placeholder="Enter your existing account email"
                value={bindEmail}
                onChange={(e) => setBindEmail(e.target.value)}
              />
              <Input
                id="bind-password"
                name="bind-password"
                label="Account password"
                type="password"
                required
                placeholder="Enter your existing account password"
                value={bindPassword}
                onChange={(e) => setBindPassword(e.target.value)}
              />

              {bindError && <div className="text-sm text-red-600">{bindError}</div>}

              <Button type="submit" variant="secondary" fullWidth disabled={bindLoading}>
                {bindLoading ? "Binding account..." : "Bind existing account"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
