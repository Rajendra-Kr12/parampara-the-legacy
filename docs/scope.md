# Scope: Parampara

Parampara is a private family legacy network. It preserves family relationships and memories across generations while allowing relatives to establish, challenge, and correct historical claims with transparent evidence and controlled access.

This is the **living project plan**. Keep the feature status, decisions, implementation checklist, verification evidence, and unresolved work current. Do not treat this file as a static one-time PRD.

## Working method

Before each feature:
1. State the smallest useful vertical slice and why it is next.
2. Identify affected domain rules, data, permissions, clients, and risks.
3. List acceptance checks and what must be manually verified.
4. Wait for explicit user approval before coding.

During implementation, maintain a short checklist below the feature. After implementation, record what was built, what was actually verified, and what remains unverified. If the plan changes, record why.

## Product and platform

- Product: Parampara, The Legacy.
- Clients: web, Android, and iOS in the initial release.
- MVP feature groups: family tree; invitations and relationship verification; deceased profiles and evidence; memories, stories, and photos; privacy and administration; opt-in city discovery; audio memories; spreadsheet import.
- The product must remain useful without AI services.
- Stack (D-014, D-015): Turborepo + pnpm; Next.js web; Expo for iOS and Android; Convex backend and database; Clerk auth; Cloudflare R2 media. Versions for the workspace tooling and `packages/backend` are pinned and recorded in `docs/decision-log.md` (D-032 to D-040); the web versions are in `apps/web/package.json` (step 3) and the mobile versions in D-043 (step 4a).
- Repository: public GitHub `Rajendra-Kr12/parampara-the-legacy`, `main` protected, PR-only (D-018).
- Original idea notes: `docs/original-brief.md` (historical; this scope and the PRD supersede it where they differ).

## Current status (2026-10-12)

- Documentation and agent setup refined: shared `AGENTS.md`, thin `CLAUDE.md`, skills audited, model routing documented, stack and several product rules decided (D-012 to D-021); approval, story, language, and dispute-timer rules decided (D-023 to D-029) with testable criteria in `docs/acceptance-criteria.md`.
- Feature 0 tooling merged: harness verification and Firstmate tier-dispatch map (PR #3) and the `tools/route-task` Laya router with static fallback (PR #5). Remaining Feature 0 items are owner actions, a Greptile check, a re-probe of Antigravity, free-model trials, and making the new CI job names required on `protect-main`.
- Feature 1 in progress: step 1 (workspace tooling and CI) merged in PR #8; step 2 (`packages/backend`, the Convex auth backend) merged in PR #9 (D-031). Step 3 (`apps/web`, the web sign-in proof) merged in PR #12 (branch `feat/para-web-auth`); its live sign-in proof passed on 2026-10-13 against the Clerk and Convex dev instances. Step 4 (the Expo mobile app) was planned and approved on 2026-10-13 (D-043 to D-052) and split into 4a, the app shell that runs signed out (branch `fm/para-mobile-shell`, in review), and 4b, email and password sign-in with a live proof on both platforms. Steps 4b and 5 are the remaining work of the approved scaffold plan.
- Time-sensitive: Laya is free on Vercel AI Gateway only through 2026-10-31. The owner's budget-cap decision for paid Laya (keep paid or self-host) is still open and due before that date.
- Owner live check of the Laya router (2026-10-12), reported by the owner and not re-run for this update: for the task 'Classify a docs update' it returned `routingPath: laya` with tier T1, while the static table gives D. This is an observation only; no routing rule or table was changed.

## At a glance

| # | Feature | Priority | Status |
|---|---|---|---|
| 0 | Agent tooling: Laya router, Greptile, CI | Foundation | In progress |
| 1 | Monorepo scaffold and architecture validation | Foundation | Partly done (docs, decisions, workspace tooling, CI, Convex auth backend) |
| 2 | Identity, family groups, invitations | P0 | Not started |
| 3 | Canonical person records and relationship graph | P0 | Not started |
| 4 | Kinship terminology and preferred labels | P0 | Not started |
| 5 | Relationship claims, approvals, audit trail | P0 | Not started |
| 6 | Deceased profiles and historical evidence | P0 | Not started |
| 7 | Memories, stories, photos, dispute workflow | P0 | Not started |
| 8 | Privacy, consent, access control, retention | P0 | Not started |
| 9 | Audio memories | P1, included in MVP | Not started |
| 10 | City-level relative discovery | P1, included in MVP | Not started |
| 11 | Spreadsheet import and duplicate review | P1, included in MVP | Not started |
| 12 | Web, Android, and iOS end-to-end validation | Release | Not started |

P0/P1 express sequencing priority, not exclusion from the agreed MVP.

## Foundation decisions required

- [x] Inspect current repository (2026-10-10: documentation only, no code, no CI, no package manager yet).
- [x] Decide web/mobile monorepo strategy (D-014: Turborepo + Next.js + Expo).
- [x] Decide backend, authentication, and media storage (D-014, D-015). Hosting regions and migrations approach: open.
- [ ] Confirm supported relationship types and constraints.
- [x] Deceased-profile threshold when three eligible relatives are unavailable (D-016).
- [x] Define close-relative eligibility (who counts as close for each claim type) (D-023).
- [x] Define review thresholds for new claims versus changes to established parent-child or marriage relationships (D-023).
- [x] Define first-launch languages/regions for kinship terminology (D-025).
- [ ] Define profile and archival retention policy, including deletion requests and backups.

## Feature 0: agent tooling

### Intended slice
Make multi-harness development safe and cheap before application code: routing, automated review, and CI.

### Checklist
- [x] Implement `tools/route-task` Laya classifier per `docs/model-routing.md`, with static-table fallback (2026-10-11). Covered by automated tests; see the live-check item below. After 2026-10-31 it defaults to static routing unless `ROUTE_TASK_ENABLE_PAID_LAYA=true`.
- [x] Owner: run the live Laya check from `tools/route-task/README.md` (2026-10-12: `routingPath: laya`, tier T1 for 'Classify a docs update'; the static table says D, so the two paths differ on this task; observation only, as reported by the owner).
- [ ] Owner: set an AI Gateway budget cap and decide before 2026-10-31 whether to keep paid Laya or self-host. Still open.
- [x] Map routing tiers to Firstmate dispatch profiles and document the herdr setup in `docs/harness-setup.md` (2026-10-11). The map is a proposal; no Firstmate config file was changed, and herdr lifecycle commands were not run.
- [x] Read official docs for OpenCode, Pi, and Hermes on instruction and skill loading (2026-10-11).
- [x] Run Claude Code, Codex, OpenCode, Pi, and Hermes once in this repo; `AGENTS.md` loading observed for the first four, skill names visible via `AGENTS.md` but skill file discovery unconfirmed, Hermes only partly confirmed. Results in `docs/model-routing.md` (2026-10-11).
- [ ] Re-run the Antigravity (agy) probe after the Gemini quota resets (429 on 2026-10-11, about 44 hours); partial findings from the Claude and GPT pool are in `docs/harness-setup.md`; optionally repeat Hermes with a second model.
- [x] Firstmate cannot dispatch Hermes; manual herdr-pane workflow documented in `docs/harness-setup.md` (2026-10-11).
- [x] Pi and Hermes access to free models recorded in `docs/model-catalog.md` and `docs/harness-setup.md` (2026-10-11). Still not tried: Zen as a Pi custom provider, Pi on OpenRouter free models.
- [ ] Free model class B trial and reviewer calibration done 2026-10-11 (results in `docs/model-catalog.md`; none fits as a sole reviewer); re-verify `docs/model-catalog.md` (dated 2026-10-11).
- [x] Teach `tools/route-task` the data-class rules in `docs/model-routing.md` (2026-10-11).
- [x] Install Greptile (free Starter plan) on the repository (2026-10-10, done by owner).
- [x] Add `.greptile/` review rules and doc context (2026-10-10).
- [ ] Confirm Greptile detects the config and posts a review on PR #1.
- [x] Add GitHub Actions CI (format, lint, typecheck, test, build) (2026-10-12, `.github/workflows/ci.yml`, D-037).
- [x] Enforce the hard rules from the 2026-10-13 adoption note with hooks (2026-10-13, D-042): `scripts/check-secrets.mjs` run by a `secrets` CI job and an opt-in `.githooks/pre-commit` (`pnpm run hooks:install`), plus a `route-task` CI job and a router test proving a refused task never reaches the key loader or Laya. Step 4 planning is a separate PR.
- [ ] Require the CI job names (now including `secrets` and `route-task`) in the `protect-main` ruleset and turn on repository-wide action SHA pinning (plan step 5; owner approval needed; open decision alongside D-037 and D-043).

## Feature 1: monorepo scaffold and architecture validation

### Intended slice
Scaffold the Turborepo with web, mobile, Convex, and shared packages, proving one trivial end-to-end path (signed-in user sees their own name) on web, iOS, and Android.

### Checklist
- [x] Inventory repository and read all docs and skills (2026-10-10).
- [x] Record stack decisions in `docs/architecture.md` and `docs/decision-log.md`.
- [x] Identify security, privacy, data integrity, and cost risks (architecture open items).
- [x] Present scaffold plan and wait for approval before application-code changes (2026-10-12: approved; steps 1 and 2 shipped as PR #8 and PR #9).
- [x] Step 1 `chore/para-scaffold-impl` (merged as PR #8, 2026-10-12): root workspace tooling, `packages/config`, and the `domain`, `kinship-engine`, and `validation` packages with one trivial Vitest test each.
- [x] Step 2 `feat/para-auth-backend` (merged as PR #9, 2026-10-12): `packages/backend` with the `users` schema (display name only, keyed by `tokenIdentifier`), Clerk `auth.config.ts`, the `users.me` query, committed `convex/_generated/` (generated by the owner against the Convex dev deployment), and convex-test tests (D-031, D-038).
- [x] Step 3 `feat/web-auth-proof` (branch `feat/para-web-auth`, merged as PR #12, 2026-10-12; live proof passed 2026-10-13): `apps/web`, Next.js 16 with `ClerkProvider` wrapping a client `ConvexClientProvider`, `proxy.ts` with `clerkMiddleware()`, a `/sign-in` route, a home page gated by Convex `Authenticated`/`useConvexAuth` that shows the `users.me` name in `data-testid="my-name"`, and a Playwright test with `@clerk/testing` (D-041). The live proof against the Clerk dev instance passed (owner action below).
- [x] Owner (done 2026-10-13): put the Clerk dev keys, the Convex dev URL and a synthetic Clerk test user in `apps/web/.env.local` (names in `apps/web/.env.example`), run `pnpm --filter @parampara/web exec playwright install chromium` once, then `pnpm --filter @parampara/web test:e2e`, and record the result and the `signed-in-my-name.png` screenshot from `apps/web/test-results/`.
- [x] Step 4 plan approved by the owner (2026-10-13; decisions D-043 to D-052).
- [ ] Step 4a `fm/para-mobile-shell` (in review): `apps/mobile` on Expo SDK 57 with `ClerkProvider` outside `ConvexClientProvider` (D-038), a home screen with the Convex `AuthLoading`, `Unauthenticated` and `Authenticated` states and no sign-in screen, a device-only token cache (D-047), validated public env, `requirePublicUrl` moved into `packages/validation` (D-048), `scripts/check.mjs` and `scripts/verify-export.mjs`, the manual `mobile-e2e.yml` signed-out smoke on both platforms (D-044), and the workflow-policy probe extended to every workflow file. Criteria: AC-1.10 to AC-1.16.
- [ ] Owner, before the first device run: set the repository variables `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` and `EXPO_PUBLIC_CONVEX_URL` (public values), then dispatch `mobile-e2e` on the 4a branch and record the result with its screenshots and device and OS versions.
- [ ] Step 4b `feat/para-mobile-auth`: email and password sign-in screen, sign-in link, session restore and sign-out on iOS and Android, with the live proof through a protected GitHub Environment (D-045, D-050). Criteria: AC-1.20 to AC-1.24.
- [ ] Wire Clerk to Convex on both clients; verify sign-in on web (done 2026-10-13), iOS simulator and Android emulator (step 4b).
- [ ] Before real users: mobile Device Trust and MFA handling (D-050); real app ids (D-051); revisit the iOS 17 minimum (D-046).
- [x] Set up formatter, linter, strict typecheck, and test runners; start the enforcement ledger (`docs/coding-standards.md`).
- [ ] Step 5 `chore/ci-required-checks`: make the CI job names (including `secrets` and `route-task`) required on `protect-main` and turn on repository-wide action SHA pinning (owner approval needed; D-037).
- [ ] Step 6 `chore/para-fallow` (PR #11): Fallow as a pinned devDependency with a non-blocking CI job (D-039, implemented as D-040).
- [x] Step 7 `docs/scope-feature-1`: documentation updated to match what steps 1 and 2 shipped (2026-10-12).
- [ ] Resolve data-residency open item before any real data.

### Verification
Step 1 tooling is covered by the enforcement probes in `packages/config/probes/` (see the ledger in `docs/coding-standards.md`).

Step 2 (2026-10-12):
- Automated, run locally: `pnpm run format`, `lint`, `typecheck`, `test` and `build` at the root all passed. `@parampara/backend` has 19 tests: `users.me` returns the name when signed in and null when signed out; another user, an identity with the same subject from a different issuer, and a forged argument naming another user never reach someone else's record; `auth.config.ts` refuses a missing or non-https `CLERK_JWT_ISSUER_DOMAIN`; and validation errors never contain the rejected value. Both denial tests were checked to fail when the guard is removed (an accepted argument, a missing signed-out check).
- Manual: none. Not run: the CI workflow (runs on the PR), a real Clerk sign-in against the Convex dev deployment (needs a client app, steps 3 and 4).

Step 6 (2026-10-12): Prettier check passed locally on `package.json`, `.fallowrc.json`, and `ci.yml`. No TypeScript changed, so ESLint did not apply. The `fallow` job has not run yet; its output is unverified until the PR's CI run.

Step 7, documentation only (2026-10-12):
- Automated, run locally in the worktree with the Turborepo cache bypassed, so nothing was replayed from a cached result: `lint`, `typecheck`, `test`, and `build` all passed. `@parampara/backend` 19 tests, `@parampara/config` 15 enforcement probes, and one test in each of `domain`, `kinship-engine`, and `validation`. `format` failed on one file, `.opencode/plugins/fm-busy-state.js`, which is untracked and is not part of this repository; every tracked source file passes `prettier --check`. That file is a local agent-harness artifact, so the failure is environmental. It was not added to `.prettierignore`, which would be a settings change outside this task.
- Manual: none. Not run: the CI workflow (runs on the PR), any Clerk or Convex sign-in (no client app yet).

Step 4a (2026-10-13, branch `fm/para-mobile-shell`):
- Automated, run locally on the owner's Intel Mac without any keys: `pnpm --filter @parampara/mobile run check` printed PASS for gates 1 to 8 (format, lint, typecheck, unit tests, both bundles, no secret in the bundle with the public URL inlined, `expo install --check` against the SDK 57 version map and `expo config`, and the whole-repo `test` and `build`) and exited 0. Root `lint`, `typecheck`, `test` and `build` also passed with the Turborepo cache bypassed. Test counts: `@parampara/mobile` 14 (public env validation that never echoes values; the device-only token cache, including "read failure deletes the item"), `@parampara/validation` 7 (`requirePublicUrl`, moved from web), `@parampara/web` 3, `@parampara/backend` 28, `@parampara/config` 15 probes (the workflow probe now reads every workflow file).
- Root `pnpm run format` passed after `.opencode` joined the other agent-tool folders (`.agents`, `.claude`, `.greptile`) in `.prettierignore`; before that it failed only on `.opencode/plugins/fm-busy-state.js`, the untracked harness file noted under Step 7. The check's format gate also limits Prettier to files git tracks or would track.
- Not run: the device smoke (`mobile-e2e.yml`, Maestro `signed-out.yaml` on an iOS simulator and an Android emulator). It needs the owner to set the repository variables `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` and `EXPO_PUBLIC_CONVEX_URL` and then dispatch it, so AC-1.14 is open and no native build has run anywhere yet. Not run: the CI workflow (runs on the PR) and any sign-in (Step 4b).
- Deliberate parity gaps for Step 4a: mobile has no sign-in link or screen yet (web has both); session restore, sign-out and the wrong-password message are mobile-only proofs planned for Step 4b. The UI is light-only and English-only until the styling and i18n approaches are chosen.
- Known risks for the first device run: the off-SDK native peers pulled in by `expo-router` (D-053) and the iOS 17 floor set by the `@clerk/expo` config plugin (D-046). Open privacy item: iOS keeps Keychain items after the app is deleted (D-047).

Step 3 (2026-10-12):
- Automated, run locally without any keys: `pnpm run format`, `lint`, `typecheck`, `test` and `build` at the root all passed. `@parampara/web` has 7 unit tests (public URL validation that never echoes values; the Playwright environment check and its skip message). `next build` succeeds with no environment set because every page renders per request. A build with a synthetic `CLERK_SECRET_KEY` sentinel found it nowhere in `.next/`, while the synthetic `NEXT_PUBLIC_CONVEX_URL` was inlined into the browser bundle as expected.
- Smoke check with synthetic keys (a Clerk key pointing at a reserved `.invalid` domain, not the owner's instance): `next start` served `/` and `/sign-in` with HTTP 200, the signed-out request carried `x-clerk-auth-status: signed-out`, the page rendered the loading state and a `noindex, nofollow` robots tag, and no `x-powered-by` header was sent.
- Not run at that time: the Playwright sign-in proof and its screenshot (needs the owner's Clerk dev keys, Convex dev URL and test user; without them all three tests skip with a message naming the missing variables), a signed-in browser check, and the CI workflow (runs on the PR).
- Live proof (2026-10-13, owner, from a clean `main` checkout): `pnpm --filter @parampara/web test:e2e` passed 3 of 3 tests: Clerk testing-token setup, a signed-out visitor sees the sign-in link and no name, and the signed-in test user sees their display name from the Convex `users.me` query. The screenshot `signed-in-my-name.png` is kept locally and is not committed.
- Settings the proof needed (no keys, URLs, emails, passwords or deployment names recorded here): the Clerk development instance had Device Trust (client trust) turned off for the password test user; the Clerk session token carries the claims `aud=convex` and `name={{user.full_name}}`; the Convex development deployment had its auth config pushed with `npx convex dev --once` run in `packages/backend`, and `CLERK_JWT_ISSUER_DOMAIN` set. Where `pnpm` is not on PATH, the repo's pinned version may need `npx -y pnpm@12.11.2`.

## Feature 2: identity, family groups, invitations

### Intended behavior
Members create or claim profiles, invite relatives by email or phone, state a claimed relationship, and allow the invitee to confirm or correct it. Pending members have limited access. Account verification is not proof of kinship. Nobody completes registration without a disclosed relationship confirmed by the other party: the invitee confirms the relation the inviter stated, or the inviter confirms the relation the invitee disclosed. Profiles created on someone's behalf require their phone or email so they can register through the invitation link. Required profile fields follow FR-02 (D-017).

### Checklist
- [ ] Define account lifecycle and family membership.
- [ ] Define secure invitation expiry, replay protection, and acceptance.
- [ ] Implement pending/verified/rejected relationship states.
- [ ] Test expired links, duplicate invitations, invitee rejection, and limited access.

## Feature 3: canonical person records and relationship graph

### Intended behavior
Each individual has one canonical person record. Relationships are separate records connecting people. Maternal and paternal paths and cousin-marriage overlaps must be preserved.

### Checklist
- [ ] Define person, name variants, relationship, claim, and provenance entities.
- [ ] Define duplicate candidates and reviewed merge workflow.
- [ ] Define graph traversal limits and cycle prevention where applicable.
- [ ] Test overlapping branches, duplicate imports, and graph consistency.

## Feature 4: kinship terminology

### Intended behavior
Calculate valid labels from the relationship graph. Use paternal-side preference as the default when multiple valid labels apply, unless a more specific user preference is set. Offer other valid labels. Support language, region, and family custom.

### Checklist
- [x] Define terminology catalogue and locale fallback (D-025: English and Telugu interface, general `te-IN` term catalogue, descriptive fallback; criteria in `docs/acceptance-criteria.md`).
- [ ] Keep labels separate from canonical relationship edges.
- [ ] Validate initial terminology with native speakers/families.
- [ ] Test alternate paths, missing terms, custom labels, and user preferences.

## Feature 5: relationship changes and approvals

### Intended behavior
Verified members can propose changes. Established parent-child and marriage relationships receive stricter review by close relatives. Reviewers must not approve their own proposal. All sensitive changes preserve old values, evidence, decisions, and timestamps.

### Checklist
- [x] Define eligibility for close and independent reviewers (D-023; criteria in `docs/acceptance-criteria.md`).
- [x] Define approval thresholds by change type (D-023).
- [ ] Define reject, request-evidence, dispute, and escalation paths.
- [ ] Test unauthorized approval and concurrent conflicting proposals.

## Feature 6: deceased profiles and historical evidence

### Intended behavior
Initial approval requires three eligible close relatives. With fewer than three eligible, two approvals plus reviewed documentary evidence suffice; with fewer than two, the profile stays pending (D-016). Documentary evidence takes precedence; where unavailable, multiple independent testimonies may support a claim. Uncertain information remains uncertain.

### Checklist
- [ ] Define field-level confidence/status.
- [x] Define reviewer eligibility and conflict-of-interest rules (D-023: core and extended relatives; proposer never counts).
- [ ] Restrict evidence to authorized reviewers.
- [ ] Test insufficient evidence, contradictory evidence, and unavailable reviewers.

## Feature 7: memories, stories, photos, audio

### Intended behavior
Personal memories represent the contributor's own experience. Historical stories make claims about people or events and can require review. Disputed versions may coexist during review. An unresolved story dispute moves to the contributor's private drafts after 60 days, subject to documented exceptions. Photos and audio inherit content permissions.

### Checklist
- [x] Define content types, authorship, access, and publication state (D-024 for story approval; criteria in `docs/acceptance-criteria.md`).
- [x] Define when the 60-day timer starts and who can resolve/extend it (D-026; criteria in `docs/acceptance-criteria.md`).
- [ ] Implement private media storage and revocable access.
- [ ] Test disputed-story expiry, contributor departure, and revoked media access.

## Feature 8: privacy, consent, and preservation

### Intended behavior
Phone numbers and exact addresses are private by default. City discovery is opt-in. Children have guardian-managed profiles. Archival copies are restricted and retained only under a documented policy, subject to applicable privacy and deletion obligations.

### Checklist
- [ ] Define backend authorization for every sensitive resource.
- [ ] Define consent capture and revocation.
- [ ] Define retention, account closure, backup expiry, and deletion workflows.
- [ ] Test direct API access, leaked/expired media links, and administrator boundaries.

## Feature 9: audio memories

### Intended behavior
Members can record or upload audio and associate it with a person, story, or event. Audio follows the same consent, visibility, retention, and deletion rules as other content.

### Checklist
- [ ] Define accepted formats, limits, and processing.
- [ ] Define playback authorization and metadata.
- [ ] Test upload failure, unauthorized playback, and deletion.

## Feature 10: city discovery

### Intended behavior
Members can opt into discovery by city or locality. Exact residential addresses are not exposed. Revoking consent removes the member from future discovery results.

### Checklist
- [ ] Define city/locality granularity.
- [ ] Define search and opt-in state.
- [ ] Test consent revocation and unauthorized location queries.

## Feature 11: spreadsheet import

### Intended behavior
Users can map columns, preview records, fix validation errors, review duplicate candidates, and import. Imported relationships remain unverified until their required verification workflow is completed.

### Checklist
- [ ] Define supported spreadsheet format and template.
- [ ] Define row-level validation and error export.
- [ ] Define duplicate review and rollback strategy.
- [ ] Test malformed files, partial failures, and unverified relationship preservation.

## Feature 12: release validation

### Checklist
- [ ] Verify critical workflows on web, Android, and iOS.
- [ ] Verify permissions with positive and negative tests.
- [ ] Verify migration and backup recovery.
- [ ] Complete independent adversarial review.
- [ ] Resolve all critical security, privacy, and data-integrity findings.
- [ ] Record manual checks, limitations, and release decision.

## Definition of done

A feature is complete only when:
- Its acceptance behavior is documented.
- Domain invariants and authorization are tested.
- Relevant automated checks have actually passed.
- Manual checks are recorded separately.
- Documentation and decision history are updated.
- No critical security, privacy, data-integrity, or migration issue remains.
