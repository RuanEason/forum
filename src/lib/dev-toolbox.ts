function parseBooleanEnv(value: string | undefined) {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export function isProductionEnvironment() {
  return process.env.NODE_ENV === "production";
}

export function isDevToolboxFlagEnabled() {
  return parseBooleanEnv(process.env.DEV_TOOLBOX_ENABLED);
}

export function isDevToolboxEnabled() {
  return !isProductionEnvironment() && isDevToolboxFlagEnabled();
}

export function getDevToolboxState() {
  return {
    enabled: isDevToolboxEnabled(),
    flagEnabled: isDevToolboxFlagEnabled(),
    environment: process.env.NODE_ENV ?? "development",
  };
}
