# Coding Standards

## Status

These are proposed standards. A rule must not be described as machine-enforced until a corresponding tool/configuration exists and a probe or test demonstrates that it works. First inspect the actual repository and adapt these rules to its framework.

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

Choose and enforce one formatter, linter, strict typecheck, and naming convention after inspecting the current toolchain. Do not introduce conflicting tools that check the same concern. Use consistent kebab-case filenames where supported; use framework-required naming where the framework demands it.

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

Maintain a table in the actual repository documenting:
- rule
- enforcing tool/configuration
- probe or test proving it fires
- status: enforced, review-only, or not yet implemented

Review-only rules must not be presented as automated guarantees.
