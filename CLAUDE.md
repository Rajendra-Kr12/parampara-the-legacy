# Parampara: Claude Code instructions

Read `AGENTS.md` and `docs/scope.md` before taking project action. Read the relevant domain, architecture, privacy, and coding documents before working in those areas.

## Required workflow

1. For every feature or material change, state the goal, why it matters, affected areas, risks, and verification plan in a short plan.
2. Do not write or modify application code until the user explicitly approves that plan. Stop and wait.
3. Ask one concise question at a time only when a material decision genuinely has multiple reasonable outcomes. Otherwise make a reversible, documented recommendation.
4. Keep `docs/scope.md` current. Record decisions, progress, verification evidence, corrections, blockers, and what remains unverified.
5. After implementation, run the checks actually supported by the repository: tests, typecheck, lint, formatting check, production build, and relevant manual end-to-end checks. Never claim a check passed unless it was run.
6. Report next actions as concise, concrete bullets. Keep detailed reasoning and durable project history in the docs.

## Project-specific priorities

Relationship integrity, privacy, consent, historical provenance, and safe migrations outrank implementation speed. AI must not silently establish or rewrite a family relationship or verified historical fact. Read `docs/domain-model.md` and `docs/privacy-and-governance.md` before changing related behavior.

## Context files

- `docs/scope.md`: living plan and status.
- `docs/product-requirements.md`: product requirements.
- `docs/architecture.md`: technical direction and open decisions.
- `docs/domain-model.md`: domain rules and relationship semantics.
- `docs/privacy-and-governance.md`: privacy, evidence, dispute, retention, and deletion policy.
- `docs/coding-standards.md`: coding standards and verification.
- `docs/agent-workflow.md`: agent orchestration and release process.
- `docs/decision-log.md`: accepted decisions and amendments.
