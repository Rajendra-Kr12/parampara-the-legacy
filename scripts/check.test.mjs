// Tests for the shared check runner (scripts/check.mjs). Run by `pnpm test`.
import assert from "node:assert/strict";
import { test } from "node:test";
import { runChecks } from "./check.mjs";

// runChecks writes its report with console.log; capture it without running any real stage.
function report(stages, options) {
  const lines = [];
  const original = console.log;
  console.log = (line) => lines.push(line);
  try {
    return { code: runChecks(stages, options), lines };
  } finally {
    console.log = original;
  }
}

function stage(name, result) {
  return { name, run: () => result };
}

test("runs every stage in order and exits 0 when all pass", () => {
  const order = [];
  const stages = [
    { name: "1 a", run: () => (order.push("a"), true) },
    { name: "2 b", run: () => (order.push("b"), true) },
  ];
  const { code, lines } = report(stages, {});
  assert.deepEqual(order, ["a", "b"]);
  assert.equal(code, 0);
  assert.ok(lines.includes("PASS 1 a"));
  assert.ok(lines.includes("PASS 2 b"));
});

test("keeps running after a failure and exits non-zero", () => {
  const order = [];
  const stages = [
    { name: "1 a", run: () => (order.push("a"), false) },
    { name: "2 b", run: () => (order.push("b"), true) },
  ];
  const { code, lines } = report(stages, {});
  assert.deepEqual(order, ["a", "b"]);
  assert.equal(code, 1);
  assert.ok(lines.includes("FAIL 1 a"));
  assert.ok(lines.includes("PASS 2 b"));
});

test("a NOT RUN line is reported but only fails under --strict", () => {
  const notRun = ["NOT RUN: device smoke, this is not a pass"];
  const stages = [stage("1 a", true)];
  const relaxed = report(stages, { notRun });
  assert.equal(relaxed.code, 0);
  assert.ok(relaxed.lines.includes(notRun[0]));
  assert.equal(report(stages, { strict: true, notRun }).code, 1);
});
