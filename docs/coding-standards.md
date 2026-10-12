# Coding Standards

## Status

These are proposed standards. A rule must not be described as machine-enforced until a corresponding tool/configuration exists and a probe or test demonstrates that it works. First inspect the actual repository and adapt these rules to its framework. The workspace tooling (pnpm, Turborepo, TypeScript 6.0.3, ESLint 9.39, Prettier 3.9, Vitest, CI) exists as of the `chore/monorepo-tooling` change; the ledger at the end says which rules it enforces.

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
| `tools/route-task` stays outside the pnpm workspace | `!tools/**` in `pnpm-workspace.yaml`, noted in the `ci.yml` header | workspace membership assertion (`pnpm ls`) in `enforcement.test.mjs` | enforced (route-task has no CI of its own yet) |
| Secrets and `.env*` files are not committed | `.gitignore` | `git check-ignore` assertions for `.env` and `apps/web/.env.local`, and none for `.env.example` | enforced (ignore rules only; no secret scanning) |
| CI checks are required to merge | GitHub `protect-main` ruleset | none | not yet implemented (ruleset has no required status checks; plan step 5, owner approval needed) |
| Actions must be pinned repository-wide (`sha_pinning_required`) | GitHub Actions settings | none | not yet implemented (settings change, owner approval needed) |
| Layering: UI depends on services, services on domain | code review, Greptile | none | review-only (only the domain-purity subset above is automated) |
| Kebab-case filenames | none | none | not yet implemented |
| Authorization, privacy, and relationship-integrity rules | Greptile rules, skills `privacy-security-review` and `relationship-domain-review`, Codex adversarial review | none | review-only |
| No em dashes in written output | none | none | review-only |
