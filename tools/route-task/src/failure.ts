export const FAILURE_CATEGORIES = [
  "laya-timeout",
  "laya-auth",
  "laya-rate-limited",
  "laya-model-unavailable",
  "laya-provider-restricted",
  "laya-bad-response",
  "laya-unknown",
] as const;

export type FailureCategory = (typeof FAILURE_CATEGORIES)[number];

/** Sanitized description of a Laya failure: class name and HTTP status only, never a message or body. */
export interface FailureDiagnostic {
  readonly category: FailureCategory;
  readonly errorClass: string;
  readonly statusCode?: number;
}

export class LayaTimeoutError extends Error {
  override readonly name = "LayaTimeoutError";
}

export class LayaResponseError extends Error {
  override readonly name = "LayaResponseError";
}

const SAFE_NAME = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;
const BAD_RESPONSE_CLASSES = new Set([
  "LayaResponseError",
  "JSONParseError",
  "TypeValidationError",
  "InvalidResponseDataError",
  "EmptyResponseBodyError",
  "NoContentGeneratedError",
  "DecisionRefusalError",
  "DecisionUnsupportedQuestionTypeError",
  "GatewayResponseError",
]);
const TIMEOUT_CLASSES = new Set(["LayaTimeoutError", "TimeoutError", "AbortError"]);
const AUTH_CLASSES = new Set(["GatewayAuthenticationError", "LoadAPIKeyError", "LoadSettingError"]);
const MODEL_CLASSES = new Set(["GatewayModelNotFoundError", "GatewayNotFoundError", "NoSuchModelError"]);

function errorName(error: unknown): string {
  const name = error instanceof Error ? error.name : undefined;
  return name !== undefined && SAFE_NAME.test(name) ? name : "UnknownError";
}

function statusOf(error: unknown): number | undefined {
  if (error === null || typeof error !== "object") return undefined;
  const status = Reflect.get(error, "statusCode") ?? Reflect.get(error, "status");
  return typeof status === "number" && Number.isInteger(status) && status >= 100 && status <= 599 ? status : undefined;
}

function causeChain(error: unknown): unknown[] {
  const chain: unknown[] = [];
  let current: unknown = error;
  for (let depth = 0; depth < 4 && current !== undefined && current !== null; depth += 1) {
    chain.push(current);
    current = typeof current === "object" ? Reflect.get(current, "cause") : undefined;
  }
  return chain;
}

/** SDK error names carry an "AI_" prefix and, for experimental errors, an "Experimental_" prefix. */
function normalize(name: string): string {
  return name.replace(/^AI_/, "").replace(/^Experimental_/, "");
}

function categorize(rawName: string, status: number | undefined): FailureCategory | undefined {
  const name = normalize(rawName);
  if (TIMEOUT_CLASSES.has(name) || status === 408 || status === 504) return "laya-timeout";
  if (BAD_RESPONSE_CLASSES.has(name)) return "laya-bad-response";
  if (status === 429 || name === "GatewayRateLimitError") return "laya-rate-limited";
  if (status === 401 || AUTH_CLASSES.has(name)) return "laya-auth";
  if (status === 402 || status === 403 || name === "GatewayForbiddenError") return "laya-provider-restricted";
  if (status === 404 || MODEL_CLASSES.has(name)) return "laya-model-unavailable";
  return undefined;
}

/** Derives a safe category from the error class and HTTP status only. */
export function classifyFailure(error: unknown): FailureDiagnostic {
  const chain = causeChain(error);
  for (const candidate of chain) {
    const name = errorName(candidate);
    const status = statusOf(candidate);
    const category = categorize(name, status);
    if (category !== undefined) {
      return { category, errorClass: name, ...(status === undefined ? {} : { statusCode: status }) };
    }
  }
  const status = chain.map(statusOf).find((value) => value !== undefined);
  return { category: "laya-unknown", errorClass: errorName(error), ...(status === undefined ? {} : { statusCode: status }) };
}
