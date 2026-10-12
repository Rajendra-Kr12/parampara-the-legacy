import type { Experimental_DecisionResult } from "ai";
import { LayaResponseError } from "./failure.js";
import type { Catalog, Classification, Tier, Volume } from "./types.js";

const TIER_SET = new Set<Tier>(["T0", "T1", "T2", "T3", "R", "D"]);
const VOLUMES: readonly Volume[] = ["small", "bulk"];

export interface LayaClient {
  evaluate(input: {
    readonly task: string;
    readonly catalog: Catalog;
    readonly timeoutMs: number;
  }): Promise<Classification>;
}

const QUESTIONS = {
  tier: {
    type: "choice",
    instructions: "Classify the task tier. A review of any kind is R.",
    criteria: {
      T0: "Trivial and reversible.",
      T1: "Routine implementation in an approved plan.",
      T2: "High-risk domain or security work.",
      T3: "Hardest reasoning or architecture work.",
      R: "Review, including PR, adversarial, security, or domain review.",
      D: "Research or documentation work.",
    },
  },
  touches_high_risk_area: {
    type: "boolean",
    instructions: "Does this task involve graph, kinship, approvals, auth, privacy, migrations, or media access?",
  },
  needs_independent_review: {
    type: "boolean",
    instructions: "Should the resulting work receive independent review?",
  },
  involves_sensitive_context: {
    type: "boolean",
    instructions: "Does the task involve secrets, .env files, real personal data, security findings, or private design rationale?",
  },
  volume: {
    type: "choice",
    instructions: "Classify the amount of work.",
    criteria: {
      small: "One small or normal-sized task.",
      bulk: "Many tests, repetitive boilerplate, or high-volume similar work.",
    },
  },
} as const;

/** The SDK result for QUESTIONS; boolean answers carry a probability, not a value. */
export type LayaEvaluationResult = Pick<Experimental_DecisionResult<typeof QUESTIONS>, "answers">;

const BOOLEAN_THRESHOLD = 0.5;

function choice<T extends string>(answer: { readonly choice?: unknown } | undefined, values: readonly T[], name: string): T {
  const value = answer?.choice;
  const match = values.find((candidate) => candidate === value);
  if (match === undefined) throw new LayaResponseError(`Laya did not return a valid ${name} choice.`);
  return match;
}

function flag(answer: { readonly probability?: unknown } | undefined, name: string): boolean {
  const value = answer?.probability;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) {
    throw new LayaResponseError(`Laya did not return a valid ${name} probability.`);
  }
  return value >= BOOLEAN_THRESHOLD;
}

function probabilities(answer: { readonly probabilities?: unknown } | undefined): Readonly<Record<Tier, number>> {
  const raw = answer?.probabilities;
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new LayaResponseError("Laya did not return tier probabilities.");
  }

  const result = { T0: 0, T1: 0, T2: 0, T3: 0, R: 0, D: 0 } satisfies Record<Tier, number>;
  for (const tier of TIER_SET) {
    const value = Reflect.get(raw, tier);
    if (value !== undefined && (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1)) {
      throw new LayaResponseError("Laya returned invalid tier probabilities.");
    }
    if (typeof value === "number") result[tier] = value;
  }
  return result;
}

export function parseResult(result: LayaEvaluationResult): Classification {
  // The SDK types are compile-time only; answers are re-validated at runtime.
  const answers: Partial<LayaEvaluationResult["answers"]> | undefined = result?.answers;
  return {
    tier: choice(answers?.tier, [...TIER_SET], "tier"),
    tierProbabilities: probabilities(answers?.tier),
    touchesHighRiskArea: flag(answers?.touches_high_risk_area, "touches_high_risk_area"),
    needsIndependentReview: flag(answers?.needs_independent_review, "needs_independent_review"),
    involvesSensitiveContext: flag(answers?.involves_sensitive_context, "involves_sensitive_context"),
    volume: choice(answers?.volume, VOLUMES, "volume"),
  };
}

export const LAYA_MODEL_ID = "convaiinnovations/laya";
const PROVIDER_OPTIONS = { gateway: { only: ["boundless"] } } as const;

/**
 * The documented Laya examples send `state` as a plain string and pin routing to Boundless.
 * Laya sees the task description only; the router applies the catalog's tier and class columns
 * locally after Laya answers, so no catalog content is sent. (Sending a model list made the
 * gateway answer HTTP 422 in a live check on 2026-10-12.)
 */
export function buildLayaRequest(task: string) {
  return { model: LAYA_MODEL_ID, state: task, questions: QUESTIONS, providerOptions: PROVIDER_OPTIONS };
}

export const TASK_PLACEHOLDER = "<TASK_TEXT_REDACTED>";

/** The request shape with the task replaced by a placeholder; safe to paste into a bug report. */
export function describeLayaRequest(): unknown {
  const request = buildLayaRequest(TASK_PLACEHOLDER);
  return { ...request, stateType: typeof request.state, questionTypes: Object.fromEntries(Object.entries(QUESTIONS).map(([name, question]) => [name, question.type])) };
}

export function createAiSdkLayaClient(): LayaClient {
  return {
    async evaluate({ task, timeoutMs }): Promise<Classification> {
      const { experimental_decide } = await import("ai");
      const result = await experimental_decide({
        ...buildLayaRequest(task),
        abortSignal: AbortSignal.timeout(timeoutMs),
      });
      return parseResult(result);
    },
  };
}
