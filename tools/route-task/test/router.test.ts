import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { routeTask } from "../src/router.js";
import type { Classification } from "../src/types.js";

const catalogText = await readFile(new URL("../../test/catalog.fixture.md", import.meta.url), "utf8");
const promotionDate = Date.parse("2026-10-11T00:00:00.000Z");
const afterPromotion = Date.parse("2026-11-01T00:00:00.000Z");

function classification(overrides: Partial<Classification> = {}): Classification {
  return {
    tier: "T1",
    tierProbabilities: { T0: 0, T1: 1, T2: 0, T3: 0, R: 0, D: 0 },
    touchesHighRiskArea: false,
    needsIndependentReview: false,
    involvesSensitiveContext: false,
    volume: "small",
    ...overrides,
  };
}

async function routeWithLaya(result: Classification, task: string = "Implement a public settings screen.") {
  return routeTask({
    task,
    catalogText,
    now: promotionDate,
    loadApiKey: async () => "test-key-not-used-by-mock",
    layaClient: { evaluate: async () => result },
  });
}

test("high-risk rule runs before bulk preference and excludes free models", async () => {
  const result = await routeWithLaya(classification({ tier: "T0", touchesHighRiskArea: true, volume: "bulk" }));
  assert.equal(result.routingPath, "laya");
  assert.equal(result.tier, "T2");
  assert.equal(result.model?.dataClass, "A");
});

test("sensitive context allows only class A models", async () => {
  const result = await routeWithLaya(classification({ volume: "bulk" }), "Route an .env configuration design discussion.");
  assert.equal(result.sensitiveContext, true);
  assert.equal(result.model?.dataClass, "A");
});

test("low tier bulk work prefers a class B model", async () => {
  const result = await routeWithLaya(classification({ tier: "T1", volume: "bulk" }));
  assert.equal(result.model?.dataClass, "B");
  assert.equal("id" in (result.model ?? {}) && result.model.id, "safe-free");
  assert.equal(result.harness, "OpenCode");
});

test("low-tier bulk work prefers the cheapest paid model when no class B model is available", async () => {
  const noClassB = catalogText.replace("| Safe Free | safe-free | B | Zero retention |", "| Safe Free | safe-free | C | Zero retention |");
  const result = await routeTask({
    task: "Implement many public test cases.",
    catalogText: noClassB,
    now: promotionDate,
    loadApiKey: async () => "test-key-not-used-by-mock",
    layaClient: { evaluate: async () => classification({ tier: "T1", volume: "bulk" }) },
  });
  assert.ok(result.model !== undefined && "id" in result.model);
  if (result.model !== undefined && "id" in result.model) {
    assert.equal(result.model.id, "deepseek-v4-flash");
  }
});

test("uncertain classification takes the higher of the top two tiers", async () => {
  const result = await routeWithLaya(classification({
    tier: "T0",
    tierProbabilities: { T0: 0.42, T1: 0.48, T2: 0.1, T3: 0, R: 0, D: 0 },
  }));
  assert.equal(result.tier, "T1");
});

test("review tier never selects a free model", async () => {
  const result = await routeWithLaya(classification({ tier: "R", volume: "bulk" }), "Review this public pull request.");
  assert.equal(result.tier, "R");
  assert.deepEqual(result.model, { name: "Greptile + Codex adversarial review", dataClass: "A" });
});

test("T3 never selects a free model and independent review does not change a low-tier model", async () => {
  const hardest = await routeWithLaya(classification({ tier: "T3", volume: "bulk" }), "Resolve a cross-cutting architecture problem.");
  assert.equal(hardest.model?.dataClass, "A");

  const lowTier = await routeWithLaya(classification({ tier: "T1", volume: "bulk", needsIndependentReview: true }));
  assert.equal(lowTier.model?.dataClass, "B");
  assert.equal(lowTier.needsIndependentReview, true);
});

test("static fallback is explicit for absent key, Laya failure, and paid Laya disabled", async () => {
  const missingKey = await routeTask({ task: "Fix a typo.", catalogText, now: promotionDate, loadApiKey: async () => undefined });
  assert.deepEqual([missingKey.routingPath, missingKey.fallbackReason], ["static", "no-api-key"]);
  assert.equal(missingKey.requiresHumanOrLeadDecision, true);

  const failure = await routeTask({
    task: "Fix a typo.",
    catalogText,
    now: promotionDate,
    loadApiKey: async () => "test-key-not-used-by-mock",
    layaClient: { evaluate: async () => { throw new Error("gateway unavailable"); } },
  });
  assert.deepEqual([failure.routingPath, failure.fallbackReason], ["static", "laya-error-or-timeout"]);

  const timeout = await routeTask({
    task: "Fix a typo.",
    catalogText,
    now: promotionDate,
    timeoutMs: 1,
    loadApiKey: async () => "test-key-not-used-by-mock",
    layaClient: { evaluate: async () => new Promise<Classification>(() => undefined) },
  });
  assert.deepEqual([timeout.routingPath, timeout.fallbackReason], ["static", "laya-error-or-timeout"]);

  const paidDisabled = await routeTask({ task: "Fix a typo.", catalogText, now: afterPromotion, loadApiKey: async () => "test-key-not-used-by-mock" });
  assert.deepEqual([paidDisabled.routingPath, paidDisabled.fallbackReason], ["static", "laya-disabled-after-promotion"]);

  const defaultCatalogPath = await routeTask({ task: "Fix a typo.", now: afterPromotion });
  assert.deepEqual([defaultCatalogPath.routingPath, defaultCatalogPath.fallbackReason], ["static", "laya-disabled-after-promotion"]);
});

test("refuses a task that looks like a secret or personal data", async () => {
  const secret = await routeTask({ task: "Use AI_GATEWAY_API_KEY=abcdef0123456789 in the task.", catalogText });
  assert.deepEqual(secret, { status: "refused", routingPath: "refused", refusalReason: "possible-secret-or-personal-data" });

  const personalData = await routeTask({ task: "Route this phone number: +91 98765 43210.", catalogText });
  assert.equal(personalData.status, "refused");
});
