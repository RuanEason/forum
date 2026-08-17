export type FeatureFlagName =
  | "permissionDbAuthorization"
  | "cursorPagination"
  | "mediaCleanup";

export type FeatureFlags = Record<FeatureFlagName, boolean>;

export type FeatureFlagEnvironment = Record<string, string | undefined>;

export const featureFlagEnvNames = {
  permissionDbAuthorization: "FEATURE_PERMISSION_DB_AUTHORIZATION",
  cursorPagination: "FEATURE_CURSOR_PAGINATION",
  mediaCleanup: "FEATURE_MEDIA_CLEANUP",
} as const satisfies Record<FeatureFlagName, string>;

const enabledValues = new Set(["1", "on", "true", "yes"]);

/**
 * Parse a feature flag without failing startup for an absent or malformed value.
 * Rollout switches are intentionally fail-closed by default.
 */
export function parseFeatureFlag(
  value: string | undefined,
  defaultValue = false,
): boolean {
  if (value === undefined || value.trim() === "") {
    return defaultValue;
  }

  return enabledValues.has(value.trim().toLowerCase());
}

export function getFeatureFlags(
  env: FeatureFlagEnvironment = process.env,
): FeatureFlags {
  return {
    permissionDbAuthorization: parseFeatureFlag(
      env[featureFlagEnvNames.permissionDbAuthorization],
    ),
    cursorPagination: parseFeatureFlag(
      env[featureFlagEnvNames.cursorPagination],
    ),
    mediaCleanup: parseFeatureFlag(env[featureFlagEnvNames.mediaCleanup]),
  };
}

export function isFeatureEnabled(
  flag: FeatureFlagName,
  env: FeatureFlagEnvironment = process.env,
): boolean {
  return getFeatureFlags(env)[flag];
}
