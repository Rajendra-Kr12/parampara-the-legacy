# Parampara: The Legacy

A private family legacy network for web, iOS, and Android. Parampara preserves family relationships across maternal and paternal branches, deceased profiles, memories, stories, photos, and audio, with Telugu and other Indian kinship terms, verified relationships, and privacy by default.

**Status:** documentation and agent setup only; no application code yet. See `docs/scope.md`.

## Index

| File | What it is |
|---|---|
| `AGENTS.md` | Shared rules for every agent and harness (source of truth) |
| `CLAUDE.md` | Imports `AGENTS.md`, adds Claude Code notes |
| `docs/scope.md` | Living plan: status, features, checklists, next work |
| `docs/product-requirements.md` | Product requirements and acceptance criteria |
| `docs/architecture.md` | Stack, layers, media storage, security boundaries, open items |
| `docs/domain-model.md` | People, relationship graph, kinship terms, verification |
| `docs/privacy-and-governance.md` | Access control, consent, evidence, disputes, retention |
| `docs/coding-standards.md` | Coding standards and verification |
| `docs/agent-workflow.md` | Firstmate, herdr, delegation, branch and PR flow |
| `docs/model-routing.md` | Which model and harness handle which task; Laya router |
| `docs/harness-setup.md` | Firstmate dispatch profiles per tier, free-model access, herdr setup |
| `docs/model-catalog.md` | Model IDs, prices, free models, and data-handling classes |
| `docs/decision-log.md` | Accepted and superseded decisions (D-001 onwards) |
| `docs/repository-structure.md` | Current and planned folder layout |
| `docs/original-brief.md` | The owner's original idea notes (historical) |
| `.agents/skills/` | Reusable agent workflows (also visible to Claude Code via `.claude/skills`) |

## Skills

| Skill | Use when |
|---|---|
| `plan-feature` | Before building or changing anything |
| `route-task` | Choosing model, harness, and reviewer |
| `relationship-domain-review` | Changes to people, relationships, kinship, approvals |
| `privacy-security-review` | Changes to personal data, auth, media, secrets |
| `platform-parity-check` | Changes visible on web, iOS, or Android |
| `adversarial-release-review` | Before shipping a feature |
| `update-scope` | After decisions, progress, or verification |

## Stack

Turborepo + pnpm, Next.js (web), Expo (iOS and Android), Convex (backend and database), Clerk (auth), Cloudflare R2 (media), Greptile and Codex (review). Details and rationale in `docs/architecture.md`.

## Contributing

`main` is protected. Create a branch (`feat/`, `fix/`, `docs/`, `chore/`), open a pull request, and resolve all review conversations before merging. Never commit secrets or real family data. Copy `.env.example` to `.env.local` for local keys.

## Origins

The documentation workflow (short root instructions, living scope, skills, approval gate) was adapted from `adrianhajdin/llm-arena`. Its product-specific stack was not copied; see D-021 in `docs/decision-log.md`.
