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
- Status: Accepted; amends D-019; the T2/T3 free-model ban is narrowed by D-055
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

## D-032: Pinned toolchain versions (2026-10-12)
- Status: Accepted (Feature 1 step 1)
- Context: D-014 left exact versions to be confirmed at scaffold time.
- Decision: Exact versions with no `^` or `~` in every workspace package. pnpm 12.11.2 through `packageManager`; Node 24 (`.nvmrc`, `engines >=24.3.0 <25`); Turborepo 2.11.7; Prettier 3.9.10; `typescript-eslint` 8.71.1; `globals` 17.13.0; Vitest 5.0.3; Convex 1.46.0; `convex-test` 0.0.61; `@edge-runtime/vm` 5.0.0; `yaml` 2.9.1. TypeScript and ESLint are D-033 and D-034.
- Supply-chain controls: `minimumReleaseAge: 1440` (pnpm's own default, set explicitly) and `strictDepBuilds: true` with an `allowBuilds` list reviewed entry by entry. The plan suggested 4320 minutes; 1440 is in place because the plan's own Prettier pin was two days old at the time.
- Consequences: A version is chosen deliberately or not at all. CI installs with `--frozen-lockfile`, so the lockfile and the pins move together in one dependency PR. Review `pnpm-workspace.yaml` in every dependency change: pnpm may append `minimumReleaseAgeExclude` entries on its own. Raise `minimumReleaseAge` to 4320 in a later dependency PR. `tools/route-task` is outside the workspace and still uses npm with caret ranges.

## D-033: TypeScript 6.0.3, not 7 (2026-10-12)
- Status: Accepted; settles an open choice in the approved scaffold plan
- Context: TypeScript 7 is the Go-native compiler.
- Decision: Pin TypeScript 6.0.3 across the workspace.
- Rationale: `typescript-eslint` 8.71.1 declares `typescript >=4.8.4 <6.1.0`. Lint and typecheck must share one compiler, and `eslint-config-expo`, added with step 4, depends on `typescript-eslint` too.
- Consequences: Revisit when typescript-eslint supports 7. Do not bump to 7 in a dependency PR before that check.

## D-034: ESLint 9.39.5 with flat config, not 10 and not Biome (2026-10-12)
- Status: Accepted; settles an open choice in the approved scaffold plan
- Decision: ESLint 9.39.5 for linting, Prettier for formatting, `tsc` for typecheck: one tool per concern.
- Rationale: `eslint-config-next`, added with step 3, pulls `eslint-plugin-react`, `eslint-plugin-import`, and `jsx-a11y`, which cap at ESLint 9, and only ESLint has the Next.js and Expo framework rules. Biome was rejected because it would take over both linting and formatting without those rules.
- Consequences: The type-aware `strictTypeChecked` rules run with `projectService`, warnings are errors (`--max-warnings 0`), and `packages/domain` and `packages/kinship-engine` add a `no-restricted-imports` block for UI, Convex, and Clerk imports. `packages/validation` does not yet.

## D-035: pnpm isolated node_modules (2026-10-12)
- Status: Accepted; reversible
- Decision: Keep pnpm's default `isolated` linker. No `nodeLinker` setting and no `.npmrc`.
- Rationale: Isolated installs are stricter and catch phantom dependencies, and Expo SDK 54 and later support them. The official Convex starter template uses `nodeLinker: hoisted`; that was not copied.
- Consequences: If a Metro or native build fails on a missing peer, fix it by installing through `npx expo install`, not by switching to `hoisted` first. Isolated mode already caused one real failure: `convex-test` must be inlined in the Vitest config (D-036).

## D-036: Test stack (2026-10-12)
- Status: Accepted for the shared packages, the enforcement probes, and Convex; the client runners are still open
- Decisions:
  - Shared and pure packages use Vitest 5, one trivial test each today.
  - Convex functions use `convex-test` 0.0.61 under Vitest's `edge-runtime` environment. Two settings are required under isolated installs: `server.deps.inline: ["convex-test"]`, and modules passed to `convexTest` through `import.meta.glob(["./**/*.*s", "!./**/*.*.*"])`. Without them the errors look unrelated (`import.meta.glob is not a function`, `Could not find the "_generated" directory`).
  - The enforcement probes in `packages/config/probes/enforcement.test.mjs` run under `node --test` and feed deliberately broken fixtures to the real TypeScript, ESLint, and Prettier configuration.
  - `tools/route-task` keeps npm and `node --test` and stays outside the workspace and outside CI.
- Consequences: No coverage threshold. `convex-test` does not enforce usage limits or run crons, so the Convex local backend is a later option. Still undecided: Playwright with `@clerk/testing` for web, `jest-expo` for mobile components, and Maestro for mobile end to end, all added with steps 3 and 4.

## D-037: CI shape (2026-10-12)
- Status: Accepted (Feature 1 step 1)
- Decision: One workflow, `.github/workflows/ci.yml`, with a matrix over `format`, `lint`, `typecheck`, `test`, and `build`. Actions are pinned by commit SHA, workflow permissions are `contents: read`, concurrency cancels superseded runs, and Node comes from `.nvmrc` with the pnpm cache on. `tools/route-task` is outside this workflow's scope, stated in the file header.
- Rationale: The matrix job names are the status-check contexts to require on `protect-main` later, so adding a check must not rename them.
- Not done: `protect-main` still has no required status checks, repository-wide action SHA pinning is off, and there is no mobile E2E workflow and no Turbo remote cache. Those are plan step 5 and need owner approval because they change shared settings.
- Consequences: The workflow cannot verify a real Clerk sign-in, because GitHub withholds secrets from fork PRs, and it cannot check Convex codegen drift, because `convex codegen` needs `CONVEX_DEPLOYMENT`. A drift job stays an open design item.

## D-038: Clerk to Convex wiring, server side done and clients not built (2026-10-12)
- Status: Accepted; the client half is not built
- Decisions:
  - Server side is what D-031 records: `auth.config.ts` with `applicationID: "convex"`, `CLERK_JWT_ISSUER_DOMAIN` read through `requireHttpsUrl`, identity only from `ctx.auth`, and the committed `convex/_generated/` exported as `@parampara/backend/api`.
  - Clients, when they exist, follow the official Convex Clerk guide: `ClerkProvider` outside `ConvexProviderWithClerk`, and `<Authenticated>` or `useConvexAuth()` rather than Clerk's `useAuth()`, so the UI shows only what the backend verified.
  - `CLERK_SECRET_KEY` and the Convex deploy key never go into `NEXT_PUBLIC_*` or `EXPO_PUBLIC_*`. `npx clerk init` is not used, because it is unpinned and writes keys.
- State of the proof: neither `apps/web` nor `apps/mobile` exists (steps 3 and 4). Sign-in is in progress: nothing has been signed in against a real Clerk instance or Convex deployment. The Convex development deployment exists, because the owner generated `convex/_generated/` against it (D-031). Owner-confirmed on 2026-10-12: the Clerk development app and the Convex development project both exist, and `CLERK_JWT_ISSUER_DOMAIN` is already set in the Convex development deployment (the value is not recorded here). The sign-in proof itself is still to come once a client app exists.
- Open: the Expo SDK choice, the mobile sign-in flow, where the iOS and Android proof runs, and the shared i18n approach D-025 requires Feature 1 to pick.

## D-039: Fallow as a non-blocking CI report (2026-10-12)
- Status: Accepted; built as D-040 (plan step 6)
- Context: Fallow is a Rust analyzer for unused code, duplication, complexity, and architecture boundaries. The plan audited 3.33.1 and ran it against a synthetic monorepo.
- Decision: Add Fallow as a pinned devDependency run from CI only. Do not adopt the Fallow GitHub Action. Keep the job out of the required checks, run it with `continue-on-error` and `contents: read`, and set `DO_NOT_TRACK=1` and `FALLOW_UPDATE_CHECK=off`. Use the default mode only: `--include-entry-exports` produced false positives on `convex/_generated` and on framework config defaults. Commit a minimal `.fallowrc.json` ignoring `**/convex/_generated/**`. Never run `fallow fix` in CI.
- Consequences: Version bumps are deliberate, in a PR, after reading the CHANGELOG. Fallow has a single maintainer and a fast release cadence; nothing depends on it, so it can be removed without touching application code.

## D-040: Fallow as a non-blocking code-health report (2026-10-12)
- Status: Accepted (Feature 1 step 6, branch `chore/para-fallow`; implements D-039)
- Context: Step 6 of the approved Feature 1 scaffold plan adds dead-code and duplication analysis. The plan's Fallow evaluation (section 11) sets the terms.
- Decision: Fallow 3.33.1 is a pinned exact devDependency of the root package, never `latest`. CI runs the installed binary with `pnpm exec`. The `fallow` job in `ci.yml` writes `dead-code` and `dupes` reports to the job summary and can never fail a PR: `continue-on-error` on the job, `|| true` on each analysis step, not a required status check, and no write permissions. Telemetry and the update check are off in that job. `fallow fix` never runs in CI. `.fallowrc.json` ignores `**/convex/_generated/**`; the default analysis is used, and `--include-entry-exports` stays off because it flags Convex generated files and framework config default exports.
- Rationale: Fallow results degrade without `node_modules`, so the job runs after install. The team chose not to use the fallow-rs GitHub Action and runs the pinned CLI directly instead.
- Consequences: Keep the job out of the `protect-main` required checks. Upgrading Fallow is a dependency PR that reviews the pin and the `pnpm minimumReleaseAge` rule. Whether the report should ever gate merges is a separate owner decision.

## D-041: Web sign-in proof choices (2026-10-12)
- Status: Accepted (Feature 1 step 3, branch `feat/para-web-auth`)
- Context: Step 3 of the approved Feature 1 scaffold plan adds `apps/web`. Some details were not settled by the plan.
- Decisions:
  - The root layout calls `connection()`, so every page renders per request and nothing is prerendered at build time. Pages depend on the caller's session, and `next build` (and CI) then needs no Clerk or Convex keys.
  - Signed-in state and the name come from Convex: `Authenticated`/`useConvexAuth` and the `users.me` query, never Clerk's `useUser`. Clerk's `Show` is used only inside the Convex `Unauthenticated` branch, to tell a signed-out visitor (sign-in link) from a Clerk session that Convex rejected (sign-out button instead of a sign-in link that would bounce back).
  - A `null` name from `users.me` renders a separate "no display name yet" message (`data-testid="my-name-missing"`); it is never filled in from Clerk.
  - `NEXT_PUBLIC_CONVEX_URL` is read through `lib/public-env.ts`, which requires https (http only on localhost) and names the variable, never its value, in errors. The Convex client is created on first render, not at import time.
  - `test` runs Vitest unit tests and is part of CI; `test:e2e` runs Playwright and is not, because it needs the Clerk dev instance, the Convex dev deployment and a test user. It loads `apps/web/.env.local` and skips every test, with a message naming the missing variables, when any of `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CONVEX_URL`, `E2E_CLERK_USER_USERNAME`, `E2E_CLERK_USER_PASSWORD` or `E2E_CLERK_USER_NAME` is unset.
  - Every page sets `robots: noindex, nofollow`; Clerk's browser SDK telemetry is off (`telemetry={false}`), and CI sets `NEXT_TELEMETRY_DISABLED=1` because Next.js ignores `DO_NOT_TRACK`.
  - unrs-resolver, pulled in by `eslint-config-next`, is listed as `allowBuilds: { unrs-resolver: false }`. Its postinstall only checks or fetches the platform binary, which pnpm already installs as an `@unrs/resolver-binding-*` optional dependency.
- Consequences: The owner runs the Playwright proof locally (see `docs/scope.md`). pnpm installs `convex@1.46.0` twice (the backend's copy without peers, the web app's with React and `@clerk/react` peers). The production client bundle defines Convex's function-name symbol once, and function references match across copies anyway because Convex keys them with `Symbol.for`, so no change to `packages/backend` is needed now; revisit if a Convex upgrade lands in only one package.

## D-042: Hooks for hard rules (2026-10-13)
- Status: Accepted (branch `fm/para-hard-rule-hooks`; adopts item 1 of the 2026-10-13 adoption note)
- Context: `AGENTS.md` carried "never commit secrets or `.env`" and "never send real family data to an external model" as prose. Both can be tested by tooling.
- Decision: `scripts/check-secrets.mjs` (`pnpm run check:secrets`) fails on tracked `.env*` files other than `.env.example` and on obvious secret patterns. It runs in a new `secrets` CI job and in an opt-in `.githooks/pre-commit` installed with `pnpm run hooks:install`. A new `route-task` CI job runs the router tests, including one proving a refused task never reaches the key loader or the Laya client. The enforcement ledger in `docs/coding-standards.md` is the owner of what each check covers and its limits; `AGENTS.md` keeps prose only for rules a hook cannot test.
- Consequences: The checks are pattern-based and cannot detect other real family data. The local hook is opt-in, so CI is the gate. Making `secrets` and `route-task` required checks on `protect-main` was an open owner decision at the time; applied in Step 5 (see `docs/coding-standards.md`).

## D-043: Mobile stack: Expo SDK 57 with @clerk/expo 4.10.1 (2026-10-13)
- Status: Accepted (Feature 1 Step 4 plan, decided by the owner; built in Step 4a, branch `fm/para-mobile-shell`)
- Context: D-038 left the Expo SDK open. The Step 4 plan compared SDK 55, 56, 57 and the SDK 58 beta, and the owner also weighed native Kotlin and Swift apps.
- Decision: Keep Expo (React Native) rather than separate native Kotlin and Swift apps. Pin Expo SDK 57 (`expo` 57.0.27, re-resolved at build time as the newest 57.0.x at least 3 days old; 57.0.28 was one day old) with `@clerk/expo` 4.10.1. Exact pins for `apps/mobile`: `react` 19.2.3 and `react-native` 0.86.3 (one React copy with web), `expo-router` 57.0.25, `expo-linking` 57.0.12, `expo-constants` 57.0.21, `react-native-screens` 4.26.2, `react-native-safe-area-context` 5.7.0, `@expo/metro-runtime` 57.0.16, `expo-status-bar` 57.0.1, `expo-secure-store` 57.0.4, `convex` 1.46.0; dev: `typescript` 6.0.3, `@types/react` 19.2.18, `eslint` 9.39.5, `eslint-config-expo` 57.0.2, `jest-expo` 57.0.5, `jest` and `@jest/globals` 29.7.0. Left out: `expo-dev-client`, `expo-web-browser`, `expo-auth-session`, `expo-crypto`, `@testing-library/react-native`.
- Rationale: SDK 57 is the current stable line, matches web's React 19.2.3 and TypeScript 6.0.3, and `@clerk/expo` 4.10.1 allows `expo >=54 <58`. One TypeScript codebase keeps web, iOS and Android on the same Convex `api` and shared packages.
- Consequences: The dependency list and the three new `allowBuilds: false` reviews (`browser-tabs-lock`, `core-js`, `fsevents`; each script read, see `pnpm-workspace.yaml`) were approved with the plan. Upgrading to SDK 58 waits for `@clerk/expo` to allow it.

## D-044: Mobile device proofs run on GitHub Actions as standalone Release builds (2026-10-13)
- Status: Accepted (owner decision; workflow added in Step 4a)
- Context: The owner's Mac cannot run an iOS simulator for SDK 57 (Xcode 26.4 needs macOS Tahoe, which this model cannot run) and has no Android SDK or free disk for one.
- Decision: `.github/workflows/mobile-e2e.yml` runs the device proofs: an Ubuntu job for the Android emulator (API 34, x86_64, hardware acceleration) and a `macos-26` job for the iOS simulator. Each builds a standalone Release app with embedded JavaScript after `expo prebuild` (no Metro, no Expo Go, no dev client) and runs Maestro, installed from its pinned GitHub release with the checksum verified. The workflow is `workflow_dispatch` only, reads the public values from the repository variables `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` and `EXPO_PUBLIC_CONVEX_URL`, and needs no secrets. Native `ios/` and `android/` folders are generated in CI and never committed.
- Consequences: Every device-level fix is a CI round trip. The owner sets the two repository variables before the first run. The workflow-policy probe now checks every file in `.github/workflows/`, not only `ci.yml`.

## D-045: Live mobile sign-in in CI uses a protected Environment (2026-10-13)
- Status: Accepted (owner decision; referenced by Step 4b, still nothing created)
- Decision: The live sign-in proof runs from a manual `workflow_dispatch` job with a protected GitHub Environment that holds the synthetic Clerk test user's credentials. A dispatch-only job does not run for fork pull requests, which refines D-037's note that CI cannot verify a real Clerk sign-in.
- Consequences: Creating the Environment and its reviewers changes shared repository settings, so the owner does it. Never real family data. Step 4b gated both `mobile-e2e` jobs on the `mobile-e2e` Environment and added a step that fails with a named-variable error if a credential secret is missing, so a dispatch waits for the required reviewer before either job starts; the Environment and its secrets are still the owner's to create.

## D-046: iOS 17 is the minimum iOS version (2026-10-13)
- Status: Accepted (owner decision; revisit before release)
- Context: Expo SDK 57 supports iOS 16.4, but `@clerk/expo` 4.10.1 ships a native module whose pod requires iOS 17.0.
- Decision: Accept iOS 17 or later. The `@clerk/expo` config plugin in `apps/mobile/app.json` raises the deployment target to 17.0 during `expo prebuild`. It is configured with `appleSignIn: false`, because the first sign-in slice is email and password only and the Sign in with Apple entitlement is not needed.
- Consequences: iPhones that stop at iOS 16 (iPhone 8 and X) cannot install the app. Revisit if relatives use those phones.

## D-047: Device-only token cache and no Android backup (2026-10-13)
- Status: Accepted (owner decision; built in Step 4a)
- Decision: Clerk's long-lived client token is stored by `apps/mobile/lib/device-token-cache.ts` in `expo-secure-store` with `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`, not Clerk's bundled `@clerk/expo/token-cache` (`AFTER_FIRST_UNLOCK`, which can move to a new phone in an encrypted backup). `android.allowBackup` is `false` in `app.json`. An unreadable item is deleted and treated as signed out. The short-lived Convex session token stays in memory in the Convex client. Nothing is stored in AsyncStorage or files, and no token is logged.
- Consequences: Restoring a phone from backup signs the user out. Unit tests cover save, read, clear, the device-only option, and "read failure deletes the item and returns null". Open (privacy review of Step 4a, to settle in Step 4b and before real users): iOS keeps Keychain items after the app is deleted, so reinstalling on the same iPhone can restore a Clerk session; a shared family phone needs a first-launch clear or an explicit sign-out.

## D-048: requirePublicUrl lives in packages/validation (2026-10-13)
- Status: Accepted (owner decision; built in Step 4a)
- Decision: The public URL check that web wrote in Step 3 (`https` only, `http` only on localhost, errors name the variable and never echo the value) moved to `packages/validation` (`src/public-url.ts`), and both `apps/web/lib/public-env.ts` and `apps/mobile/lib/public-env.ts` import it. Its tests moved with it. The "not set" message now points at "the app's `.env.local`" instead of `apps/web/.env.local`. It now checks by pattern, like `requireHttpsUrl` in `packages/backend`, instead of `new URL`, and accepts an origin only (an optional port and one trailing slash; no path, query, fragment or user info). React Native's built-in `URL` accepts malformed input, so `new URL` would have answered differently on mobile than on web, and the shared ES2023 tsconfig has no DOM `URL` type.
- Consequences: The parity rule that validation is never duplicated in an app holds. The Clerk publishable-key check (`pk_test_` or `pk_live_`) is mobile-only for now, because web's `ClerkProvider` reads its key itself.

## D-049: Mobile tests: pure-function Jest tests plus Maestro (2026-10-13)
- Status: Accepted (owner decision; settles the mobile half of D-036)
- Decision: `apps/mobile` runs unit tests for pure modules with `jest-expo` 57.0.5 (Jest 29, imports from `@jest/globals`, no global test types) and device flows with Maestro in `mobile-e2e.yml`. `@testing-library/react-native` is not added. Screen logic that needs testing is kept in pure functions.
- Consequences: `pnpm test` runs Jest next to Vitest. `jest-expo` brings `@react-native/jest-preset` 0.86.3 as a required peer, which pnpm installs automatically.

## D-050: Step 4b sign-in scope is email and password only (2026-10-13)
- Status: Accepted (owner decision; built in Step 4b)
- Decision: Mobile sign-in in Step 4b supports email and password only. When Clerk asks for Device Trust (`needs_client_trust`) or a second factor (`needs_second_factor`), the app shows a fixed, safe "not supported yet" message. Clerk error text is never shown.
- Consequences: `apps/mobile/lib/sign-in-state.ts` maps Clerk's status and error signals to one fixed refusal message and the one "not supported yet" message, and only `status === "complete"` lets the screen finalize; a status added later is never treated as signed in. Unit tests pin each mapping. The generic refusal also keeps a wrong password indistinguishable from an unknown account.
- Must build before real users: Device Trust and MFA handling on mobile. Clerk turns Device Trust on by default for instances created after 2025-11-14, so real users would be blocked on a new phone without it.

## D-051: Provisional development app ids (2026-10-13)
- Status: Accepted (owner decision)
- Decision: `ios.bundleIdentifier` and `android.package` are `dev.parampara.provisional`, and the URL scheme is `parampara`. These are development-only ids.
- Consequences: The real ids are decided before any store build. Clerk's native sign-in providers will later be tied to the final ids.

## D-052: Telugu-script name for the synthetic test user (2026-10-13)
- Status: Accepted (owner decision; after Step 4b passes)
- Decision: After the Step 4b proof passes, the owner sets the synthetic Clerk test user's display name to include Telugu script (for example the fixture family's Kiran, కిరణ్), updates `E2E_CLERK_USER_NAME`, and the web and both mobile proofs are re-run. This is the cheapest evidence for the parity skill's "Telugu renders correctly" item.

## D-053: Step 4a build choices (2026-10-13)
- Status: Accepted (Feature 1 Step 4a, branch `fm/para-mobile-shell`)
- Context: Details the approved plan did not settle.
- Decisions:
  - One local command, `pnpm --filter @parampara/mobile run check`, runs the gates in order and prints PASS, FAIL, or "NOT RUN: <reason>, this is not a pass"; `--strict` fails on NOT RUN. The device smoke is always reported as NOT RUN there.
  - Gate 1 runs Prettier with the repository's config and ignore files on the files git tracks or would track, so a harness file excluded only through `.git/info/exclude` cannot fail it locally. CI checks the same files. `.opencode` (agent harness state) is also in `.prettierignore`, next to `.agents`, `.claude` and `.greptile`, so the root `pnpm run format` passes locally too.
  - Gate 7 runs `expo install --check` against the installed SDK's own version map (`EXPO_OFFLINE=1`) plus `expo config`. Online, `expo install --check` asks for the newest patches, which can be younger than `minimumReleaseAge` allows. `expo-doctor` is not run: it is not a pinned dependency.
  - The mobile `build` script runs `scripts/verify-export.mjs`: `expo export` for iOS and Android with synthetic values, then it checks that both bundles exist, that a `CLERK_SECRET_KEY` sentinel appears nowhere in the output, and that the public Convex URL sentinel was inlined. Real `.env*` files are not loaded (`EXPO_NO_DOTENV`), and the export runs with `--clear`, because Metro's transform cache kept an earlier run's inlined `EXPO_PUBLIC_*` value and failed the public-sentinel check once. CI's `build` job therefore enforces the no-secret check for mobile.
  - A missing or malformed public value renders a fixed configuration-error screen that names the variables, never their values, instead of crashing.
  - Expo CLI telemetry is off in CI (`EXPO_NO_TELEMETRY`, passed through by `turbo.json`); Clerk SDK telemetry is off in the app (`telemetry={false}`), as on web.
- Risk recorded, not fixed: `expo-router` depends on `react-native-drawer-layout`, which declares `react-native-reanimated`, `react-native-gesture-handler` and `react-native-worklets` as required peers, so pnpm installs their newest versions (4.7.1, 3.3.0, 0.13.0) and Expo autolinking would compile them into the native apps. SDK 57's version map expects 4.5.1, about 2.32 and 0.10.1. The app does not use them. The first `mobile-e2e.yml` run shows whether the native builds accept them; if not, the fix (pinning them to the SDK versions, or excluding them from autolinking) is a dependency decision for the owner.

## D-054: One shared, portable check runner per feature step (2026-10-17)
- Status: Accepted (branch `feat/para-step-check-scripts`)
- Context: The Step 4a pilot proved the shape of a local check that a worker loops on (`apps/mobile/scripts/check.mjs`, D-053): it runs the step's stages in order, prints one PASS, FAIL or "NOT RUN: <reason>, this is not a pass" line per stage, and exits non-zero on failure. The 2026-10-13 adoption note (item 2) made that shape the executable definition of done for every feature step.
- Decision: The runner is generalized into `scripts/check.mjs` at the repo root (Node standard library only, so it runs unchanged on a developer Mac and in CI). It exports `repoRoot`, `runPnpm`, `formatCheck` and `runChecks(stages, { strict, notRun })`; `pnpm run check` runs the repository default stage set (format, lint, typecheck, tests, build for web and packages, and platform parity as the iOS and Android bundle export), and `--strict` fails on a NOT RUN stage. Per-step wrappers import the runner and supply their own stage set; `apps/mobile/scripts/check.mjs` becomes such a wrapper and `pnpm --filter @parampara/mobile run check` is unchanged for the mobile worker, with the same eight stages, labels and assertions. The mobile wrapper runs in a new `mobile-check` CI job, and `docs/checks.md` owns the runner interface and the `/goal` convention (a Claude-run worker sets a `/goal` on the check with a turn limit; other harnesses run the same command without `/goal`). Every stage still runs so one pass shows the whole picture; the exit code is non-zero when any stage failed.
- Consequences: A new step adds a wrapper that imports the runner rather than copying it. The device smoke and the keyed web sign-in e2e stay NOT RUN in the check and run only in `mobile-e2e.yml` and the Playwright proof. `AGENTS.md` gains exactly one pointer line to `docs/checks.md`; its other sections are unchanged.

## D-055: Free DeepSeek on OpenCode for implementation; Codex reviews (2026-10-17)
- Status: Accepted (owner decision 2026-10-17); amends D-019 and D-022
- Context: The owner chose the free DeepSeek model for implementation work, run on the OpenCode harness, with Codex performing reviews, because review and security work must go to a different model family than the implementer. This replaces the earlier blanket rule that no free model may do T2 or T3 work.
- Decision: Implementation may use the free DeepSeek model, but only on the `opencode` harness and nowhere else, and with public repository content only. Free models never perform review or security work; T2 and T3 reviews go to Codex, a different model family from DeepSeek. The blanket ban on free models for T2 and T3 is replaced by this narrower rule; the ban on free models for R (review) and security work stays.
- Consequence: `docs/model-routing.md`, `docs/harness-setup.md` and `AGENTS.md` now state the narrowed rule. `docs/model-catalog.md` has no separate row for a free DeepSeek model: add one only after a trial, per the catalog's verification rule. The `route-task` skill points to `docs/model-routing.md` for the free-model rule.

## D-056: Run the Android device proof through android-emulator-runner (2026-10-23)
- Status: Accepted (Feature 1 Step 4b, branch `feat/para-mobile-auth`); the owner chose this option on 2026-10-23
- Context: The hand-built emulator setup in `mobile-e2e.yml` failed repeatedly: `adb` missing from PATH, then an AVD that `avdmanager` never created (`Unknown AVD name`), with the cause unproven.
- Decision: The Android job uses `reactivecircus/android-emulator-runner`, pinned to the v2.38.0 commit `a421e43855164a8197daf9d8d40fe71c6996bb0d` (Apache-2.0, not archived), with the `default` (AOSP) system image, API 34, x86_64, 4 GB RAM and 4 cores. The install and both Maestro flows run in `apps/mobile/maestro/run-android.sh` because the emulator only lives for that one step. Only Maestro PNG screenshots are uploaded, never its logs, which contain the typed credentials after substitution.
- Why the image: on the Google APIs image a slow software-rendered emulator showed a "Pixel Launcher isn't responding" dialog over the app and Maestro could not see it. The AOSP image with more RAM passed. The cause is inferred from one failing and one passing run, not proven.
- Consequences: One third-party action is added, pinned by commit hash like the others. The workflow stays manual-only and gated by the protected `mobile-e2e` Environment (D-045). The repository is public, so standard runners cost nothing; making it private or using larger runners would bill and needs the owner's approval first.

## D-057: Greptile at milestones; DeepSeek on opencode or agy with review (2026-10-25)
- Status: Accepted (owner decision, branch `feat/para-model-routing-update`); amends D-055 and the Greptile cadence in the earlier Greptile decision
- Decision: Greptile reviews at major milestones only: each PR is reviewed once and fixes are batched, instead of every PR. The free DeepSeek model may implement safe tasks on the `opencode` or `agy` harness, and Codex or Claude reviews the result before merge. Auth and session, secret or key handling, signed URLs and access control, migrations, and personal-data code use paid models only.
- Consequence: `docs/model-routing.md` owns the rule; `AGENTS.md`, `docs/harness-setup.md`, `docs/agent-workflow.md` and `docs/architecture.md` point to or summarize it.

## D-058: Stated relationships are typed edges or a kin_stated record, never free text (2026-10-25)
- Status: Accepted (owner decision 2026-10-25, Feature 2 step F2-0); the edge model still gets an independent Codex read against `relationship-domain-review` before F2-1 starts
- Context: AC-2.07 has Kiran invite Hari "as cousin", but the graph stores typed edges and derives labels (D-002, `docs/domain-model.md`), and a cousin is not a primitive edge. The foundation item "Confirm supported relationship types and constraints" was open.
- Decision: An inviter or invitee states a relationship from a closed list in one of two forms:
  - **Direct types**, stored as typed edges between canonical person ids: parent-child (one directed edge type, read as parent or child from either end) and partner. Whether sibling is its own edge type or is derived from shared parents is decided with Feature 3's edge model; until then sibling is not a direct type.
  - **`kin_stated`**, for supported non-direct terms such as cousin or uncle (and sibling until Feature 3 decides it): a record of who stated what about whom, with its own relationship state. It is confirmed exactly like a direct type, but it is not an edge, is never used as a graph path, and never produces a derived kinship label. Feature 3 may later derive the matching path and reconcile the record with it.
  - Free text is never accepted. A term outside both lists is rejected (AC-2.29).
- Constraints: a self-relationship and any stated edge that would make a person their own ancestor are rejected (AC-2.30). A stated relationship that conflicts with an established `accepted` relationship is not accepted by confirmation alone (AC-2.31); until Feature 5 exists it returns a fixed "needs review" result and nothing changes.
- Consequences: The closed lists live in `packages/domain` (F2-1). Choosing this wrongly would force a rewrite of Features 3 and 5, which is why the independent review comes before F2-1.

## D-059: Founding a family group (2026-10-25)
- Status: Accepted (owner decision 2026-10-25, Feature 2 step F2-0)
- Context: AC-2.10 says nobody completes registration into a family group without a relationship confirmed by the other party, but the first member of a new group has nobody to confirm them.
- Decision: Any account in the `verified` account state (AC-2.01) may found a family group. The founder becomes the group's first member and its administrator without a confirmed relationship; this is the single recorded exception to AC-2.10, and every later member joins through a confirmed relationship. The schema allows an account several memberships, but behavior is one active group per account until Features 3 and 8 settle cross-group identity. Accepting an invitation to a second group while the account holds an active membership is refused with a fixed message that names no group and reveals no member data; the invitation stays pending until it expires or is declined, and there is no leave-and-switch, multi-group, or transfer behavior. Founding a group is rate limited, with the limit in the same config file as the invitation limits (D-061).
- Consequences: The founder's membership and role are written in the same mutation as the group, with an audit event. Founding grants no right in any other group (AC-2.28).

## D-060: Email invitations only in Feature 2 (2026-10-25)
- Status: Accepted (owner decision 2026-10-25, Feature 2 step F2-0)
- Decision: Feature 2 sends invitations by email only. Phone invitations wait for the SMS provider and the India DLT registration decision (`docs/architecture.md` open items). The invitation keeps a `channel` field so phone can be added without a schema rewrite.
- Consequences: AC-2.06, AC-2.11 and AC-2.19 now read "email (phone when available)". Where FR-02 requires a phone or email for a profile created on someone's behalf, Feature 2 requires an email.

## D-061: Invitation expiry and abuse limits (2026-10-25)
- Status: Accepted (owner decision 2026-10-25, Feature 2 step F2-0); reversible
- Decision: An invitation expires 14 days after it is sent. Re-inviting the same contact to the same group while an invitation is pending refreshes the existing one and restarts its expiry (AC-2.20). An inviter may have at most 20 open invitations and may send at most 10 new invitations per day. All of these values live in one config file, and tests read them from there (AC-2.16).
- Consequences: Changing a value is a config change plus a decision-log note, not a code change.

## D-062: Profiles created on someone's behalf (2026-10-25)
- Status: Accepted (owner decision 2026-10-25, Feature 2 step F2-0)
- Decision:
  - Required: name and the person's contact (an email in Feature 2, D-060). Date of birth may be a birth year only. Address is optional and is recorded as a last known address.
  - Contact and address typed by the creator are visible to the creator only until the person claims the profile. On claim they belong to the subject, who reviews them before the profile is shown to anyone else.
  - Minors are rejected with a fixed "not supported yet" message until Feature 8 defines guardian-managed profiles. This settles the conflict between AC-2.12 (contact required) and AC-8.11 (a minor may have no contact).
- Consequences: Read with D-017 and FR-02, which say profiles created by others take a last known address; this decision makes that address optional for living profiles created on someone's behalf. If the owner reads D-017 as making it mandatory, revisit before F2-9.

## D-063: Invitation email through our own adapter (2026-10-25)
- Status: Accepted (owner decision 2026-10-25, Feature 2 step F2-0)
- Decision: Invitations are sent through a custom notification adapter behind an interface, with a test fake, not through Clerk invitations. Clerk invitations cover only new sign-ups, have no SMS, and do not let us own the token, while AC-2.18 needs our own hashed token.
- Consequences: The provider, its cost, and the sender domain are the owner's choice at F2-6, and the provider key is set by the owner; no agent reads it.

## D-064: Pick the i18n and styling approaches at the start of F2-4 (2026-10-25)
- Status: Accepted (owner decision 2026-10-25, Feature 2 step F2-0)
- Decision: The i18n approach shared by Next.js and Expo (required by D-025) and the styling approach (`docs/architecture.md` open items) are each chosen in a small decision PR at the start of F2-4, before any sign-up or profile screen is built. Any new dependency they bring needs owner approval.
- Consequences: If the owner declines both, the fallback is a typed string-key table with English values only, and Telugu waits for Feature 4.

## D-065: Mobile Device Trust and MFA before the first real invitee (2026-10-25)
- Status: Accepted (owner decision 2026-10-25, Feature 2 step F2-0)
- Decision: Mobile Device Trust and MFA handling (left out of Step 4b by D-050) is built before the first real person is invited. It gates the pilot, not Feature 2 "done", and is settled in F2-11.
- Consequences: Until then an invitee signing in on a second device sees the fixed "not supported yet" message.

## D-066: Invitee signs up with a different email (2026-10-25)
- Status: Accepted (owner decision 2026-10-25, Feature 2 step F2-0)
- Decision: An invitation is accepted only by an account that has verified the invited email (AC-2.19). An invitee signed in with another address is refused with one fixed message, "sign in with the address the invitation was sent to", which never reveals the invited address; the inviter may send a fresh invitation.
- Consequences: The same refusal is used whether the address is wrong, unverified, or unknown, so it cannot be used to probe addresses (AC-2.15).
