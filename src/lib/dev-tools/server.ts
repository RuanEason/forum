import { NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";
import { getAuthPageRedirectPath } from "@/lib/auth-redirect";
import { findGitHubLinkedLoginUser } from "@/lib/github-auth";
import { GITHUB_PENDING_COOKIE, GITHUB_REDIRECT_COOKIE, encodePendingGitHubLogin } from "@/lib/github";
import { getDevToolScenarioById } from "./registry";
import type {
  DevToolRunRequest,
  DevToolRunResult,
  DevToolScenarioDefinition,
} from "./types";

type NormalizedInput = Record<string, string>;

type ScenarioExecutor = (options: {
  request: NextRequest;
  scenario: DevToolScenarioDefinition;
  input: NormalizedInput;
}) => Promise<NextResponse<DevToolRunResult>>;

const GITHUB_PENDING_MAX_AGE_SECONDS = 60 * 15;
const SESSION_COOKIE_NAME_SECURE = "__Secure-next-auth.session-token";
const SESSION_COOKIE_NAME = "next-auth.session-token";

function getSessionCookieName(isSecure: boolean) {
  return isSecure ? SESSION_COOKIE_NAME_SECURE : SESSION_COOKIE_NAME;
}

function jsonError(message: string, status = 400, warnings?: string[]) {
  return NextResponse.json(
    {
      ok: false,
      message,
      warnings,
    } satisfies DevToolRunResult,
    { status },
  );
}

function normalizeScenarioInput(
  scenario: DevToolScenarioDefinition,
  input: Record<string, unknown>,
) {
  const normalized: NormalizedInput = {};
  const errors: string[] = [];

  for (const field of scenario.fields) {
    const rawValue = input[field.key];
    const fallbackValue = field.defaultValue ?? "";
    const value = typeof rawValue === "string" ? rawValue.trim() : fallbackValue.trim();

    normalized[field.key] = value;

    if (field.required && !value) {
      errors.push(`请填写“${field.label}”`);
    }
  }

  return {
    normalized,
    errors,
  };
}

async function executeGitHubPendingLogin({
  request,
  scenario,
  input,
}: {
  request: NextRequest;
  scenario: DevToolScenarioDefinition;
  input: NormalizedInput;
}) {
  const redirectPath = getAuthPageRedirectPath(input.redirectPath || "/");
  const githubUserId = input.githubUserId;
  const email = input.email ? input.email.toLowerCase() : null;
  const login = input.login || null;
  const name = input.name || null;
  const avatar = input.avatar || null;
  const warnings: string[] = [];
  const isSecure = request.nextUrl.protocol === "https:";

  const linkedUser = await findGitHubLinkedLoginUser({
    githubUserId,
    email,
    login,
    name,
    avatar,
  });

  if (linkedUser) {
    const defaultToken = {
      name: linkedUser.name,
      email: linkedUser.email,
      picture: linkedUser.avatar,
      sub: linkedUser.id,
    };

    const sessionToken = await encode({
      secret: authOptions.secret ?? process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? "",
      token: await authOptions.callbacks.jwt({
        token: defaultToken,
        user: linkedUser,
        account: {
          provider: "github",
          providerAccountId: githubUserId,
          type: "credentials",
        },
        isNewUser: false,
        trigger: "signIn",
      }),
      maxAge: authOptions.session.maxAge,
    });

    const response = NextResponse.json({
      ok: true,
      message: "已检测到这个 GitHub 账号已经绑定论坛账号，正在直接登录。",
      redirectTo: redirectPath,
      warnings,
      details: {
        mode: "direct-login",
        githubUserId,
        email: linkedUser.email,
        redirectPath,
      },
    } satisfies DevToolRunResult);

    response.cookies.set(getSessionCookieName(isSecure), sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: isSecure,
      path: "/",
      expires: new Date(Date.now() + authOptions.session.maxAge * 1000),
    });

    response.cookies.set(GITHUB_PENDING_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: isSecure,
      path: "/",
      maxAge: 0,
    });

    response.cookies.set(GITHUB_REDIRECT_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: isSecure,
      path: "/",
      maxAge: 0,
    });

    return response;
  }

  if (!email) {
    warnings.push("当前未填写 GitHub 邮箱：可以查看选择页，但无法完整测试“创建新账号”流程。");
  }

  const pendingToken = await encodePendingGitHubLogin({
    githubUserId,
    email,
    login,
    name,
    avatar,
    redirectPath,
  });

  const response = NextResponse.json({
    ok: true,
    message: `${scenario.successLabel}，正在准备跳转。`,
    redirectTo: "/auth/github",
    warnings,
    details: {
      githubUserId,
      email: email ?? "未提供",
      login: login ?? "未提供",
      name: name ?? "未提供",
      redirectPath,
    },
  } satisfies DevToolRunResult);

  response.cookies.set(GITHUB_PENDING_COOKIE, pendingToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecure,
    path: "/",
    maxAge: GITHUB_PENDING_MAX_AGE_SECONDS,
  });

  response.cookies.set(GITHUB_REDIRECT_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecure,
    path: "/",
    maxAge: 0,
  });

  return response;
}

const scenarioExecutors: Record<string, ScenarioExecutor> = {
  "github-pending-login": executeGitHubPendingLogin,
};

export async function runDevToolScenario(request: NextRequest) {
  let body: DevToolRunRequest | null = null;

  try {
    body = (await request.json()) as DevToolRunRequest;
  } catch {
    return jsonError("调试请求格式不正确，请刷新页面后重试。");
  }

  if (!body || typeof body.scenarioId !== "string" || typeof body.input !== "object" || !body.input) {
    return jsonError("缺少调试场景或输入参数。");
  }

  const scenario = getDevToolScenarioById(body.scenarioId);
  if (!scenario) {
    return jsonError("未找到对应的调试场景。", 404);
  }

  const { normalized, errors } = normalizeScenarioInput(scenario, body.input);
  if (errors.length > 0) {
    return jsonError(errors.join("；"));
  }

  const executor = scenarioExecutors[scenario.id];
  if (!executor) {
    return jsonError("这个调试场景暂时还没有执行器。", 501);
  }

  return executor({
    request,
    scenario,
    input: normalized,
  });
}
