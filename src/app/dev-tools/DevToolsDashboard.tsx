"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import type {
  DevToolRunResult,
  DevToolScenarioDefinition,
  DevToolWriteTarget,
} from "@/lib/dev-tools/types";

type DevToolsDashboardProps = {
  environment: string;
  scenarios: DevToolScenarioDefinition[];
};

type ScenarioResultState = DevToolRunResult & {
  statusCode: number;
};

const writeTargetLabelMap: Record<DevToolWriteTarget, string> = {
  cookie: "Cookie",
  session: "Session",
  "mock-state": "Mock 状态",
  database: "数据库",
};

const riskBadgeVariantMap = {
  low: "success",
  medium: "warning",
  high: "danger",
} as const;

function buildInitialValues(scenarios: DevToolScenarioDefinition[]) {
  return Object.fromEntries(
    scenarios.map((scenario) => [
      scenario.id,
      Object.fromEntries(
        scenario.fields.map((field) => [field.key, field.defaultValue ?? ""]),
      ),
    ]),
  ) as Record<string, Record<string, string>>;
}

export default function DevToolsDashboard({
  environment,
  scenarios,
}: DevToolsDashboardProps) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, Record<string, string>>>(() => {
    return buildInitialValues(scenarios);
  });
  const [loadingScenarioId, setLoadingScenarioId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, ScenarioResultState>>({});

  const handleFieldChange = (scenarioId: string, fieldKey: string, nextValue: string) => {
    setValues((current) => ({
      ...current,
      [scenarioId]: {
        ...current[scenarioId],
        [fieldKey]: nextValue,
      },
    }));
  };

  const handleSubmit = async (scenarioId: string) => {
    setLoadingScenarioId(scenarioId);

    try {
      const response = await fetch("/api/dev-tools/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scenarioId,
          input: values[scenarioId],
        }),
      });

      const payload = (await response.json()) as DevToolRunResult | { error?: string };

      if (!response.ok) {
        const errorMessage = "message" in payload && typeof payload.message === "string"
          ? payload.message
          : "error" in payload && typeof payload.error === "string"
            ? payload.error
            : "调试执行失败，请稍后再试。";

        setResults((current) => ({
          ...current,
          [scenarioId]: {
            ok: false,
            message: errorMessage,
            warnings: "warnings" in payload && Array.isArray(payload.warnings) ? payload.warnings : [],
            statusCode: response.status,
          },
        }));
        return;
      }

      const result = payload as DevToolRunResult;

      setResults((current) => ({
        ...current,
        [scenarioId]: {
          ...result,
          statusCode: response.status,
        },
      }));

      if (result.redirectTo) {
        startTransition(() => {
          router.push(result.redirectTo!);
          router.refresh();
        });
      }
    } catch {
      setResults((current) => ({
        ...current,
        [scenarioId]: {
          ok: false,
          message: "网络异常，调试请求没有成功发出。",
          statusCode: 0,
        },
      }));
    } finally {
      setLoadingScenarioId(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.18),_transparent_28%),linear-gradient(180deg,_#fff7ed_0%,_#f8fafc_38%,_#ffffff_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <Card className="overflow-hidden border border-orange-200/70 bg-white/90 p-0 shadow-xl shadow-orange-100/40 backdrop-blur" variant="bordered">
          <div className="border-b border-orange-100 bg-gradient-to-r from-orange-50 via-amber-50 to-white px-6 py-5">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="warning">仅开发环境可用</Badge>
              <Badge variant="primary">{environment}</Badge>
              <Badge variant="secondary">生产环境强制 404</Badge>
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-gray-900">开发调试工具箱</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">
              这个页面专门用来绕过必须依赖公网回调或第三方在线服务的流程。当前所有场景默认只写临时 cookie 或 mock
              状态，不直接改数据库，方便你安全地复现登录、回调、集成链路上的 UI 与分支逻辑。
            </p>
          </div>

          <div className="grid gap-4 px-6 py-5 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-900">平台原则</p>
              <p className="mt-2 text-sm text-gray-600">统一入口、统一鉴权、统一场景注册，后续新增调试能力不再散落在业务页。</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-900">当前行为</p>
              <p className="mt-2 text-sm text-gray-600">执行成功后会返回明确结果，并在需要时自动跳转到对应业务页面继续调试。</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-900">后续扩展</p>
              <p className="mt-2 text-sm text-gray-600">可以继续接入 Webhook、支付通知、短信回执、对象存储回调等公网依赖场景。</p>
            </div>
          </div>
        </Card>

        <div className="grid gap-6">
          {scenarios.map((scenario) => {
            const scenarioValues = values[scenario.id] ?? {};
            const result = results[scenario.id];
            const isLoading = loadingScenarioId === scenario.id;

            return (
              <Card
                key={scenario.id}
                className="border border-gray-200 bg-white/95 p-6 shadow-lg shadow-gray-100/60"
                variant="bordered"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="primary">{scenario.category}</Badge>
                      <Badge variant={riskBadgeVariantMap[scenario.riskLevel]}>
                        风险级别：{scenario.riskLevel === "low" ? "低" : scenario.riskLevel === "medium" ? "中" : "高"}
                      </Badge>
                      {scenario.writes.map((target) => (
                        <Badge key={target} variant="default">
                          写入：{writeTargetLabelMap[target]}
                        </Badge>
                      ))}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{scenario.name}</h2>
                      <p className="mt-2 text-sm text-gray-600">{scenario.summary}</p>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">{scenario.description}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
                    <p className="font-semibold">推荐用途</p>
                    <p className="mt-1">本地回调不可达时，先造出一份业务上下文，再进入真实页面继续联调。</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {scenario.fields.map((field) => {
                    const commonProps = {
                      id: `${scenario.id}-${field.key}`,
                      value: scenarioValues[field.key] ?? "",
                      onChange: (
                        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
                      ) => handleFieldChange(scenario.id, field.key, event.target.value),
                    };

                    return (
                      <div key={field.key} className={field.type === "textarea" ? "md:col-span-2" : ""}>
                        {field.type === "textarea" ? (
                          <Textarea
                            {...commonProps}
                            label={field.label}
                            placeholder={field.placeholder}
                            rows={field.rows ?? 4}
                          />
                        ) : (
                          <Input
                            {...commonProps}
                            label={field.label}
                            type={field.type}
                            placeholder={field.placeholder}
                          />
                        )}
                        {field.helperText ? (
                          <p className="mt-1 text-xs leading-5 text-gray-500">{field.helperText}</p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                {result ? (
                  <div
                    className={`mt-6 rounded-2xl border p-4 ${
                      result.ok
                        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                        : "border-red-200 bg-red-50 text-red-900"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{result.ok ? "执行成功" : "执行失败"}</p>
                      <Badge variant={result.ok ? "success" : "danger"}>HTTP {result.statusCode || "ERR"}</Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6">{result.message}</p>

                    {result.warnings && result.warnings.length > 0 ? (
                      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                        {result.warnings.join(" ")}
                      </div>
                    ) : null}

                    {result.details ? (
                      <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
                        {Object.entries(result.details).map(([key, value]) => (
                          <div key={key} className="rounded-xl bg-white/80 px-3 py-2 text-gray-700">
                            <span className="font-medium text-gray-900">{key}：</span>
                            {value}
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {result.redirectTo ? (
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            startTransition(() => {
                              router.push(result.redirectTo!);
                              router.refresh();
                            });
                          }}
                        >
                          立即前往目标页面
                        </Button>
                        <Link
                          href={result.redirectTo}
                          className="inline-flex items-center rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          打开 {result.redirectTo}
                        </Link>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-5">
                  <Button
                    type="button"
                    onClick={() => handleSubmit(scenario.id)}
                    disabled={isLoading}
                  >
                    {isLoading ? "正在生成调试上下文..." : "运行这个场景"}
                  </Button>
                  <p className="text-sm text-gray-500">执行器只会在当前浏览器里写入临时调试状态，不会直接创建账号或提交业务数据。</p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
