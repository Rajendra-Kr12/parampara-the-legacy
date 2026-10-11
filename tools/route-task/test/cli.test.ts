import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { runCli } from "../src/run.js";

function capture() {
  const out: string[] = [];
  const err: string[] = [];
  return { out, err, io: { stdout: (t: string) => void out.push(t), stderr: (t: string) => void err.push(t) } };
}

test("built cli binary runs directly and prints usage with exit 2 when no task is given", () => {
  const bin = fileURLToPath(new URL("../src/cli.js", import.meta.url));
  const result = spawnSync(process.execPath, [bin], { encoding: "utf8" });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Usage/);
  assert.equal(result.stdout, "");
});

test("setup errors print a safe message with no raw path and exit 1", async () => {
  const { err, out, io } = capture();
  const code = await runCli(["--task", "Fix a typo."], {
    ...io,
    route: async () => { throw Object.assign(new Error("ENOENT: /Users/someone/docs/model-catalog.md"), { code: "ENOENT" }); },
  });
  assert.equal(code, 1);
  assert.deepEqual(out, []);
  assert.equal(err.join(""), "Unable to route task. Check the model catalog and gateway configuration.\n");
  assert.ok(!err.join("").includes("/Users"));
});

test("missing task prints usage and exits 2", async () => {
  const { err, io } = capture();
  assert.equal(await runCli([], io), 2);
  assert.match(err.join(""), /Usage/);
});
