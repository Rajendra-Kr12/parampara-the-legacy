// One command a worker loops on for the mobile app (docs/scope.md, Feature 1 Step 4a):
//   pnpm --filter @parampara/mobile run check [--strict]
// Runs every gate in order and prints one line per gate: PASS, FAIL, or
// "NOT RUN: <reason>, this is not a pass". Exits 0 only when every runnable gate
// passed; --strict also fails on NOT RUN. Needs no keys and no devices.
import { spawnSync } from "node:child_process";
import { lstatSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = fileURLToPath(new URL("..", import.meta.url));
const repoRoot = fileURLToPath(new URL("../../..", import.meta.url));
const strict = process.argv.includes("--strict");
const env = { ...process.env, CI: "1", EXPO_NO_TELEMETRY: "1", EXPO_NO_DOTENV: "1" };

// Re-use the pnpm that started this script (it may not be on PATH, for example when
// run through `npx -y pnpm@12.11.2`).
const execPath = process.env.npm_execpath ?? "";
const pnpm = /\.[cm]?js$/.test(execPath)
  ? [process.execPath, execPath]
  : [execPath === "" ? "pnpm" : execPath];

function run(args, cwd = repoRoot, extraEnv = {}) {
  const [command = "pnpm", ...rest] = [...pnpm, ...args];
  const result = spawnSync(command, rest, { cwd, env: { ...env, ...extraEnv }, stdio: "inherit" });
  return result.status === 0;
}

// Same Prettier configuration and ignore files as `pnpm run format`, limited to the
// files git tracks or would track, so a local harness file excluded through
// .git/info/exclude (never present in CI) cannot fail the gate.
function formatCheck() {
  const listed = spawnSync(
    "git",
    ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
    {
      cwd: repoRoot,
      encoding: "utf8",
    },
  );
  if (listed.status !== 0) return false;
  const files = listed.stdout.split("\0").filter((file) => {
    if (file === "") return false;
    try {
      // Prettier skips symlinks (such as .claude/skills) when it walks a folder,
      // but rejects one passed by name; deleted files are skipped too.
      return lstatSync(join(repoRoot, file)).isFile();
    } catch {
      return false;
    }
  });
  return run(["exec", "prettier", "--check", "--ignore-unknown", ...files]);
}

function unitTests() {
  const dir = mkdtempSync(join(tmpdir(), "parampara-mobile-jest-"));
  try {
    const outputFile = join(dir, "jest.json");
    if (!run(["exec", "jest", "--ci", "--json", `--outputFile=${outputFile}`], appDir)) {
      return false;
    }
    const summary = JSON.parse(readFileSync(outputFile, "utf8"));
    return (
      summary.numTotalTests > 0 &&
      summary.numFailedTests === 0 &&
      summary.numPendingTests === 0 &&
      summary.numTodoTests === 0
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const gates = [
  ["1 format (Prettier on files git tracks or would track)", formatCheck],
  ["2 lint", () => run(["run", "lint"])],
  ["3 typecheck", () => run(["run", "typecheck"])],
  ["4 unit tests (no failed or skipped tests)", unitTests],
  ["5-6 both bundles, no secret, public inlined", () => run(["run", "check:bundle"], appDir)],
  [
    "7 expo health (expo install --check against the SDK, expo config)",
    () =>
      // Offline: compare against the installed SDK's bundled version map, not the newest
      // patches online, which may be younger than minimumReleaseAge allows.
      run(["exec", "expo", "install", "--check"], appDir, { EXPO_OFFLINE: "1" }) &&
      run(["exec", "expo", "config", "--type", "public", "--json"], appDir),
  ],
  ["8 whole repo (test, build)", () => run(["run", "test"]) && run(["run", "build"])],
];

const lines = [];
for (const [name, gate] of gates) {
  console.log(`\n=== gate ${name}`);
  const status = gate() ? "PASS" : "FAIL";
  lines.push(`${status} ${name}`);
}
// Device proofs never run here: they need a simulator or emulator (CI workflow
// .github/workflows/mobile-e2e.yml, dispatched by hand).
lines.push(
  "NOT RUN: device smoke (iOS simulator, Android emulator), runs only in mobile-e2e.yml, this is not a pass",
);

console.log("\n=== summary");
for (const line of lines) console.log(line);
const failed = lines.some((line) => line.startsWith("FAIL"));
const notRun = lines.some((line) => line.startsWith("NOT RUN"));
process.exitCode = failed || (strict && notRun) ? 1 : 0;
