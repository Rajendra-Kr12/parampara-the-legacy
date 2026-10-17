// One command a worker loops on for the mobile app (docs/scope.md, Feature 1 Step 4a):
//   pnpm --filter @parampara/mobile run check [--strict]
// A thin wrapper over the shared runner (scripts/check.mjs, docs/checks.md) that supplies
// the mobile stage set. The runner prints one line per stage: PASS, FAIL, or
// "NOT RUN: <reason>, this is not a pass", and exits 0 only when every runnable stage
// passed; --strict also fails on NOT RUN. Needs no keys and no devices.
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { formatCheck, runChecks, runPnpm } from "../../../scripts/check.mjs";

const appDir = fileURLToPath(new URL("..", import.meta.url));
const strict = process.argv.includes("--strict");

function unitTests() {
  const dir = mkdtempSync(join(tmpdir(), "parampara-mobile-jest-"));
  try {
    const outputFile = join(dir, "jest.json");
    if (
      !runPnpm(["exec", "jest", "--ci", "--json", `--outputFile=${outputFile}`], { cwd: appDir })
    ) {
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

const stages = [
  ["1 format (Prettier on files git tracks or would track)", formatCheck],
  ["2 lint", () => runPnpm(["run", "lint"])],
  ["3 typecheck", () => runPnpm(["run", "typecheck"])],
  ["4 unit tests (no failed or skipped tests)", unitTests],
  [
    "5-6 both bundles, no secret, public inlined",
    () => runPnpm(["run", "check:bundle"], { cwd: appDir }),
  ],
  [
    "7 expo health (expo install --check against the SDK, expo config)",
    () =>
      // Offline: compare against the installed SDK's bundled version map, not the newest
      // patches online, which may be younger than minimumReleaseAge allows.
      runPnpm(["exec", "expo", "install", "--check"], {
        cwd: appDir,
        env: { EXPO_OFFLINE: "1" },
      }) && runPnpm(["exec", "expo", "config", "--type", "public", "--json"], { cwd: appDir }),
  ],
  ["8 whole repo (test, build)", () => runPnpm(["run", "test"]) && runPnpm(["run", "build"])],
].map(([name, run]) => ({ name, run }));

process.exitCode = runChecks(stages, {
  strict,
  // Device proofs never run here: they need a simulator or emulator (CI workflow
  // .github/workflows/mobile-e2e.yml, dispatched by hand).
  notRun: [
    "NOT RUN: device smoke (iOS simulator, Android emulator), runs only in mobile-e2e.yml, this is not a pass",
  ],
});
