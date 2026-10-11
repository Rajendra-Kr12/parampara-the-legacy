import type { Catalog, Classification, Tier, Volume } from "./types.js";

const TIER_SET = new Set<Tier>(["T0", "T1", "T2", "T3", "R", "D"]);

export interface LayaClient {
  evaluate(input: {
    readonly task: string;
    readonly catalog: Catalog;
    readonly timeoutMs: number;
  }): Promise<Classification>;
}

interface RawChoiceAnswer {
  readonly choice?: unknown;
  readonly probabilities?: unknown;
}

interface RawBooleanAnswer {
  readonly value?: unknown;
}

interface RawEvaluationResult {
  readonly answers?: {
    readonly tier?: RawChoiceAnswer;
    readonly touches_high_risk_area?: RawBooleanAnswer;
    readonly needs_independent_review?: RawBooleanAnswer;
    readonly involves_sensitive_context?: RawBooleanAnswer;
    readonly volume?: RawChoiceAnswer;
  };
}

function choice(answer: RawChoiceAnswer | undefined, values: readonly string[], name: string): string {
  if (typeof answer?.choice !== "string" || !values.includes(answer.choice)) {
    throw new Error(`Laya did not return a valid ${name} choice.`);
  }
  return answer.choice;
}

function boolean(answer: RawBooleanAnswer | undefined, name: string): boolean {
  if (typeof answer?.value !== "boolean") {
    throw new Error(`Laya did not return a valid ${name} boolean.`);
  }
  return answer.value;
}

function probabilities(answer: RawChoiceAnswer | undefined): Readonly<Record<Tier, number>> {
  const raw = answer?.probabilities;
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Laya did not return tier probabilities.");
  }

  const result = { T0: 0, T1: 0, T2: 0, T3: 0, R: 0, D: 0 } satisfies Record<Tier, number>;
  for (const tier of TIER_SET) {
    const value = Reflect.get(raw, tier);
    if (value !== undefined && (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1)) {
      throw new Error("Laya returned invalid tier probabilities.");
    }
    if (typeof value === "number") result[tier] = value;
  }
  return result;
}

function parseResult(result: RawEvaluationResult): Classification {
  const answers = result.answers;
  const tier = choice(answers?.tier, [...TIER_SET], "tier") as Tier;
  const volume = choice(answers?.volume, ["small", "bulk"], "volume") as Volume;
  return {
    tier,
    tierProbabilities: probabilities(answers?.tier),
    touchesHighRiskArea: boolean(answers?.touches_high_risk_area, "touches_high_risk_area"),
    needsIndependentReview: boolean(answers?.needs_independent_review, "needs_independent_review"),
    involvesSensitiveContext: boolean(answers?.involves_sensitive_context, "involves_sensitive_context"),
    volume,
  };
}

export function createAiSdkLayaClient(): LayaClient {
  return {
    async evaluate({ task, catalog, timeoutMs }): Promise<Classification> {
      const { experimental_evaluate } = await import("ai");
      const result = (await experimental_evaluate({
        model: "convaiinnovations/laya",
        state: {
          task,
          availableModels: catalog.models.map((model) => ({
            tiers: model.tiers,
            dataClass: model.dataClass,
          })),
        },
        questions: {
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
        },
        providerOptions: { gateway: { only: ["boundless"] } },
        abortSignal: AbortSignal.timeout(timeoutMs),
      })) as RawEvaluationResult;
      return parseResult(result);
    },
  };
}
