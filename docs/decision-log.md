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
- Status: Accepted; timer details decided in D-026
- Decision: A story dispute has a 60-day resolution window. If unresolved, move the story to the contributor's private drafts.
- Open: resolved by D-026.

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
- Status: Accepted; classifier implemented in `tools/route-task` (one owner live check on 2026-10-12, see D-030)
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
- Follow-up: Run each harness once in this repo and record results (Feature 0). Done 2026-10-11; agy partly (Gemini pool quota-limited, Claude and GPT pool answered); results in `docs/model-routing.md`, open items in `docs/harness-setup.md`.

## D-023: Close-relative eligibility per claim type (2026-10-11)
- Status: Accepted
- Context: Reviewer eligibility for claims, deceased profiles, and historical facts was open (PRD open decision 1; scope foundation item "Define close-relative eligibility"). D-016 needs "eligible close relatives" defined before Feature 5 and Feature 6 can be built.
- Options considered: (A) two circles of relatives, scoped by claim type, with a block right for living parties to an edge; (B) one combined circle for every claim type, no block right; (C) a wider circle up to the third degree (adds cousins, grand-uncles and grand-aunts); (D) reviewers designated by the family administrator.
- Decision: Option A. Relatives are counted from the subject's point of view:
  - Core relatives: spouse or partner, parents, children, and siblings (including half-siblings).
  - Extended relatives: grandparents, grandchildren, parents' siblings, siblings' children, and children's spouses.
  - New relationship at invitation: only the other party to the invitation confirms (1).
  - Low-risk profile-field correction: the subject alone when living and registered; otherwise 1 approval from a core or extended relative.
  - Change to an established parent-child or marriage/partner edge: 2 approvals in total. Every living, registered party to the edge must be among the approvers, and a rejection by such a party blocks the change. The other approvals come from core relatives of either party.
  - Uncertain historical claim: 2 approvals from core or extended relatives, plus evidence under D-005.
  - Deceased profile (D-016): core and extended relatives are both eligible and both count toward the three (or two plus reviewed evidence); review requests go to core relatives first.
- Constraints for every claim type: a reviewer has a verified account, is an adult (not guardian-managed), and is a registered member of the family group; their path to the subject uses only accepted edges and never the edge under review; the proposer never counts, even when they are a party to the edge or a core relative (a proposing party's proposal stands as their consent, and the living-party requirement then applies to the other parties); one person counts once however many paths connect them.
- Rationale: Parentage and marriage changes are the highest-risk edits, so the people on the edge and their immediate family decide them, and a living person cannot have their own parentage or marriage changed over their objection. Older deceased ancestors often have few living core relatives, so extended relatives (grandchildren, daughters-in-law, sons-in-law) are needed or D-016 profiles would stay pending indefinitely.
- Consequences: Eligibility is a pure function in `packages/domain`, computed server-side at decision time. Acceptance criteria in `docs/acceptance-criteria.md` (shared definitions, Feature 5, Feature 6).
- Reversible recommendations recorded with this decision (not owner-decided; revisit if they cause problems): a living party to an edge who has not yet registered cannot approve, is notified through the contact on file, and can open a dispute after registering; a rejection by an eligible reviewer who is not a party moves the claim to `disputed` for evidence or administrator escalation rather than rejecting it outright.

## D-024: Which stories need approval, and by whom (2026-10-11)
- Status: Accepted
- Context: FR-07 says memories need no approval and a story about a person needs approval from that person's living close relatives, but left the scope, reviewer set, and threshold to Feature 7 (PRD open decision; scope Feature 7). The original brief's example: a father's memory of the deceased grandfather is accepted, while a story about the grandfather is verified by the grandmother, uncles, or aunts.
- Options considered: (A) only stories with tagged subjects, one approval per subject; (B) as A, but a deceased or not-registered subject needs 2 core-relative approvals; (C) every story needs approval from a core relative of the contributor, plus subject rules; (D) the family administrator approves all stories.
- Decision: Option B.
  - Memories (the contributor's own experience) never need approval, even when other people appear in them.
  - A story needs approval when it names one or more people (its subjects) or makes historical claims about a family event the contributor did not experience. The contributor tags the subjects.
  - Living, registered adult subject: the subject alone approves (1).
  - Deceased or not-registered subject: 2 approvals from registered core relatives of the subject (D-023); when fewer than 2 core relatives are eligible, extended relatives fill the remaining approvals.
  - Minor subject: the minor's guardian approves.
  - A story with several subjects is published only when every subject's rule is met.
  - The contributor never approves their own story, and one person counts once per subject.
  - An eligible reviewer for a person who appears in an untagged memory or story can flag it as making claims about that person, which sends it to review under these rules.
  - A rejection by any eligible reviewer starts the story dispute workflow (60-day rule, D-006).
- Rationale: A living person has the final say over stories about themselves; people who can no longer speak for themselves get a two-relative check on their reputation. Extended relatives fill in only where the core circle is too small, so stories about older ancestors are not blocked forever.
- Consequences: Story review reuses the D-023 eligibility function. Acceptance criteria in `docs/acceptance-criteria.md` (Feature 7).
- Reversible recommendation recorded with this decision (not owner-decided): a story about a deceased or unregistered adult subject with fewer than 2 eligible relatives in total stays `in_review`, and the contributor may withdraw it to drafts at any time.

## D-025: First-launch languages and kinship terminology (2026-10-11)
- Status: Accepted
- Context: Initial languages and regional terminology were open (PRD open decision 3; scope foundation item "Define first-launch languages/regions"). Telugu comes first. The domain model warns that one Telugu vocabulary is not universal across regions or households.
- Options considered: (A) English interface with Telugu kinship terms; (B) A plus a full Telugu translation of the interface with a language switch; (C) A plus separate Coastal Andhra, Telangana, and Rayalaseema catalogues at launch; (D) Telugu plus one or two more languages' kinship catalogues at launch.
- Decision: Option B.
  - Interface: English and Telugu at launch on web, iOS, and Android, with a language switch available to every member. Every user-facing string, including notifications, emails or SMS, and error messages, exists in both languages.
  - Kinship terms: one general Telugu catalogue (`te-IN`), shown in Telugu script with a Latin transliteration; each viewer chooses script, transliteration, or both.
  - Fallback: where Telugu has no validated term for a path, a plain description is shown in the viewer's interface language.
  - Regional and household variants (Coastal Andhra, Telangana, Rayalaseema, family-specific): captured as family custom labels at launch and promoted into regional catalogues once validated by native speakers.
  - Person names accept any Unicode script from day one.
  - Other languages (for example Hindi, Tamil, Kannada) come after the pilot.
- Rationale: Older relatives, who hold most of the family history, often read Telugu more comfortably than English. Custom labels cover regional differences without shipping unvalidated regional catalogues.
- Consequences: Every UI change needs a reviewed Telugu translation before release, on all three platforms; Feature 1 must pick an i18n approach shared by Next.js and Expo, and CI should fail on a missing translation key. Acceptance criteria in `docs/acceptance-criteria.md` (Feature 4).
- Reversible recommendations recorded with this decision (not owner-decided): the interface language defaults to the device or browser language when it is Telugu, otherwise English; Telugu interface strings are reviewed by a native speaker, and machine translation may draft them but never ships unreviewed.

## D-026: Story dispute timer rules (2026-10-11)
- Status: Accepted; fills in the open details of D-006
- Context: D-006 set a 60-day resolution window for story disputes, after which an unresolved story moves to the contributor's private drafts, but left the timer start, visibility, resolution, extension, notifications, and exceptions open (scope Feature 7).
- Options considered: (A) timer starts at the first dispute and the story stays visible to its audience marked "disputed"; (B) as A, but the story is hidden from the wider family while the dispute is open; (C) as A with no extension; (D) as A, but the clock starts when the contributor opens the dispute notice or 7 days after it is sent.
- Decision: Option B.
  - Start: the timer starts when an eligible reviewer opens a dispute on a story, whether it is in review or published. There is one timer per story; further disputes on the same story join it and do not reset it.
  - Visibility during the dispute: the story and its alternative versions are hidden from its normal audience. Only these people can see them: the contributor; every member who disputed it; the story's eligible reviewers under D-024; its living, registered subjects (and a minor subject's guardian); and a family administrator only once the dispute has been escalated to them and only if they are not a party. Other administrators have no access, in line with FR-11.
  - Resolution, any one of: every disputing member withdraws; the contributor edits the story, every disputing member accepts the edited version, and the D-024 approval rule is met for it; or a family administrator who is not the contributor, a disputer, or a subject resolves the escalated dispute and records the basis. A story resolved in favour of publication returns to its audience.
  - Extension: once per dispute, by up to 30 days, by a family administrator who is not a party, with a recorded reason, before the deadline.
  - Notifications: the contributor, the disputers, and the eligible reviewers are notified when the dispute opens, at day 30, 7 days before the deadline, and at expiry.
  - Expiry: if unresolved at the deadline, the story moves to the contributor's private drafts, keeping its versions and dispute record.
  - Exceptions: a legal hold freezes the story in its hidden state until the hold is lifted; if the contributor has closed their account or died, the story moves to `archived_restricted` under the preservation policy (D-008) instead of to drafts.
- Rationale: A story that a close relative says is false or hurtful should not stay in front of the family while it is being discussed. Keeping the visible circle to the people who need it to resolve the dispute respects FR-11 (administrator status is not blanket access).
- Consequences: Any one eligible reviewer can take a published story out of view for up to 60 days (90 with an extension) by disputing it; this is the accepted trade-off. Media attached to a hidden story follows the story's visibility. The deadline job runs as a Convex scheduled function. Acceptance criteria in `docs/acceptance-criteria.md` (Feature 7).
- Reversible recommendation recorded with this decision (not owner-decided): a member may open at most one dispute per story at a time, and a dispute withdrawn by every disputer ends the timer; a new dispute after resolution starts a new 60-day timer.

## D-027: Connecting a new deceased profile to the family (2026-10-11)
- Status: Accepted; extends D-016 and D-023
- Context: Review of PR #4 (Greptile) found that D-023 covers new relationships made at invitation and changes to established relationships, but not the new relationships that connect a newly proposed deceased person to the family. A deceased person cannot confirm an invitation, and reviewers must be eligible through accepted relationships that never include the edge under review, so a new, unconnected deceased profile had no approval path.
- Options considered: (A) the deceased-profile claim carries its proposed connecting edges, each living registered person on an edge confirms their own edge, and the profile is approved and its edges accepted together; (B) the edges are approved first as separate relationship claims, then the profile; (C) the proposer's edge is accepted provisionally and other relatives review through it.
- Decision: Option A.
  - A deceased-profile claim includes the relationship edges that connect the deceased person to existing people (for example Venkata as spouse of Sarada and parent of Ravi, Anil, and Padma).
  - Each living, registered person named on a proposed edge confirms or rejects their own edge, as the other party does at invitation. When the proposer is on an edge, their proposal stands as their consent to that edge, but the proposer never counts as an approver of the profile.
  - A reviewer is eligible for the profile only through an edge they have confirmed themselves or through edges that are already accepted; a path through another person's unconfirmed proposed edge does not count.
  - The D-016 threshold is unchanged. When it is met, the profile becomes `approved` and every confirmed connecting edge becomes `accepted`, together in one Convex mutation.
- Rationale: The people who know the deceased person best are the ones the proposer names as spouse, children, or siblings; asking each of them to vouch for their own link keeps the D-016 threshold meaningful without a separate round of relationship claims.
- Consequences: Acceptance criteria in `docs/acceptance-criteria.md` (Feature 6, "Connecting a new deceased profile").
- Reversible recommendations recorded with this decision (not owner-decided): a proposed edge rejected by the person on it is not created and that person gains no eligibility through it, while the rest of the claim continues; a proposed edge to a living person who is not registered stays `pending` after the profile is approved, until that person registers and confirms it, and does not block the profile.

## D-028: Event stories must tag a subject (2026-10-11)
- Status: Accepted; amends D-024
- Context: Review of PR #4 (Greptile) found that D-024 makes a story about a family event the contributor did not experience need approval, but every approval rule depends on a subject, so an event story naming no person (for example the ancestral home being destroyed in a flood) had no reviewer set.
- Options considered: (A) an event story must tag at least one subject, then the D-024 subject rules apply; (B) an event story with no subject needs 2 approvals from registered adult core relatives of the contributor; (C) an event story with no subject is treated as a memory and needs no approval.
- Decision: Option A. A story about a family event must tag at least one subject: the person or people the event concerns (for example the head of the household at the time). The D-024 rules for each tagged subject then apply. A story with no tagged subject cannot be submitted.
- Rationale: Every claim about the family's past concerns someone; tagging them gives the story a reviewer set from the existing rules instead of a new approval path.
- Consequences: Acceptance criteria in `docs/acceptance-criteria.md` (Feature 7, "Event stories").
- Reversible recommendation recorded with this decision (not owner-decided): changing the tagged subjects of a story that is in review or published restarts review under the new subject set, and removing the last subject is rejected.

## D-029: One approval counts toward only one subject (2026-10-11)
- Status: Accepted; clarifies D-024
- Context: Review of PR #4 found that D-024's "one person counts once per subject" could be read as letting one approver satisfy several subjects' rules, which changes the threshold for a story tagging a living subject and a deceased subject.
- Decision: No double counting across subjects. One person's approval counts toward only one subject's rule. For a story tagging a living subject and a deceased subject, the deceased subject's 2 core-relative approvals come from people other than the approver who approves as the living subject. A story tagging Venkata and Sarada needs 3 approvals in total: Sarada as subject plus 2 other core relatives of Venkata (for example Anil and Padma).
- Consequences: Acceptance criteria in `docs/acceptance-criteria.md` (Feature 7, "Story approval", AC-7.18, AC-7.25, AC-7.26).

## D-030: Laya live check and budget cap (2026-10-12)
- Status: Observation recorded; budget-cap decision open
- Context: The `tools/route-task` router (PR #5) was only covered by automated tests. On 2026-10-12 the owner ran the live check from `tools/route-task/README.md` for the task 'Classify a docs update'.
- Observation: `routingPath` was `laya` and the tier was T1. The static table in `docs/model-routing.md` gives D for the same task. The owner reported this; it was not re-run when this was recorded. It is an observation only: no routing rule, table, or catalog row was changed, and one sample does not show which answer is better.
- Open: Before 2026-10-31 the owner sets an AI Gateway budget cap and decides whether to keep paid Laya or self-host. After that date the router defaults to static routing unless `ROUTE_TASK_ENABLE_PAID_LAYA=true`.

## D-031: Convex auth backend choices (2026-10-12)
- Status: Accepted (Feature 1 step 2, branch `feat/para-auth-backend`)
- Context: Step 2 of the approved Feature 1 scaffold plan adds `packages/backend`. Some details were not settled by the plan.
- Decisions:
  - `users.me` takes no arguments and returns `null` when signed out, otherwise `{ name }` from the verified identity. `name` is `null` when the Clerk token carries no name (email and password sign-up may not collect one), so a missing name is never filled in and never confused with signed out.
  - `convex/_generated/` is committed as produced by the Convex CLI against the owner's dev deployment. `convex codegen` needs a deployment and the owner's login, so agents cannot regenerate it; whoever changes a Convex function or the schema regenerates it with `npx convex dev` and commits the result. It is excluded from ESLint and Prettier.
  - `auth.config.ts` reads `CLERK_JWT_ISSUER_DOMAIN` through `requireHttpsUrl`, which throws an error naming the variable, never its value, when it is unset or not an https URL. The deployment therefore refuses to load its auth config until the variable is set in the Convex dashboard.
  - `process.env` is typed by a small ambient declaration instead of `@types/node`, because the default Convex runtime is not Node.js.
  - esbuild, a convex dependency, is listed as `allowBuilds: { esbuild: false }` in `pnpm-workspace.yaml`. Its postinstall only checks the platform binary, which pnpm already installs as an `@esbuild/*` optional dependency.
  - convex-test receives its modules from `import.meta.glob(["./**/*.*s", "!./**/*.*.*"])`. The extglob in the convex-test docs matches nothing under Vite 8.
- Consequences: Steps 3 and 4 import `api` from `@parampara/backend/api`. Every new public Convex function needs its own signed-out and wrong-user tests; a test fails if `convex/users.ts` gains another export.
