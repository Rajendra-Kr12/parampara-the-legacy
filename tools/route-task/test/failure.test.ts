import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { APICallError, LoadAPIKeyError, NoSuchModelError } from "ai";
import { classifyFailure, LayaResponseError, LayaTimeoutError, type FailureDiagnostic } from "../src/failure.js";
import { routeTask } from "../src/router.js";
import { buildLayaRequest, describeLayaRequest, TASK_PLACEHOLDER } from "../src/laya.js";
import { parseModelCatalog } from "../src/catalog.js";
import { runCli } from "../src/run.js";

const catalogText = await readFile(new URL("../../test/catalog.fixture.md", import.meta.url), "utf8");
const promotionDate = Date.parse("2026-10-11T00:00:00.000Z");

function named(name: string, statusCode?: number, message = "SECRET-PROVIDER-TEXT /Users/x/path"): Error {
  const error = new Error(message);
  error.name = name;
  if (statusCode !== undefined) Object.assign(error, { statusCode });
  return error;
}

function apiError(statusCode: number): APICallError {
  return new APICallError({ message: "SECRET-PROVIDER-TEXT", url: "https://example.invalid/?key=SECRET", requestBodyValues: { task: "SECRET-TASK" }, statusCode });
}

const cases: readonly [string, unknown, FailureDiagnostic["category"], number | undefined][] = [
  ["our timeout", new LayaTimeoutError("t"), "laya-timeout", undefined],
  ["abort signal timeout", new DOMException("x", "TimeoutError"), "laya-timeout", undefined],
  ["HTTP 504", apiError(504), "laya-timeout", 504],
  ["HTTP 401", apiError(401), "laya-auth", 401],
  ["gateway auth class", named("GatewayAuthenticationError", 401), "laya-auth", 401],
  ["missing key class", new LoadAPIKeyError({ message: "SECRET" }), "laya-auth", undefined],
  ["HTTP 429", apiError(429), "laya-rate-limited", 429],
  ["gateway rate limit class", named("GatewayRateLimitError", 429), "laya-rate-limited", 429],
  ["HTTP 404", apiError(404), "laya-model-unavailable", 404],
  ["no such model", new NoSuchModelError({ modelId: "convaiinnovations/laya", modelType: "languageModel" }), "laya-model-unavailable", undefined],
  ["HTTP 403", apiError(403), "laya-provider-restricted", 403],
  ["HTTP 402", apiError(402), "laya-provider-restricted", 402],
  ["unparseable answer", new LayaResponseError("bad"), "laya-bad-response", undefined],
  ["gateway response class", named("GatewayResponseError", 502), "laya-bad-response", 502],
  ["HTTP 422", apiError(422), "laya-bad-request", 422],
  ["HTTP 400", apiError(400), "laya-bad-request", 400],
  ["gateway internal error class with 422", named("GatewayInternalServerError", 422), "laya-bad-request", 422],
  ["HTTP 500", apiError(500), "laya-unknown", 500],
  ["plain error", new Error("boom"), "laya-unknown", undefined],
  ["non-error throw", "SECRET string", "laya-unknown", undefined],
  ["wrapped cause", Object.assign(new Error("wrapper"), { cause: apiError(429) }), "laya-rate-limited", 429],
  ["hostile class name", named("Bad Name /Users/x", undefined), "laya-unknown", undefined],
];

for (const [label, error, category, statusCode] of cases) {
  test(`classifies ${label} as ${category}`, () => {
    const result = classifyFailure(error);
    assert.equal(result.category, category);
    assert.equal(result.statusCode, statusCode);
    const serialized = JSON.stringify(result);
    assert.ok(!/SECRET|\/Users|example\.invalid/.test(serialized), serialized);
  });
}

test("fallbackReason carries the category and diagnostic appears only when requested", async () => {
  const options = {
    task: "Fix a typo.",
    catalogText,
    now: promotionDate,
    loadApiKey: async () => "key-value-not-printed",
    layaClient: { evaluate: async () => { throw apiError(429); } },
  };
  const quiet = await routeTask(options);
  assert.equal(quiet.routingPath, "static");
  assert.equal(quiet.fallbackReason, "laya-rate-limited");
  assert.equal(quiet.diagnostic, undefined);

  const verbose = await routeTask({ ...options, diagnose: true });
  assert.deepEqual(verbose.diagnostic, { category: "laya-rate-limited", errorClass: "AI_APICallError", statusCode: 429 });
  const text = JSON.stringify(verbose);
  assert.ok(!/SECRET|key-value-not-printed|Fix a typo/.test(text));
});

test("--diagnose reaches the router and is opt-in", async () => {
  const seen: (boolean | undefined)[] = [];
  const io = { stdout: () => undefined, stderr: () => undefined, route: async (o: { diagnose?: boolean }) => { seen.push(o.diagnose); return { status: "routed", routingPath: "static" } as const; } };
  await runCli(["--task", "x"], io);
  await runCli(["--task", "x", "--diagnose"], io);
  assert.deepEqual(seen, [false, true]);
});

test("422 diagnostics expose only a short provider code and field name, never the body", () => {
  const error = new APICallError({
    message: "SECRET-PROVIDER-TEXT for task SECRET-TASK",
    url: "https://example.invalid/?key=SECRET",
    requestBodyValues: { task: "SECRET-TASK" },
    statusCode: 422,
    responseBody: JSON.stringify({ error: { code: "invalid_question", param: "questions.tier.criteria", message: "SECRET-TASK is not valid at /Users/x/y" } }),
  });
  const result = classifyFailure(error);
  assert.deepEqual(result, { category: "laya-bad-request", errorClass: "AI_APICallError", statusCode: 422, providerCode: "invalid_question", field: "questions.tier.criteria" });
  assert.ok(!/SECRET|\/Users/.test(JSON.stringify(result)));
});

test("provider codes that are not short tokens are dropped", () => {
  const error = new APICallError({
    message: "m",
    url: "https://example.invalid",
    requestBodyValues: {},
    statusCode: 422,
    responseBody: JSON.stringify({ error: { code: "SECRET task text with spaces /Users/x", param: "a b" } }),
  });
  const result = classifyFailure(error);
  assert.equal(result.providerCode, undefined);
  assert.equal(result.field, undefined);
});

test("the Laya request sends the task as a string state, pins Boundless, and carries no catalog content", () => {
  const catalog = parseModelCatalog(catalogText);
  const request = buildLayaRequest("Classify a docs update.");
  assert.equal(request.model, "convaiinnovations/laya");
  assert.equal(request.state, "Classify a docs update.");
  assert.deepEqual(request.providerOptions, { gateway: { only: ["boundless"] } });
  const serialized = JSON.stringify(request);
  for (const model of catalog.models) assert.ok(!serialized.includes(model.id), model.id);
  assert.ok(!/\d+\.\d+ \/ \d+\.\d+|price/i.test(request.state));
});

test("--diagnose-request prints the request shape with the task replaced and does not route", async () => {
  const out: string[] = [];
  let routed = false;
  const code = await runCli(["--diagnose-request", "--task", "SECRET-TASK"], {
    stdout: (t) => void out.push(t),
    stderr: () => undefined,
    route: async () => { routed = true; return { status: "routed", routingPath: "static" } as const; },
  });
  assert.equal(code, 0);
  assert.equal(routed, false);
  const text = out.join("");
  assert.ok(text.includes(TASK_PLACEHOLDER));
  assert.ok(!text.includes("SECRET-TASK"));
  assert.deepEqual(JSON.parse(text), JSON.parse(JSON.stringify(describeLayaRequest())));
});
