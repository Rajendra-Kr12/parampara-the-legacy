# Agent Workflow: Firstmate, Herdr, and Multi-Harness Development

## Purpose

Coordinate specialized agents across Claude Code, Codex, OpenCode, Pi, Hermes, Antigravity, and OpenRouter-backed sessions while keeping product decisions, architecture, and security constraints stable. The repository documents are the source of truth; model and harness choice are execution details (see `docs/model-routing.md`).

## Tools

- **Firstmate** (`kunchenguid/firstmate`): one liaison agent that dispatches a crew of coding agents. Reads `AGENTS.md` and `.agents/skills/`. Use dispatch profiles to map routing tiers to harnesses.
- **Herdr** (`ogulcancelik/herdr`, AGPL-3.0): terminal agent multiplexer; a supported Firstmate session backend. Verify the official repository before installing; several mirrors exist.
- **OpenCode** with the owner's OpenCode Zen key: access to many paid models and a rotating list of free ones (see `docs/model-catalog.md`). Good for volume work at T0 and T1.
- **Pi**: minimal terminal harness; reads `AGENTS.md` and `.agents/skills`; documented as a Firstmate harness.
- **Hermes Agent** (Nous Research): reads `AGENTS.md`; project skills in `.agents/skills` load only after `hermes skills trust`. Not in Firstmate's documented harness list, so run it in a herdr pane or dispatch it by hand until verified.
- **Codex plugin for Claude Code**: `/codex:adversarial-review` (user-triggered only) and `/codex:review`.
- **Greptile**: automated PR review on GitHub (free Starter plan: 1 developer, 50 credits per month). Reviews once when a PR opens; comment `@greptileai` on a PR to request a re-review. Review rules live in `.greptile/`; update them when `AGENTS.md` or the domain rules change.

## Plan-before-build gate

For every feature, the lead agent must:
1. Read the relevant docs and inspect the actual code.
2. State goal, scope, affected files/modules, platforms (web, iOS, Android), dependencies, risks, and verification.
3. Classify the task tier (`docs/model-routing.md`).
4. Identify material product forks. Ask one focused question at a time when needed.
5. Stop and wait for explicit approval before implementation.
6. After approval, create the feature branch, break the task into a checklist, and update `docs/scope.md`.

Agents may run in auto/autonomous mode only for non-critical, T0/T1 parts of an approved plan.

## Delegation

Delegate only after shared interfaces and ownership boundaries are clear. Good parallel work: independent research, test-case design, documentation review, and web vs mobile client work against a stable Convex API. Never have multiple agents edit the same Convex schema, migration, or shared package contract concurrently. Each parallel agent works in its own git worktree and branch.

Logical roles (responsibilities, not always-on agents):
- Planner/architect: plans and tracks dependencies.
- Domain/kinship specialist: relationship graph and terminology.
- Web client specialist and mobile client specialist: UX, accessibility, platform parity.
- Security/privacy reviewer: authorization, consent, evidence, retention.
- Adversarial reviewer: attacks assumptions; must be a different model family than the implementer.
- Integration/release coordinator: merges, runs checks, records results.

## Branch and PR flow

1. `git switch main && git pull`, then `git switch -c feat/<slug>`.
2. Implement in small commits. No agent co-author trailers.
3. Run repository checks; push the branch; open a PR using the template.
4. Greptile reviews automatically. For shipments, the user runs `/codex:adversarial-review --base main`.
5. Resolve all review conversations, update `docs/scope.md`, then merge (squash). `main` rejects direct pushes.

## Safety controls

- Keep credentials out of prompts, logs, and docs.
- Do not send real family records to external models unless explicitly authorized.
- Do not allow a model to directly mutate verified family facts.
- Flag destructive actions outside the project folder and require approval.

## Required feature handoff

Each completed task reports:
- summary of change and platforms affected
- files/areas affected
- decisions made or changed
- commands actually run and outcomes
- manual checks performed (per platform)
- unresolved issues and risks
- documentation updated
- whether the scope is ready for the next approved task

## Adversarial review

Run an adversarial review for every feature shipment (skill `adversarial-release-review`). Critical security, privacy, relationship-integrity, and migration findings block shipment. Record finding, severity, reproduction, resolution, and retest result. Do not claim a review happened unless it was actually executed.
