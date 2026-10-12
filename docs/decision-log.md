# Decision Log: Parampara

Record durable product and architecture decisions here. Add date, status, context, options, decision, rationale, consequences, and follow-up. When a decision changes, mark the old entry superseded instead of erasing history.

## D-001: Preserve multiple valid relationship paths
- Status: Accepted
- Decision: Preserve all valid maternal and paternal paths, including overlapping paths created by marriages between relatives.
- Consequence: Use canonical people plus separate relationship edges; do not model only one relation-to-viewer field.

## D-002: Kinship label is a display preference
- Status: Accepted
- Decision: Default to the paternal-side label when multiple valid labels apply, then let the viewer select another valid label. Support language, region, and family custom.
- Consequence: Relationship graph and displayed kinship terminology must be separate.

## D-003: Separate verification dimensions
- Status: Accepted
- Decision: Account, relationship, historical claim, content publication, and overall profile states are distinct.
- Consequence: Do not use one generic verified boolean.

## D-004: Deceased profile approval
- Status: Superseded by D-016 (2026-10-10)
- Decision: Three eligible close relatives approve initial deceased profiles where available.
- Open: If three eligible relatives cannot be found, profile remains pending unless an explicitly documented administrator exception is approved.

## D-005: Evidence hierarchy
- Status: Accepted
- Decision: Documents/certificates first; multiple independent testimonies if documentary evidence is unavailable; otherwise retain uncertain/disputed status.
- Consequence: Evidence is attached to individual claims and restricted to authorized reviewers.

## D-006: Story dispute deadline
- Status: Accepted; timer details need implementation decision
- Decision: A story dispute has a 60-day resolution window. If unresolved, move the story to the contributor's private drafts.
- Open: Define timer start, notifications, extension authority, and exceptions.

## D-007: Privacy defaults
- Status: Accepted
- Decision: Phone/email and exact addresses are private by default. City discovery is opt-in. Children are guardian-managed.
- Consequence: Backend authorization and consent checks are required for all access paths.

## D-008: Contributor ownership with family preservation
- Status: Accepted subject to policy/legal limits
- Decision: Contributor authorship/control coexists with restricted family archival preservation.
- Consequence: Define retention, access, deletion, account closure, and backup expiration; no unconditional permanent retention.

## D-009: Cross-platform MVP
- Status: Accepted
- Decision: Web, Android, and iOS are all in initial scope.
- Consequence: Share domain rules and backend authorization; select monorepo strategy after repository inspection.

## D-010: AI is assistive, not authoritative
- Status: Accepted
- Decision: AI may assist with terminology, transcription, translation, and duplicate suggestions, but may not silently approve or change verified facts.
- Consequence: Human approval and deterministic domain rules remain authoritative.

## D-011: Documentation-driven agent workflow
- Status: Accepted
- Decision: Plan first, wait for explicit approval, implement a small slice, verify, update scope, and record decisions.
- Consequence: `docs/scope.md` is a living plan, not a static spec.

## D-012: AGENTS.md is the single instruction source (2026-10-10)
- Status: Accepted
- Context: The project is worked on by Claude Code, Codex, OpenCode, Antigravity, and Firstmate. Claude Code reads `CLAUDE.md` and only falls back to `AGENTS.md` when no `CLAUDE.md` exists; the other harnesses read `AGENTS.md`.
- Decision: Keep all shared rules in a short `AGENTS.md`. `CLAUDE.md` imports it with `@AGENTS.md` and adds only Claude-specific notes. Detail lives in `docs/` and skills.
- Consequence: Imports load at launch, so context is saved by keeping `AGENTS.md` short, not by the import itself.

## D-013: Skills location (2026-10-10)
- Status: Accepted
- Decision: Canonical skills live in `.agents/skills/`. `.claude/skills` is a symlink to it, because Claude Code does not read `.agents/`.
- Consequence: Edit skills only in `.agents/skills/`. On Windows, enable symlinks (Developer Mode) or copy on checkout.

## D-014: Application stack (2026-10-10)
- Status: Accepted (versions confirmed at scaffold time)
- Decision: Turborepo + pnpm monorepo; Next.js web; Expo (React Native) for iOS and Android; Convex for database and backend; Clerk for auth.
- Options considered: single Expo app for all platforms; Supabase or Neon Postgres with Drizzle or Prisma; Firebase.
- Rationale: Simultaneous web and native development with shared TypeScript domain code; Convex gives transactional mutations, realtime sync, and a generated typed API without an ORM; Clerk free tier covers 50,000 monthly retained users and supports both Next.js and Expo.
- Risks: Convex vendor dependence (mitigated by open-source self-hosting); multi-hop graph queries are written in code rather than SQL.

## D-015: Media storage (2026-10-10)
- Status: Accepted
- Decision: Photos and audio go to Cloudflare R2 behind a storage adapter, accessed through short-lived presigned URLs issued after Convex authorization checks. Databases hold metadata only.
- Rationale: A family may reach ~15 GB of media. R2 costs ~$0.015/GB-month with no egress fees, versus higher storage and egress costs on Convex, Supabase, or S3.
- Follow-up: Backblaze B2 as backup target once real data exists.

## D-016: Deceased profile approval threshold (2026-10-10)
- Status: Accepted. Supersedes D-004.
- Decision: Initial approval needs three eligible close relatives. If fewer than three eligible relatives are available, two eligible close-relative approvals plus documentary evidence (for example a death or birth certificate) reviewed by those approvers is sufficient. With fewer than two eligible approvers, the profile stays pending.
- Constraints: The proposer never counts as an approver. Each approval is recorded separately with evidence references.

## D-017: Profile address rule (2026-10-10)
- Status: Accepted
- Decision: A living member registering themselves must provide a current address, which is private to them by default; only city/locality is shared, and only with opt-in discovery consent. Profiles created by others and deceased profiles take a last known address, with city optional.
- Consequence: Supersedes the earlier "address optional" wording in the docs pack; privacy defaults in D-007 still apply.

## D-018: Git workflow (2026-10-10)
- Status: Accepted
- Decision: Public GitHub repository `Rajendra-Kr12/parampara-the-legacy`. Ruleset `protect-main` blocks direct pushes, force pushes, and deletion of `main`; all changes merge through pull requests with review conversations resolved. Required approvals are 0 because a solo owner cannot approve their own PR; raise this when collaborators join.
- Rationale: GitHub Free enforces rulesets only on public repositories. No real family data or secrets are ever committed. No open-source license is added: the code is visible but not licensed for reuse.

## D-019: Model and task routing (2026-10-10)
- Status: Accepted; classifier implemented in `tools/route-task` (live call unverified, see `docs/scope.md`)
- Decision: A static routing table (`docs/model-routing.md`) maps task tiers to models and harnesses. Laya, a decision model on Vercel AI Gateway, classifies task descriptions into tiers, with fallback to the static table.
- Constraints: Laya sees task descriptions only, never family data or secrets. Free on AI Gateway only through 2026-10-31; billed afterwards.

## D-020: Review tooling (2026-10-10)
- Status: Accepted
- Decision: Greptile reviews every PR on its free Starter plan (1 active developer, 50 credits per month; the open-source program needs an OSI license, which this repo deliberately lacks). To conserve credits, `.greptile/config.json` uses base effort (1 credit) and reviews only when a PR opens; comment `@greptileai` to request a re-review. Revisit the plan when collaborators join. Codex adversarial review runs before each feature shipment; when Codex implemented the change, a Claude model performs the adversarial review instead.

## D-021: Relationship to llm-arena (2026-10-10)
- Status: Accepted
- Decision: Reuse llm-arena's documentation discipline (short root files, living scope, skills, approval gate). Clerk and Greptile are adopted on their own merits. Prisma, PostHog, Arcjet, and its Next.js-only architecture are not adopted.

## D-022: More harnesses, a model catalog, and data classes (2026-10-11)
- Status: Accepted; amends D-019
- Context: The owner also uses OpenCode (with an OpenCode Zen key), Pi, and Hermes Agent, and wants free models used where safe. Official docs show OpenCode, Pi, and Hermes all read `AGENTS.md` and `.agents/skills`; Hermes needs `hermes skills trust` first. Kimi K2.6 and MiniMax are paid on OpenCode Zen (older articles listing them as free are out of date). Several free Zen models collect prompts for training or are trial-only.
- Decision: Add `docs/model-catalog.md` with model IDs, prices, and four data-handling classes (A paid, B free zero-retention, C free with possible training, D trial-only). Free models may see public repository content only, never secrets or family data, and never do T2, T3, review, or security work. Laya also classifies task sensitivity and volume, and routes bulk low-risk work to class B or cheap paid models first.
- Consequence: Free lineups rotate, so the catalog carries a verification date and must be re-checked monthly. Hermes is not in Firstmate's documented harness list; use it through a herdr pane until verified. Do not add `AGENTS.override.md` or `.hermes.md`, which would shadow `AGENTS.md`.
- Follow-up: Run each harness once in this repo and record results (Feature 0). Done 2026-10-11 except agy (quota); results in `docs/model-routing.md`, open items in `docs/harness-setup.md`.
