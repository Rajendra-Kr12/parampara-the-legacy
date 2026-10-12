// Probes for the enforcement ledger in docs/coding-standards.md. Each probe feeds a
// deliberately broken fixture to the real tool configuration and asserts the tool
// rejects it for the expected reason, so a rule that silently stops firing fails here.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";
import * as prettier from "prettier";
import ts from "typescript";
import prettierConfig from "../prettier.mjs";
import { checkWorkflow } from "./workflow-policy.mjs";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));
const fixture = (name) => here(`./fixtures/${name}`);
const repoRoot = here("../../../");

function typeErrors(file) {
  const config = ts.readConfigFile(here("./tsconfig.json"), ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, here("."));
  const program = ts.createProgram([file], parsed.options);
  return ts.getPreEmitDiagnostics(program).map((diagnostic) => diagnostic.code);
}

async function lintMessages(file) {
  const eslint = new ESLint({
    cwd: here("."),
    overrideConfigFile: here("./eslint.probe.config.mjs"),
  });
  const [result] = await eslint.lintFiles([file]);
  return result.messages;
}

test("control: the clean fixture passes typecheck, lint and format", async () => {
  assert.deepEqual(typeErrors(fixture("clean.ts")), []);
  assert.deepEqual(await lintMessages(fixture("clean.ts")), []);
  const source = readFileSync(fixture("clean.ts"), "utf8");
  assert.equal(await prettier.check(source, { ...prettierConfig, parser: "typescript" }), true);
});

test("strict typecheck: implicit any is an error (TS7006)", () => {
  assert.ok(typeErrors(fixture("strict-implicit-any.ts")).includes(7006));
});

test("strict typecheck: noUncheckedIndexedAccess is on", () => {
  const codes = typeErrors(fixture("strict-unchecked-index.ts"));
  assert.ok(
    codes.some((code) => code === 2532 || code === 18048),
    `got ${codes.join(",")}`,
  );
});

test("strict typecheck: exactOptionalPropertyTypes is on (TS2375)", () => {
  assert.ok(typeErrors(fixture("strict-exact-optional.ts")).includes(2375));
});

test("lint: any, non-null assertions and ts-ignore are errors", async () => {
  const ruleIds = (await lintMessages(fixture("lint-escape-hatches.ts"))).map((m) => m.ruleId);
  for (const rule of [
    "@typescript-eslint/no-explicit-any",
    "@typescript-eslint/no-non-null-assertion",
    "@typescript-eslint/ban-ts-comment",
  ]) {
    assert.ok(ruleIds.includes(rule), `${rule} did not fire; got ${ruleIds.join(",")}`);
  }
});

test("lint: domain packages cannot import react, convex or clerk", async () => {
  const messages = (await lintMessages(fixture("domain-impure-imports.ts"))).filter(
    (m) => m.ruleId === "no-restricted-imports",
  );
  assert.equal(messages.length, 3, JSON.stringify(messages));
});

test("format: unformatted source fails the Prettier check", async () => {
  const source = readFileSync(fixture("unformatted.ts"), "utf8");
  assert.equal(await prettier.check(source, { ...prettierConfig, parser: "typescript" }), false);
});

test("format: the root package points Prettier at the shared config", () => {
  const rootPackage = JSON.parse(readFileSync(`${repoRoot}package.json`, "utf8"));
  assert.equal(rootPackage.prettier, "@parampara/config/prettier");
});

test("ci: the real workflow pins actions by SHA and has read-only permissions", () => {
  const workflow = readFileSync(`${repoRoot}.github/workflows/ci.yml`, "utf8");
  assert.deepEqual(checkWorkflow(workflow), []);
});

test("ci: the workflow policy rejects unpinned actions and write permissions", () => {
  const bad = [
    "name: bad",
    "on: push",
    "permissions:",
    "  contents: write",
    "jobs:",
    "  one:",
    "    steps:",
    "      - uses: actions/checkout@v4",
    "",
  ].join("\n");
  const problems = checkWorkflow(bad);
  assert.ok(problems.some((p) => p.includes("not pinned")));
  assert.ok(problems.some((p) => p.includes("contents: read")));
  assert.ok(checkWorkflow("name: none\n").some((p) => p.includes("missing top-level permissions")));
});

test("workspace: tools/route-task stays outside the pnpm workspace", () => {
  const listed = JSON.parse(
    execFileSync("pnpm", ["ls", "-r", "--depth", "-1", "--json"], {
      cwd: repoRoot,
      encoding: "utf8",
    }),
  );
  const paths = listed.map((project) => project.path);
  assert.ok(paths.some((path) => path.endsWith("/packages/config")));
  assert.equal(
    paths.some((path) => path.includes("/tools/")),
    false,
  );
});

test("secrets: env files are gitignored and .env.example is not", () => {
  const ignored = (path) => {
    try {
      execFileSync("git", ["check-ignore", "-q", path], { cwd: repoRoot });
      return true;
    } catch {
      return false;
    }
  };
  assert.equal(ignored(".env"), true);
  assert.equal(ignored("apps/web/.env.local"), true);
  assert.equal(ignored(".env.example"), false);
});

test("ci: the workflow policy rejects quoted, inline, and docker forms", () => {
  const wrap = (body) => `permissions:\n  contents: read\njobs:\n  one:\n    steps:\n${body}\n`;
  assert.ok(checkWorkflow(wrap('      - uses: "actions/checkout@v4"')).length > 0);
  assert.ok(checkWorkflow(wrap("      - uses: docker://alpine:3")).length > 0);
  assert.ok(checkWorkflow("permissions: write-all\njobs: {}\n").length > 0);
  assert.ok(checkWorkflow("permissions: { contents: write }\njobs: {}\n").length > 0);
});
