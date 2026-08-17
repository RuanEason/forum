import assert from "node:assert/strict";
import test from "node:test";

import {
  createHealthcheckPayload,
  getHealthcheckSecretFromHeaders,
  isHealthcheckSecretValid,
} from "../src/lib/healthcheck";
import {
  getDevToolboxState,
  getRuntimeEnvironment,
  isDevToolboxEnabled,
  isProductionEnvironment,
} from "../src/lib/dev-toolbox";

test("healthcheck accepts only the configured internal secret", () => {
  assert.equal(isHealthcheckSecretValid("correct-secret", "correct-secret"), true);
  assert.equal(isHealthcheckSecretValid("wrong-secret", "correct-secret"), false);
  assert.equal(isHealthcheckSecretValid(undefined, "correct-secret"), false);
  assert.equal(isHealthcheckSecretValid("correct-secret", undefined), false);
});

test("healthcheck secret can be sent by an internal header or bearer token", () => {
  assert.equal(
    getHealthcheckSecretFromHeaders(new Headers({ "x-healthcheck-secret": "header-secret" })),
    "header-secret",
  );
  assert.equal(
    getHealthcheckSecretFromHeaders(new Headers({ authorization: "Bearer bearer-secret" })),
    "bearer-secret",
  );
  assert.equal(
    getHealthcheckSecretFromHeaders(new Headers({ authorization: "Basic not-a-healthcheck" })),
    null,
  );
});

test("healthcheck responses contain only safe fields", () => {
  const payload = createHealthcheckPayload(true, "12ms", "2026-08-17T00:00:00.000Z");

  assert.deepEqual(payload, {
    ok: true,
    responseTime: "12ms",
    timestamp: "2026-08-17T00:00:00.000Z",
  });
  assert.deepEqual(Object.keys(payload).sort(), ["ok", "responseTime", "timestamp"]);
});

test("production health checks and debug tools fail closed", () => {
  const productionEnvironment = {
    NODE_ENV: "production",
    DEV_TOOLBOX_ENABLED: "true",
  };

  assert.equal(getRuntimeEnvironment(productionEnvironment), "production");
  assert.equal(isProductionEnvironment(productionEnvironment), true);
  assert.equal(isDevToolboxEnabled(productionEnvironment), false);
});

test("staging debug tools require explicit environment and feature flag", () => {
  const stagingEnvironment = {
    NODE_ENV: "production",
    APP_ENV: "staging",
    DEV_TOOLBOX_ENABLED: "true",
  };

  assert.equal(getRuntimeEnvironment(stagingEnvironment), "staging");
  assert.equal(isProductionEnvironment(stagingEnvironment), false);
  assert.equal(isDevToolboxEnabled(stagingEnvironment), true);
  assert.deepEqual(getDevToolboxState(stagingEnvironment), {
    enabled: true,
    flagEnabled: true,
    environment: "staging",
  });

  assert.equal(
    isDevToolboxEnabled({ NODE_ENV: "production", APP_ENV: "staging" }),
    false,
  );
});
