# Parampara: shared agent rules

Single source of truth for every coding agent, harness, and model working in this repository (Claude Code, Codex, OpenCode, Pi, Hermes, Antigravity, Firstmate crewmates, OpenRouter sessions). Harness-specific files such as `CLAUDE.md` may add notes but must not contradict this file. If instructions conflict, stop, describe the conflict, and ask the user.

Keep this file short. Detail lives in `docs/` and `.agents/skills/`; read those only when the task needs them.

## Project in one paragraph

Parampara: The Legacy is a private family legacy network for web, iOS, and Android, built simultaneously. It preserves family relationships (maternal and paternal), deceased profiles, memories, stories, photos, and audio, with Indian (Telugu first) kinship terms. Stack: Turborepo monorepo with Next.js (web), Expo (iOS/Android), Convex (database and backend), Clerk (auth), Cloudflare R2 (media). See `docs/architecture.md`.

## Read before acting

| When you are... | Read |
|---|---|
| Starting any session | `docs/scope.md` (status and next work) |
| Planning a feature | `docs/product-requirements.md`, skill `plan-feature` |
| Writing or checking behavior (done criteria, tests) | `docs/acceptance-criteria.md` |
| Choosing, running, or debugging a harness | `docs/harness-setup.md` |
| Touching people, relationships, kinship, approvals | `docs/domain-model.md`, skill `relationship-domain-review` |
| Touching personal data, media, auth, consent | `docs/privacy-and-governance.md`, skill `privacy-security-review` |
| Choosing a model or harness for a task | `docs/model-routing.md`, skill `route-task` |
| Changing UI or client behavior | skill `platform-parity-check` |
| Writing code | `docs/coding-standards.md`, `docs/architecture.md` |
| Shipping a feature | skill `adversarial-release-review`, then skill `update-scope` |

Skills live in `.agents/skills/<name>/SKILL.md`. If your harness does not load skills automatically, open the file and follow it.

This file stays short on purpose (owner choice): add a rule only after an observed agent mistake, and put detail in `docs/` or skills.

## Workflow

1. Inspect the actual repository before proposing changes. Do not assume a proposed file, dependency, command, or tool exists.
2. For any feature or material change: state goal, affected areas, risks, and verification in a short plan. Stop and wait for explicit user approval before writing application code.
3. Ask one focused question at a time, only for material product forks. Otherwise make a reversible, documented recommendation.
4. Implement the smallest useful vertical slice that works on web, iOS, and Android together.
5. Verify (see below), update `docs/scope.md`, record durable decisions in `docs/decision-log.md`.

## Git and pull requests

- `main` is protected: no direct pushes, no force pushes. All changes land through pull requests.
- Branch from up-to-date `main`: `feat/<slug>`, `fix/<slug>`, `docs/<slug>`, `chore/<slug>`.
- One feature or fix per branch and PR. Keep PRs reviewable.
- PR description: what changed, why, risks, checks actually run, manual checks, docs updated (template in `.github/pull_request_template.md`).
- Resolve every review conversation (Greptile, Codex, human) before merging.
- Do not add AI agents as commit co-authors; the human owner stays accountable.
- Never commit real family data; use synthetic fixtures. Secrets and `.env` files are blocked by `pnpm run check:secrets` (CI `secrets` job; opt-in local hook in `docs/coding-standards.md`).

## Product and domain invariants

- One person has one canonical identity, even when connected through multiple branches.
- Preserve all valid maternal and paternal relationship paths, including overlaps from marriages between relatives.
- Kinship labels are derived display choices; changing a label never changes the graph. Paternal-side label is the default when several apply.
- Account, relationship, historical-claim, and content verification are separate states. Never a single `verified` boolean.
- A proposer never approves their own change.
- Missing or disputed facts are never converted into certainty.
- AI may suggest; only humans and deterministic domain rules change family data.
- Contact details, exact addresses, evidence, and media are protected by server-side authorization (Convex functions), never only by client rendering.
- Never weaken approval rules or privacy controls to make a demo or test pass.

## Engineering rules

- Apply SOLID and separation of concerns where they add clarity; explain the rationale to the user when introducing an abstraction.
- Domain logic (`packages/domain`, `packages/kinship-engine`) is pure TypeScript with no UI, Convex, or provider imports.
- Strict TypeScript; no `any` or untyped escape hatches. Validate inputs at every trust boundary.
- Multi-record changes that must stay consistent run in one Convex mutation.
- Do not add dependencies, frameworks, paid services, or test tools without explaining why and getting approval.
- Never expose raw provider errors, credentials, or internal paths to users.
- Do not run destructive commands, or delete anything, outside this project folder. Flag and ask first.

## Verification and reporting

- Run the checks the repository actually supports: lint, typecheck, tests, format check, build. Never claim a check ran or passed if it did not.
- Test failure paths, especially authorization denials and invalid relationship paths.
- Distinguish automated checks, manual checks, and checks not run.
- A feature is not done because the UI renders. Critical security, privacy, data-integrity, or migration findings block release.
- Flag pre-existing lint/test failures or flaky tests you encounter; do not walk past them.

## Model and task routing

Route each task by complexity and risk using the table in `docs/model-routing.md`; model IDs, prices, and data classes are in `docs/model-catalog.md`. High-risk areas (relationship graph, approvals, auth, privacy, migrations) always get a strong reasoning model plus an independent reviewer from a different model family, and never a free model. Free models may only see public repository content, and only in the data classes the catalog allows. Never send real family data or secrets to any external model, including the Laya router. The router refuses secret-looking text, emails, and phone numbers before any Laya call (tested in CI); it cannot detect other family data, so that stays your responsibility.

Do not create `AGENTS.override.md`, `.hermes.md`, or other files that shadow this one in some harnesses.
