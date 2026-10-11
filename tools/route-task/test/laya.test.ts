import assert from "node:assert/strict";
import test from "node:test";
import { parseResult, type LayaEvaluationResult } from "../src/laya.js";

const tierProbabilities = { T0: 0.05, T1: 0.1, T2: 0.75, T3: 0.05, R: 0.03, D: 0.02 };

function sdkResult(overrides: Record<string, unknown> = {}): LayaEvaluationResult {
  return {
    answers: {
      tier: { type: "choice", choice: "T2", probabilities: tierProbabilities },
      touches_high_risk_area: { type: "boolean", probability: 0.9 },
      needs_independent_review: { type: "boolean", probability: 0.2 },
      involves_sensitive_context: { type: "boolean", probability: 0.5 },
      volume: { type: "choice", choice: "bulk", probabilities: { small: 0.2, bulk: 0.8 } },
      ...overrides,
    },
  } as LayaEvaluationResult;
}

test("parseResult maps a representative SDK answer to a classification", () => {
  assert.deepEqual(parseResult(sdkResult()), {
    tier: "T2",
    tierProbabilities,
    touchesHighRiskArea: true,
    needsIndependentReview: false,
    involvesSensitiveContext: true,
    volume: "bulk",
  });
});

test("parseResult rejects invalid SDK answers", () => {
  const invalid: Record<string, unknown>[] = [
    { tier: { type: "choice", choice: "T9", probabilities: tierProbabilities } },
    { tier: { type: "choice", choice: "T2" } },
    { tier: { type: "choice", choice: "T2", probabilities: { ...tierProbabilities, T2: 1.5 } } },
    { touches_high_risk_area: { type: "boolean", value: true } },
    { needs_independent_review: { type: "boolean", probability: "high" } },
    { involves_sensitive_context: { type: "boolean", probability: Number.NaN } },
    { volume: { type: "choice", choice: "huge" } },
  ];
  for (const overrides of invalid) assert.throws(() => parseResult(sdkResult(overrides)));
  assert.throws(() => parseResult({} as LayaEvaluationResult));
});
