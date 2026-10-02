export type FeatureFlagName =
  | "permissionDbAuthorization"
  | "cursorPagination"
  | "mediaCleanup"
  | "videoUpload";

export type FeatureFlags = Record<FeatureFlagName, boolean>;

export type FeatureFlagEnvironment = Record<string, string | undefined>;

export const featureFlagEnvNames = {
  permissionDbAuthorization: "FEATURE_PERMISSION_DB_AUTHORIZATION",
  cursorPagination: "FEATURE_CURSOR_PAGINATION",
  mediaCleanup: "FEATURE_MEDIA_CLEANUP",
  videoUpload: "FEATURE_VIDEO_UPLOAD",
} as const satisfies Record<FeatureFlagName, string>;

const enabledValues = new Set(["1", "on", "true", "yes"]);

/**
 * Parse a feature flag without failing startup for an absent or malformed value.
 * Rollout switches are intentionally fail-closed by default.
 *
 * `defaultValue` 用于「默认开启、需要时显式关闭」的功能开关
 * （例如视频上传：未配置任何环境变量时应保持与历史行为一致）。
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

/**
 * 视频上传默认开启，只有在显式配置 FEATURE_VIDEO_UPLOAD 为关闭值时才禁用。
 *
 * 关闭后：不再签发新的上传凭证（/api/video/sts 直接拒绝），
 * 但已上传并通过审核的历史视频仍可正常播放，
 * 用于在预算紧张时停止视频带来的流量与转码开销。
 */
export function isVideoUploadEnabled(
  env: FeatureFlagEnvironment = process.env,
): boolean {
  return parseFeatureFlag(env[featureFlagEnvNames.videoUpload], true);
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
    videoUpload: isVideoUploadEnabled(env),
  };
}

export function isFeatureEnabled(
  flag: FeatureFlagName,
  env: FeatureFlagEnvironment = process.env,
): boolean {
  return getFeatureFlags(env)[flag];
}
