function parseBooleanEnv(value: string | undefined) {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export type RuntimeEnvironment = "development" | "test" | "staging" | "production";

type EnvironmentVariables = Readonly<Record<string, string | undefined>>;

export function getRuntimeEnvironment(
  env: EnvironmentVariables = process.env,
): RuntimeEnvironment {
  const explicitEnvironment = env.APP_ENV?.trim().toLowerCase();

  if (explicitEnvironment === "staging" || explicitEnvironment === "preview") {
    return "staging";
  }

  if (explicitEnvironment === "production" || explicitEnvironment === "prod") {
    return "production";
  }

  if (
    explicitEnvironment === "development"
    || explicitEnvironment === "dev"
    || explicitEnvironment === "local"
  ) {
    return "development";
  }

  if (explicitEnvironment === "test") {
    return "test";
  }

  if (env.NODE_ENV === "production") {
    return "production";
  }

  if (env.NODE_ENV === "test") {
    return "test";
  }

  return "development";
}

export function isProductionEnvironment(env: EnvironmentVariables = process.env) {
  return getRuntimeEnvironment(env) === "production";
}

export function isDevToolboxFlagEnabled(env: EnvironmentVariables = process.env) {
  return parseBooleanEnv(env.DEV_TOOLBOX_ENABLED);
}

export function isDevToolboxEnabled(env: EnvironmentVariables = process.env) {
  const runtimeEnvironment = getRuntimeEnvironment(env);

  return (
    (runtimeEnvironment === "development" || runtimeEnvironment === "staging")
    && isDevToolboxFlagEnabled(env)
  );
}

export function getDevToolboxState(env: EnvironmentVariables = process.env) {
  return {
    enabled: isDevToolboxEnabled(env),
    flagEnabled: isDevToolboxFlagEnabled(env),
    environment: getRuntimeEnvironment(env),
  };
}
