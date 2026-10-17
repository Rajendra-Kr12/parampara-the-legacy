# Checks: the executable definition of done for a feature step

Every feature step gets one portable command that is its definition of done: a worker
loops on it until it is green instead of a human judging the result by eye. The command
runs the step's stages in order, prints one plain result per stage, and fails when
anything failed. This file owns the runner's interface and the `/goal` convention; the
per-step criteria themselves live in `docs/acceptance-criteria.md`.

Source: the worth-adopting list accepted on 2026-10-13 (item 2 of
`data/parampara-video-adoption-2026-10-13.md`), built after the auth-hardening pilot.

## The runner

`scripts/check.mjs` is the shared runner. It is Node standard library only, so it runs
unchanged on a developer Mac and in CI, and it is imported by per-step wrappers, never
run for a step directly. Run it with no argument for the repository default stage set:

```sh
pnpm run check            # format, lint, typecheck, tests, build, parity
pnpm run check -- --strict   # also fail on a NOT RUN stage
```

It prints, for each stage:

```text
=== gate 4 tests (whole repo)
=== summary
PASS 1 format (Prettier on files git tracks or would track)
PASS 2 lint
FAIL 3 typecheck
NOT RUN: device smoke (iOS simulator, Android emulator), runs only in mobile-e2e.yml, this is not a pass
```

- Every stage runs, so one pass shows the whole picture; the runner does not stop at the
  first failure.
- Exit code is non-zero when any stage failed. `--strict` also makes a NOT RUN stage
  fail, so a step cannot be called done while a gate was skipped.
- A NOT RUN line names why a gate could not run; it is never reported as a pass.

Stages are `{ name, run }`, where `name` is the plain label printed for the stage and
`run` returns true on pass. Wrappers build their stage set and call
`runChecks(stages, { strict, notRun })`:

```js
import { formatCheck, runChecks, runPnpm } from "../../../scripts/check.mjs";

const stages = [
  ["1 format (Prettier on files git tracks or would track)", formatCheck],
  ["2 lint", () => runPnpm(["run", "lint"])],
].map(([name, run]) => ({ name, run }));

process.exitCode = runChecks(stages, { strict: process.argv.includes("--strict") });
```

## Per-step commands

| Step | Command |
|---|---|
| Repository default stages | `pnpm run check` |
| Feature 1 Step 4 (mobile) | `pnpm --filter @parampara/mobile run check` |
| CI | the `mobile-check` job in `.github/workflows/ci.yml` runs the Step 4 command |

`apps/mobile/scripts/check.mjs` is a wrapper: it supplies the mobile stage set (format,
lint, typecheck, unit tests with no skipped tests, both bundles with no secret and the
public URL inlined, expo health, whole-repo test and build) and adds the device smoke as
NOT RUN. The device smoke itself needs a simulator or emulator and runs only in the
hand-dispatched `.github/workflows/mobile-e2e.yml`, never in the check.

The repository default set runs format, lint, typecheck, tests, build for web, and
platform parity (the iOS and Android bundle export, which is the cross-platform artifact
in the repository today). Its keyed checks - the web sign-in Playwright proof and the
device smoke - are reported as NOT RUN.

## `/goal` convention

A worker running on Claude Code sets a `/goal` on its step's check with a turn limit (for
example 15), then loops until the check passes; the goal is concrete: the end state, the
check that proves it, what must not change, and the turn limit. Workers on other harnesses
(Codex, OpenCode, Pi, Firstmate crewmates) run the same command without `/goal`. The check
is the portable part and the convention is Claude-only; the command and its exit code are
the same everywhere.

## Adding a step

A new step gets its own wrapper next to its code that imports `scripts/check.mjs`, builds
its stage set with the same PASS/FAIL/NOT RUN shape, and is wired into CI and into the
step's recorded definition of done in `docs/scope.md`. Do not copy the runner; import it.
