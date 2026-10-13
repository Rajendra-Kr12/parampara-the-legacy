# Coding Standards

## Status

These are proposed standards. A rule must not be described as machine-enforced until a corresponding tool/configuration exists and a probe or test demonstrates that it works. First inspect the actual repository and adapt these rules to its framework. The workspace tooling (pnpm, Turborepo, TypeScript 6.0.3, ESLint 9.39, Prettier 3.9, Vitest, CI) exists as of Feature 1 step 1 (`docs/scope.md`, D-032 to D-037); the ledger at the end says which rules it enforces.

## Principles

- Prefer pure domain functions and immutable data.
- Keep side effects at explicit boundaries.
- Use strict types and avoid `any` or equivalent untyped escape hatches.
- Validate external inputs at the boundary.
- Use feature-oriented organization where it fits the chosen architecture.
- Keep UI components focused; extract shared components when a real repeated pattern emerges.
- Keep shared design tokens in one source of truth.
- Never expose raw exceptions or provider errors to end users.
- Read environment configuration through a validated configuration module.
- Use transactions for logically atomic multi-record changes.
- Preserve provenance for sensitive changes.
- Do not add abstractions solely to satisfy a slogan; explain the concrete benefit.

## Layering

The preferred dependency direction is:
- UI/routes depend on application services.
- Application services depend on domain rules and persistence interfaces.
- Domain rules do not depend on UI frameworks or provider SDKs.
- Infrastructure adapters implement persistence, media, notifications, and external services.
- AI integrations are adapters and cannot bypass domain authorization or approval workflows.

Adapt the exact directory names to the actual repository after inspection.

## Naming and formatting

One formatter (Prettier), one linter (ESLint flat config), and one strict typecheck (`tsc`) are enforced; the shared configuration lives in `packages/config`. Do not introduce conflicting tools that check the same concern. Use consistent kebab-case filenames where supported; use framework-required naming where the framework demands it.

## Security and privacy review rules

- Never trust client-supplied permissions, reviewer eligibility, or consent.
- Never include secrets or sensitive family data in logs.
- Never make private storage public for convenience.
- Never let AI directly approve a relationship or historical fact.
- Never delete or rewrite sensitive history without an explicit reviewed workflow.
- Do not run destructive commands outside the approved project directory.

## Verification

After a completed change, run the repository-supported checks: lint, typecheck, tests, formatting check, production build, and relevant end-to-end checks. Do not claim a check was run if it was not. If a test runner is absent, propose a test strategy and get approval before installing new tools.

## Enforcement ledger

Status is `enforced`, `review-only`, or `not yet implemented`. A probe is a test that feeds a deliberately broken fixture to the real configuration and fails if the tool stops rejecting it. Probes live in `packages/config/probes/` and run as part of `pnpm test` (the `@parampara/config` package). Review-only and not-yet-implemented rows have no probe by definition, and must not be presented as automated guarantees.

| Rule | Enforcing tool / configuration | Probe | Status |
|---|---|---|---|
| Strict TypeScript, including implicit `any`, unchecked index access, and exact optional properties | `packages/config/tsconfig.base.json`, run by each package's `typecheck` and `build` scripts | `strict-implicit-any.ts` (TS7006), `strict-unchecked-index.ts` (TS2532/TS18048), `strict-exact-optional.ts` (TS2375) in `enforcement.test.mjs` | enforced |
| No `any`, non-null assertions, or `@ts-ignore` | `strictTypeChecked` typescript-eslint plus explicit rules in `packages/config/eslint.mjs`, `eslint --max-warnings 0` | `lint-escape-hatches.ts` must raise `no-explicit-any`, `no-non-null-assertion`, `ban-ts-comment` | enforced |
| Domain packages stay pure TypeScript (no `react`, `react-native`, `next`, `expo*`, `convex*`, `@clerk/*`, `@parampara/backend`) | `domainPurity` `no-restricted-imports` block in `packages/domain` and `packages/kinship-engine` ESLint configs | `domain-impure-imports.ts` must raise three `no-restricted-imports` errors | enforced (`packages/validation` is not covered) |
| One formatter | Prettier 3.9 via `pnpm format`, scope set by `.prettierignore` | `unformatted.ts` must fail the check, and the root `package.json` must point at the shared config | enforced for workspace tooling and packages only; `docs/`, `tools/`, `.agents/`, and root markdown are excluded |
| Tests run for every package | Vitest through `pnpm test` (Turborepo) | each package's own trivial test | enforced (no coverage threshold) |
| Production sources compile | `tsc -p tsconfig.build.json` in each package's `build` script (no emit; internal packages ship TypeScript source) | covered by the strict typecheck probes above | enforced (compile check only, not a bundle) |
| CI actions pinned by commit SHA, read-only permissions | `.github/workflows/ci.yml`, checked by `probes/workflow-policy.mjs` | the real workflow must pass, and a bad sample (unpinned action, `contents: write`) must fail | enforced for files in `.github/workflows/` that the test reads (`ci.yml` only) |
| `tools/route-task` stays outside the pnpm workspace | `!tools/**` in `pnpm-workspace.yaml`, noted in the `ci.yml` header | workspace membership assertion (`pnpm ls`) in `enforcement.test.mjs` | enforced (route-task has its own `route-task` CI job instead; see the Laya row below) |
| Secrets and `.env*` files are not committed | `scripts/check-secrets.mjs` (`pnpm run check:secrets`) over every tracked file, run by the `secrets` CI job; `.gitignore` is a second layer. Opt-in local pre-commit hook: `pnpm run hooks:install` (sets `core.hooksPath` to `.githooks`), which scans staged files with the same script. It is a best-effort tripwire, not a complete scanner. It reads each file from the git index, with no size limit, and a tracked file it cannot read is a finding. It flags (1) any file whose name starts with `.env` (other than `.env.example`) or ends with `.env`, case-insensitively; (2) private key blocks and Clerk/Stripe `sk_`, AWS `AKIA`, GitHub, and Slack token formats; (3) `secret`/`token`/`password`/`api_key` names assigned a literal value: every quoted value on a line (single, double, or backtick quotes; 12 to 200 characters; spaces allowed only when the value is plain words), and an unquoted value only at the start of a line (`.env` and YAML style). Matching is per line. It does not cover: values shorter than 12 characters, placeholders and low-variety values, values containing `(` or `{` (code and interpolation), a quoted value split across lines, encoded or obfuscated secrets, secret formats it has no rule for, files with a known binary extension (images, fonts, archives, media; every other file is scanned as text with NUL bytes removed), or secrets already in git history. The backstop is GitHub secret scanning and push protection, enabled on the repository. Suppress a reviewed false positive with `secrets-gate:allow` on the line | `scripts/check-secrets.test.mjs` (run by `pnpm test`): each rule against a fake secret built at runtime, plus an end-to-end run in a temp git repo that must fail on a staged `.env.local` and a staged fake key and pass on a clean tree. `git check-ignore` assertions for `.env` and `apps/web/.env.local` remain in `enforcement.test.mjs` | enforced (pattern-based: obvious secrets only, so a novel secret format can still slip through; secrets already in git history are not rewritten) |
| Secrets and personal data never reach the Laya router | `containsProhibitedData` in `tools/route-task/src/router.ts` refuses the task before the key is loaded or Laya is called; `route-task` CI job runs `npm --prefix tools/route-task test` | `router.test.ts`: refusal cases, and "a refused task never reaches the key loader or the Laya client" (spy client and key loader are never called) | enforced for secret-looking text, email addresses, and phone numbers only. It cannot detect other real family data (names, addresses, stories), and a task that merely names `.env` is routed as sensitive context to class A models, not refused |
| CI checks are required to merge | GitHub `protect-main` ruleset | none | not yet implemented (ruleset has no required status checks; plan step 5, owner approval needed) |
| Fallow code-health report never blocks a PR | `fallow` job in `.github/workflows/ci.yml` (`continue-on-error`, `|| true` on each analysis step, not a required check, no write permissions); D-039, D-040 | none | review-only (no probe checks the job's settings) |
| Actions must be pinned repository-wide (`sha_pinning_required`) | GitHub Actions settings | none | not yet implemented (settings change, owner approval needed) |
| Layering: UI depends on services, services on domain | code review, Greptile | none | review-only (only the domain-purity subset above is automated) |
| Kebab-case filenames | none | none | not yet implemented |
| Authorization, privacy, and relationship-integrity rules | Greptile rules, skills `privacy-security-review` and `relationship-domain-review`, Codex adversarial review | none | review-only |
| No em dashes in written output | none | none | review-only |
