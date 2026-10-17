// Shared, portable check runner: one command that is the executable definition of done
// for a feature step (docs/checks.md). It runs a set of stages in order, prints one plain
// result per stage (PASS, FAIL, or "NOT RUN: <reason>, this is not a pass"), and exits
// non-zero when any stage failed. `--strict` also fails on NOT RUN.
//
// Run the repository default stage set:
//   pnpm run check [--strict]
// Per-step wrappers (such as apps/mobile/scripts/check.mjs) import this module and call
// runChecks() with their own stage set, so the runner never runs a step's stages on import.
// Node standard library only: it must run unchanged on a developer Mac and in CI.
import { spawnSync } from "node:child_process";
import { lstatSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const repoRoot = fileURLToPath(new URL("..", import.meta.url));

const env = { ...process.env, CI: "1", EXPO_NO_TELEMETRY: "1", EXPO_NO_DOTENV: "1" };

// Re-use the pnpm that started this script (it may not be on PATH, for example when
// run through `npx -y pnpm@12.11.2`).
const execPath = process.env.npm_execpath ?? "";
const pnpm = /\.[cm]?js$/.test(execPath)
  ? [process.execPath, execPath]
  : [execPath === "" ? "pnpm" : execPath];

/** Runs a pnpm command and returns true when it exited 0. */
export function runPnpm(args, { cwd = repoRoot, env: extraEnv = {} } = {}) {
  const [command = "pnpm", ...rest] = [...pnpm, ...args];
  const result = spawnSync(command, rest, { cwd, env: { ...env, ...extraEnv }, stdio: "inherit" });
  return result.status === 0;
}

// Same Prettier configuration and ignore files as `pnpm run format`, limited to the
// files git tracks or would track, so a local harness file excluded through
// .git/info/exclude (never present in CI) cannot fail the gate.
export function formatCheck() {
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
  return runPnpm(["exec", "prettier", "--check", "--ignore-unknown", ...files]);
}

// Stages are `{ name, run }`, where `name` is the plain label printed for that stage and
// `run` returns true on pass. Every stage runs, so a worker sees the whole picture in one
// pass; the exit code is non-zero when any stage failed.
export function runChecks(stages, { strict = false, notRun = [] } = {}) {
  const lines = [];
  for (const { name, run } of stages) {
    console.log(`\n=== gate ${name}`);
    lines.push(`${run() ? "PASS" : "FAIL"} ${name}`);
  }
  for (const reason of notRun) lines.push(reason);

  console.log("\n=== summary");
  for (const line of lines) console.log(line);
  const failed = lines.some((line) => line.startsWith("FAIL"));
  const notRunLine = lines.some((line) => line.startsWith("NOT RUN"));
  return failed || (strict && notRunLine) ? 1 : 0;
}

/** The repository default stage set: the whole-workspace checks a step builds on. */
export function repoStages() {
  return [
    ["1 format (Prettier on files git tracks or would track)", formatCheck],
    ["2 lint", () => runPnpm(["run", "lint"])],
    ["3 typecheck", () => runPnpm(["run", "typecheck"])],
    ["4 tests (whole repo)", () => runPnpm(["run", "test"])],
    [
      "5 build (web and packages, Next.js)",
      // The mobile build is the cross-platform bundle proof, so it runs as the parity
      // stage below instead of twice. turbo is called directly: an extra argument after
      // `pnpm run build --` reaches the build script, not turbo.
      () => runPnpm(["exec", "turbo", "run", "build", "--filter=!@parampara/mobile"]),
    ],
    [
      "6 parity (iOS and Android bundles export, no secret, public URL inlined)",
      () => runPnpm(["run", "check:bundle"], { cwd: join(repoRoot, "apps/mobile") }),
    ],
  ].map(([name, run]) => ({ name, run }));
}

const NOT_RUN = [
  "NOT RUN: web sign-in e2e (Playwright, needs the Clerk and Convex keys), this is not a pass",
  "NOT RUN: device smoke (iOS simulator, Android emulator), runs only in mobile-e2e.yml, this is not a pass",
];

export function main(argv = []) {
  return runChecks(repoStages(), { strict: argv.includes("--strict"), notRun: NOT_RUN });
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.argv.slice(2));
}
