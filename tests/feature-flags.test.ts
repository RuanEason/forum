import assert from "node:assert/strict";
import test from "node:test";

import {
  featureFlagEnvNames,
  getFeatureFlags,
  parseFeatureFlag,
} from "../src/lib/feature-flags";

test("feature flags are disabled when no environment value is provided", () => {
  assert.deepEqual(getFeatureFlags({}), {
    permissionDbAuthorization: false,
    cursorPagination: false,
    mediaCleanup: false,
  });
});

test("feature flag parser accepts explicit enabled values", () => {
  for (const value of ["1", "on", "true", "yes", " TRUE "]) {
    assert.equal(parseFeatureFlag(value), true, value);
  }

  assert.equal(parseFeatureFlag("false", true), false);
  assert.equal(parseFeatureFlag("unexpected", true), false);
});

test("feature flags can be enabled independently per environment", () => {
  const flags = getFeatureFlags({
    [featureFlagEnvNames.permissionDbAuthorization]: "true",
    [featureFlagEnvNames.cursorPagination]: "0",
    [featureFlagEnvNames.mediaCleanup]: "on",
  });

  assert.deepEqual(flags, {
    permissionDbAuthorization: true,
    cursorPagination: false,
    mediaCleanup: true,
  });
});
