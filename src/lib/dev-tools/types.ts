export type DevToolRiskLevel = "low" | "medium" | "high";

export type DevToolWriteTarget = "cookie" | "session" | "mock-state" | "database";

export type DevToolFieldType = "text" | "email" | "url" | "textarea";

export type DevToolScenarioField = {
  key: string;
  label: string;
  type: DevToolFieldType;
  required?: boolean;
  placeholder?: string;
  helperText?: string;
  defaultValue?: string;
  rows?: number;
};

export type DevToolScenarioDefinition = {
  id: string;
  category: string;
  name: string;
  summary: string;
  description: string;
  riskLevel: DevToolRiskLevel;
  writes: DevToolWriteTarget[];
  successLabel: string;
  fields: DevToolScenarioField[];
};

export type DevToolRunRequest = {
  scenarioId: string;
  input: Record<string, string>;
};

export type DevToolRunResult = {
  ok: boolean;
  message: string;
  redirectTo?: string;
  warnings?: string[];
  details?: Record<string, string>;
};
