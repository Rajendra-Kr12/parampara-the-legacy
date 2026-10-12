import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseModelCatalog } from "./catalog.js";
import { classifyFailure, LayaTimeoutError, type FailureDiagnostic } from "./failure.js";
import { createAiSdkLayaClient, type LayaClient } from "./laya.js";
import type { Catalog, CatalogModel, Classification, RoutingDecision, SelectedModel, Tier, Volume } from "./types.js";

const DEFAULT_TIMEOUT_MS = 30_000;
const PROMOTION_END = Date.parse("2026-11-01T00:00:00.000Z");
const MINIMUM_TIER_RANK: Readonly<Record<Tier, number>> = { T0: 0, D: 1, T1: 1, T2: 2, R: 3, T3: 3 };
const TIE_BREAK_ORDER: readonly Tier[] = ["T0", "D", "T1", "T2", "T3", "R"];
const STATIC_DEFAULTS: Readonly<Record<Exclude<Tier, "R">, string>> = {
  T0: "claude-haiku-5-5",
  T1: "claude-sonnet-5-5",
  T2: "claude-opus-5-5",
  T3: "claude-fable-5-1",
  D: "claude-sonnet-5-5",
};

const TOOL_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_CATALOG_PATH = path.resolve(TOOL_DIRECTORY, "../../../../docs/model-catalog.md");
const DEFAULT_ENV_PATH = path.resolve(TOOL_DIRECTORY, "../../../../.env.local");
type ModelSelection = Exclude<RoutingDecision["model"], undefined>;

export interface RouteTaskOptions {
  readonly task: string;
  readonly catalogText?: string;
  readonly now?: number;
  readonly environment?: NodeJS.ProcessEnv;
  readonly loadApiKey?: () => Promise<string | undefined>;
  readonly layaClient?: LayaClient;
  readonly timeoutMs?: number;
  readonly diagnose?: boolean;
}

function positiveBoolean(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

function containsProhibitedData(task: string): boolean {
  const secretPatterns = [
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/i,
    /(?<![A-Za-z0-9])(?:sk|rk|pk|ghp|xox[baprs])[-_][A-Za-z0-9_-]{16,}/,
    /(?<![A-Za-z0-9])(?:api[_-]?key|passw(?:or)?d|pwd|secret|token)\b\s*[:=]\s*["']?[^\s"']+/i,
    /(?<![A-Za-z0-9])(?:passw(?:or)?d|pwd|passphrase)\s+(?:is|was)\s+["']?[^\s"']+/i,
    /authorization\s*:\s*bearer\s+[A-Za-z0-9_\-/+=.]{16,}/i,
  ];
  const personalDataPatterns = [
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
    /(?<!\d)(?:\+?\d[\s()-]?){10,14}\d(?!\d)/,
  ];
  return [...secretPatterns, ...personalDataPatterns].some((pattern) => pattern.test(task));
}

function hasSensitiveContext(task: string): boolean {
  return /(?:\.env(?:\.[a-z0-9_-]+)?\b|security findings?|private design rationale|confidential|personal data|\b(?:secrets?|api keys?|tokens?|passwords?)\b)/i.test(task);
}

const HIGH_RISK_PATTERN = new RegExp(
  "\\b(?:secur\\w*|vulnerabilit\\w*|exploit\\w*|encrypt\\w*|crypto\\w*|credential\\w*|permission\\w*|access[- ]control|rbac|" +
    "auth(?:entication|orization|orisation|z|n)?|privacy|consent|pii|retention|migrat\\w*|signed[- ]urls?|media[- ]access|" +
    "kinship|approvals?|relationships?|genealog\\w*|lineage|ancest\\w*)\\b",
  "i",
);
const FAMILY_PATTERN = /\bfamil\w*/i;
const GRAPH_PATTERN = /\b(?:graph|tree|edges?|nodes?|relations?|kin|lineage|branch(?:es)?|paths?)\b/i;

function detectsHighRiskArea(task: string): boolean {
  return HIGH_RISK_PATTERN.test(task) || (FAMILY_PATTERN.test(task) && GRAPH_PATTERN.test(task));
}

function staticClassification(task: string): Classification {
  const highRisk = detectsHighRiskArea(task);
  let tier: Tier = "T1";
  if (/\b(?:review|adversarial review|security review|domain review|pull request|pr)\b/i.test(task)) tier = "R";
  else if (highRisk) tier = "T2";
  else if (/\b(?:research|compare|documentation|docs?|investigate)\b/i.test(task)) tier = "D";
  else if (/\b(?:typo|rename|format|spelling|config value)\b/i.test(task)) tier = "T0";
  else if (/\b(?:architecture|ambiguous|adr|cross-cutting)\b/i.test(task)) tier = "T3";

  return {
    tier,
    tierProbabilities: { T0: tier === "T0" ? 1 : 0, T1: tier === "T1" ? 1 : 0, T2: tier === "T2" ? 1 : 0, T3: tier === "T3" ? 1 : 0, R: tier === "R" ? 1 : 0, D: tier === "D" ? 1 : 0 },
    touchesHighRiskArea: highRisk,
    needsIndependentReview: highRisk || tier === "T3",
    involvesSensitiveContext: hasSensitiveContext(task),
    volume: /\b(?:bulk|many|boilerplate|test cases|tests)\b/i.test(task) ? "bulk" : "small",
  };
}

function enforceTaskSignals(task: string, classification: Classification): Classification {
  const touchesHighRiskArea = classification.touchesHighRiskArea || detectsHighRiskArea(task);
  return {
    ...classification,
    touchesHighRiskArea,
    needsIndependentReview: classification.needsIndependentReview || touchesHighRiskArea,
    involvesSensitiveContext: classification.involvesSensitiveContext || hasSensitiveContext(task),
  };
}

function adjustedTier(classification: Classification): Tier {
  const ranked = (Object.entries(classification.tierProbabilities) as [Tier, number][])
    .sort((left, right) => right[1] - left[1]);
  const first = ranked[0];
  const second = ranked[1];
  const total = ranked.reduce((sum, [, probability]) => sum + probability, 0);
  let tier = classification.tier;
  if (total > 0 && first !== undefined && second !== undefined && first[1] < 0.7) {
    tier = TIE_BREAK_ORDER.indexOf(first[0]) >= TIE_BREAK_ORDER.indexOf(second[0]) ? first[0] : second[0];
  }
  if (classification.touchesHighRiskArea && MINIMUM_TIER_RANK[tier] < MINIMUM_TIER_RANK.T2) return "T2";
  return tier;
}

function defaultHarness(tier: Tier): string {
  if (tier === "R") return "GitHub and Codex";
  if (tier === "T2" || tier === "T3") return "Claude Code";
  if (tier === "T1" || tier === "D") return "Claude Code";
  return "OpenCode";
}

function cheapest(models: readonly CatalogModel[]): CatalogModel | undefined {
  return [...models].sort((left, right) => {
    const leftCost = (left.inputPrice ?? Number.POSITIVE_INFINITY) + (left.outputPrice ?? Number.POSITIVE_INFINITY);
    const rightCost = (right.inputPrice ?? Number.POSITIVE_INFINITY) + (right.outputPrice ?? Number.POSITIVE_INFINITY);
    return leftCost - rightCost;
  })[0];
}

function asSelection(model: CatalogModel, selectionReason: SelectedModel["selectionReason"]): SelectedModel {
  return { id: model.id, name: model.name, dataClass: model.dataClass, selectionReason };
}

function selectModel(catalog: Catalog, tier: Tier, sensitive: boolean, volume: Volume): ModelSelection {
  if (tier === "R") return { name: "Greptile + Codex adversarial review", dataClass: "A" };

  const permitted = catalog.models.filter((model) => (!sensitive || model.dataClass === "A"));
  const freeAllowed = (tier === "T0" || tier === "T1" || tier === "D") && !sensitive;
  if (freeAllowed && volume === "bulk") {
    const free = permitted.find((model) => model.dataClass === "B" && model.tiers.includes(tier));
    if (free !== undefined) return asSelection(free, "bulk-class-b-free");
    const cheapPaid = cheapest(permitted.filter((model) => model.dataClass === "A" && model.tiers.includes(tier)));
    if (cheapPaid !== undefined) return asSelection(cheapPaid, "bulk-cheap-paid");
  }

  const defaultId = STATIC_DEFAULTS[tier];
  const defaultModel = permitted.find((model) => model.id === defaultId);
  if (defaultModel === undefined) {
    throw new Error(`Static default model ${defaultId} is missing from the model catalog.`);
  }
  return asSelection(defaultModel, "default");
}

function decision(catalog: Catalog, classification: Classification, routingPath: "laya" | "static", fallbackReason?: RoutingDecision["fallbackReason"], diagnostic?: FailureDiagnostic): RoutingDecision {
  const tier = adjustedTier(classification);
  const sensitive = classification.involvesSensitiveContext;
  const model = selectModel(catalog, tier, sensitive, classification.volume);
  return {
    status: "routed",
    routingPath,
    ...(routingPath === "static" ? { requiresHumanOrLeadDecision: true } : {}),
    ...(fallbackReason === undefined ? {} : { fallbackReason }),
    ...(diagnostic === undefined ? {} : { diagnostic }),
    tier,
    sensitiveContext: sensitive,
    touchesHighRiskArea: classification.touchesHighRiskArea,
    needsIndependentReview: classification.needsIndependentReview,
    volume: classification.volume,
    model,
    harness: model.dataClass === "B" ? "OpenCode" : defaultHarness(tier),
  };
}

async function evaluateWithTimeout(client: LayaClient, task: string, catalog: Catalog, timeoutMs: number): Promise<Classification> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      client.evaluate({ task, catalog, timeoutMs }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new LayaTimeoutError("Laya evaluation timed out.")), timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

export async function loadGatewayApiKey(
  environment: NodeJS.ProcessEnv = process.env,
  envPath: string = DEFAULT_ENV_PATH,
): Promise<string | undefined> {
  const existing = environment.AI_GATEWAY_API_KEY?.trim();
  if (existing !== undefined && existing.length > 0) return existing;
  try {
    const source = await readFile(envPath, "utf8");
    const match = /^\s*AI_GATEWAY_API_KEY\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s#]+))\s*(?:#.*)?$/m.exec(source);
    const value = match?.[1] ?? match?.[2] ?? match?.[3];
    return value?.trim() || undefined;
  } catch {
    return undefined;
  }
}

export async function routeTask(options: RouteTaskOptions): Promise<RoutingDecision> {
  const task = options.task.trim();
  if (task.length === 0 || task.length > 6_000) {
    return { status: "refused", routingPath: "refused", refusalReason: "invalid-task-length" };
  }
  if (containsProhibitedData(task)) {
    return { status: "refused", routingPath: "refused", refusalReason: "possible-secret-or-personal-data" };
  }

  const catalogText = options.catalogText ?? (await readFile(DEFAULT_CATALOG_PATH, "utf8"));
  const catalog = parseModelCatalog(catalogText);
  const environment = options.environment ?? process.env;
  const now = options.now ?? Date.now();
  const paidLayaEnabled = positiveBoolean(environment.ROUTE_TASK_ENABLE_PAID_LAYA);
  const layaAllowed = now < PROMOTION_END || paidLayaEnabled;
  if (!layaAllowed) return decision(catalog, staticClassification(task), "static", "laya-disabled-after-promotion");

  const key = await (options.loadApiKey ?? (() => loadGatewayApiKey(environment)))();
  if (key === undefined) return decision(catalog, staticClassification(task), "static", "no-api-key");

  let classification: Classification;
  try {
    if (!environment.AI_GATEWAY_API_KEY?.trim()) environment.AI_GATEWAY_API_KEY = key;
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    classification = enforceTaskSignals(
      task,
      await evaluateWithTimeout(options.layaClient ?? createAiSdkLayaClient(), task, catalog, timeoutMs),
    );
  } catch (error: unknown) {
    const failure = classifyFailure(error);
    return decision(catalog, staticClassification(task), "static", failure.category, options.diagnose === true ? failure : undefined);
  }
  return decision(catalog, classification, "laya");
}
