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
- Feature 0 tooling merged: harness verification and Firstmate tier-dispatch map (PR #3) and the `tools/route-task` Laya router with static fallback (PR #5). Remaining Feature 0 items are owner actions, a Greptile check, a re-probe of Antigravity, and free-model trials (the required CI checks on `protect-main` were applied in Step 5).
- Feature 1 in progress: step 1 (workspace tooling and CI) merged in PR #8; step 2 (`packages/backend`, the Convex auth backend) merged in PR #9 (D-031). Step 3 (`apps/web`, the web sign-in proof) merged in PR #12 (branch `feat/para-web-auth`); its live sign-in proof passed on 2026-10-13 against the Clerk and Convex dev instances. Step 4 (the Expo mobile app) was planned and approved on 2026-10-13 (D-043 to D-052) and split into 4a, the app shell that runs signed out (branch `fm/para-mobile-shell`, in review), and 4b, email and password sign-in with a live proof on both platforms (branch `feat/para-mobile-auth`, in review). The Step 4b live device proof passed on both platforms on 2026-10-23 (see Verification). Step 5 (required CI checks and action SHA pinning) was applied on 2026-10-25.
- Time-sensitive: Laya was free on Vercel AI Gateway only through 2026-10-31. Decided 2026-10-25 (D-067): static routing only, with no budget cap, no paid Laya, and no self-host; the router already falls back to static on 2026-11-01 unless `ROUTE_TASK_ENABLE_PAID_LAYA=true`.
- Owner live check of the Laya router (2026-10-12), reported by the owner and not re-run for this update: for the task 'Classify a docs update' it returned `routingPath: laya` with tier T1, while the static table gives D. This is an observation only; no routing rule or table was changed.

## At a glance

| # | Feature | Priority | Status |
|---|---|---|---|
| 0 | Agent tooling: Laya router, Greptile, CI | Foundation | In progress |
| 1 | Monorepo scaffold and architecture validation | Foundation | Partly done (docs, decisions, workspace tooling, CI, Convex auth backend) |
| 2 | Identity, family groups, invitations | P0 | Planned (decisions D-058 to D-066; F2-0 in review; F2-4 i18n and styling chosen in D-068) |
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
- [x] Confirm supported relationship types and constraints (D-058: direct types as typed edges, other terms as `kin_stated`, never free text).
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
- [x] Owner: AI Gateway budget cap and paid-Laya decision (2026-10-25, D-067): static routing only; no budget cap, no paid Laya, no self-host. No code change, because the router already defaults to static after 2026-10-31 unless `ROUTE_TASK_ENABLE_PAID_LAYA=true`.
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
- [x] Require the CI job names (now including `secrets` and `route-task`) in the `protect-main` ruleset and turn on repository-wide action SHA pinning (plan step 5; owner approval needed; open decision alongside D-037 and D-043).

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
- [ ] Shared step check `feat/para-step-check-scripts` (in review, D-054): generalized the Step 4a check into the repo-root runner `scripts/check.mjs` (format, lint, typecheck, tests, build, platform parity), kept `pnpm --filter @parampara/mobile run check` as the single mobile command now backed by the runner, added a `mobile-check` CI job, and recorded the `/goal` convention and the runner interface in `docs/checks.md`.
- [ ] Owner, before the first device run: set the repository variables `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` and `EXPO_PUBLIC_CONVEX_URL` (public values), then dispatch `mobile-e2e` on the 4a branch and record the result with its screenshots and device and OS versions.
- [ ] Owner, before the first Step 4b device run: create the protected GitHub Environment `mobile-e2e` (D-045) with a required reviewer and the synthetic Clerk test user's secrets `E2E_CLERK_USER_USERNAME`, `E2E_CLERK_USER_PASSWORD` and `E2E_CLERK_USER_NAME` (the same names as `apps/web/.env.example`; a Telugu-script name, D-052). Both `mobile-e2e` jobs reference it, so a dispatch waits for approval and fails loudly if the secrets are missing. Keep Device Trust off for that test user, as the web proof needed (Step 3 settings note).
- [ ] Step 4b `feat/para-mobile-auth` (in review): email and password sign-in on a custom Clerk Core 3 flow (`app/sign-in.tsx`) with a sign-in link on the signed-out home screen, session restore and sign-out on iOS and Android, a pure `lib/sign-in-state.ts` that maps Clerk status and errors to one fixed refusal message and one fixed "not supported yet" message (D-050; no Device Trust or MFA yet), Jest unit tests, and the live Maestro `sign-in.yaml` proof through the protected Environment (D-045). Criteria: AC-1.20 to AC-1.24.
- [ ] Wire Clerk to Convex on both clients; verify sign-in on web (done 2026-10-13), iOS simulator and Android emulator (step 4b).
- [ ] Before real users: mobile Device Trust and MFA handling (D-050); real app ids (D-051); revisit the iOS 17 minimum (D-046).
- [x] Set up formatter, linter, strict typecheck, and test runners; start the enforcement ledger (`docs/coding-standards.md`).
- [x] Step 5 `chore/ci-required-checks`: make the CI job names (including `secrets` and `route-task`) required on `protect-main` and turn on repository-wide action SHA pinning (owner approval needed; D-037).
- [x] Step 6 `chore/para-fallow` (PR #11): Fallow as a pinned devDependency with a non-blocking CI job (D-039, implemented as D-040).
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

Shared step check (2026-10-17, branch `feat/para-step-check-scripts`, D-054):
- Automated, run locally on the owner's Mac without any keys (pnpm was not on `PATH` there, so dependencies were installed with `npx -y pnpm@12.11.2 install --frozen-lockfile`): `pnpm --filter @parampara/mobile run check` printed PASS for all eight stages and exited 0 (format, lint, typecheck, unit tests, both bundles with no secret and the public URL inlined, `expo install --check` and `expo config`, whole-repo test and build), the same result and order as before the change. Repo default `pnpm run check` printed PASS for format, lint, typecheck, tests, build, and parity (the iOS and Android bundle export) and exited 0. `scripts/check.test.mjs` (3 tests, run by `pnpm test`) proves the runner runs every stage in order, keeps going after a failure, and fails only under `--strict` on a NOT RUN stage.
- Not run in the pipeline sandbox: it has no pnpm, so none of the green runs above were made there. Run there without tools, the check fails closed: every stage FAIL, device smoke NOT RUN, exit 1. The `mobile-check` job in `.github/workflows/ci.yml` re-runs the same mobile command on the PR.
- Not run: the CI `mobile-check` job (runs on the PR) and every NOT RUN stage (the web sign-in e2e needs the Clerk and Convex keys; the device smoke runs only in `mobile-e2e.yml`).

Step 4b, local only (2026-10-17, branch `feat/para-mobile-auth`):
- Automated, run locally without any keys: `pnpm --filter @parampara/mobile run lint` (ESLint, `--max-warnings 0`), `typecheck` (`tsc --noEmit`) and its Jest suites all passed: `@parampara/mobile` 24 tests (14 from Step 4a plus 10 for `lib/sign-in-state.ts`: required email and password, a loose email check, `signInView` completing only on `status === "complete"`, Device Trust and a second factor and an unknown future status each becoming the one "not supported yet" message, any refusal becoming the fixed message regardless of status, and the input's extra fields never reaching the rendered view), `@parampara/config` 15 enforcement probes (the workflow probe reads every workflow, so the two new `environment: mobile-e2e` jobs and their steps are covered), and `prettier --check` clean on every changed file.
- Not run: the live sign-in proof (`maestro/sign-in.yaml` via `mobile-e2e.yml` on an iOS simulator and an Android emulator). It needs the owner to create the protected `mobile-e2e` Environment with the three secrets (D-045) and dispatch the workflow, so AC-1.20 to AC-1.24 are open and no native build has run anywhere yet. Not run: the CI workflow (runs on the PR).

Step 4b, live device proof (2026-10-23, branch `feat/para-mobile-auth`, workflow `mobile-e2e`, protected Environment approved by the owner):
- iOS, run 39817315379: both flows passed on an iPhone 17 Pro simulator, iOS 26.5, Xcode 26.6, expo 57.0.27 (`signed-out` 42.6 s, `sign-in` 120.5 s). Two earlier failures were CI, not the app: the unsigned simulator build embedded no entitlements, so Clerk's native keychain access failed with -34018 (fixed by ad-hoc signing), and the Maestro driver did not start within its 15 s default (fixed with `MAESTRO_DRIVER_STARTUP_TIMEOUT`).
- Android, run 39940670331: both flows passed on an API 34 x86_64 emulator (AOSP image, 4 GB RAM, 4 cores), expo 57.0.27 (`signed-out` 6 s, `sign-in` 55 s), run through `reactivecircus/android-emulator-runner` (D-056). Earlier failures were CI: `adb` was not on PATH, the hand-built AVD was never created, and on the Google APIs image a "Pixel Launcher isn't responding" dialog covered the app (the app itself had reached the signed-out screen). The JUnit result files show 1 test and 0 failures per flow.
- Covered by `sign-in.yaml` on both platforms: sign-in and the name from `users.me` (AC-1.20), restore after a relaunch without clearing state (AC-1.21), sign-out (AC-1.22), and the fixed wrong-password message with no name shown (AC-1.23). `signed-out.yaml` covers AC-1.14. Evidence is the JUnit files and screenshots in the run artifacts; Maestro logs are never uploaded because they hold the typed credentials.
- Final re-run on the finished branch (2026-10-23, run 39946983293, after the review fix below): Android passed both flows (`signed-out` 7 s, `sign-in` 59 s) and iOS passed both flows (`signed-out` 1 m 39 s, `sign-in` 3 m 7 s). The iOS sign-in flow is slow and varies from run to run (120 s before, 187 s here); it passes, and was not investigated.
- Codex adversarial review (2026-10-23, `--base main`): verdict needs-attention with two findings in `app/sign-in.tsx`. Medium, thrown Clerk errors left the form busy: fixed by moving the submit sequence into `lib/submit-sign-in.ts` (any rejection becomes the one fixed error and unlocks the form) with 8 new unit tests; `@parampara/mobile` now has 34 tests. High, a possibly stale `signIn.status` after `signIn.password()`: not changed. The recommended fix is not possible because `password()` returns only `{ error }`, the code follows Clerk's documented custom-flow sequence, and both platforms pass the real sign-in; the risk is not proven impossible. A second Codex pass on the final diff has not been run.
- Further Codex passes (2026-10-23), each fixed and covered by tests: a stale `complete` status (the submit now proves the attempt started clean), a mount-time `signIn.reset()` rejection, concurrent taps (a synchronous re-entry lock), the Android script hiding a failed signed-out flow (`set -e`), the sign-in JUnit report possibly echoing credentials (left out of the uploaded artifacts; verified absent in run 39957888406), and an untrimmed email (one shared `normalizeEmail`). `@parampara/mobile` now has 46 tests. The last pass returned approve with no findings.
- Final device run on the finished code (2026-10-23, run 39957888406, commit `f786fa6`): Android and iOS both passed `signed-out` and `sign-in`; PR CI (build, fallow, format, lint, mobile-check, route-task, secrets, test, typecheck) green.
- Not run: AC-1.24 live (Device Trust or a second factor needs a Clerk user configured for it; the refusal mapping is unit-tested only). Not re-run for flakiness: each platform passed once on its final configuration. Open: the iOS `sign-in` flow takes about 120 s against 55 s on Android; it passes and was not investigated. Still to do: merge PR #19.
- The live proof's shape: one flow each platform, four screenshots each (sign-in form, name from `users.me`, name after a cold relaunch without clearing state, and a wrong password showing the fixed message and no name). The wrong-password step uses a deliberately wrong password against the real test user, so it exercises the same refusal path a family member would hit without needing a second account.

Step 3 (2026-10-12):
- Automated, run locally without any keys: `pnpm run format`, `lint`, `typecheck`, `test` and `build` at the root all passed. `@parampara/web` has 7 unit tests (public URL validation that never echoes values; the Playwright environment check and its skip message). `next build` succeeds with no environment set because every page renders per request. A build with a synthetic `CLERK_SECRET_KEY` sentinel found it nowhere in `.next/`, while the synthetic `NEXT_PUBLIC_CONVEX_URL` was inlined into the browser bundle as expected.
- Smoke check with synthetic keys (a Clerk key pointing at a reserved `.invalid` domain, not the owner's instance): `next start` served `/` and `/sign-in` with HTTP 200, the signed-out request carried `x-clerk-auth-status: signed-out`, the page rendered the loading state and a `noindex, nofollow` robots tag, and no `x-powered-by` header was sent.
- Not run at that time: the Playwright sign-in proof and its screenshot (needs the owner's Clerk dev keys, Convex dev URL and test user; without them all three tests skip with a message naming the missing variables), a signed-in browser check, and the CI workflow (runs on the PR).
- Live proof (2026-10-13, owner, from a clean `main` checkout): `pnpm --filter @parampara/web test:e2e` passed 3 of 3 tests: Clerk testing-token setup, a signed-out visitor sees the sign-in link and no name, and the signed-in test user sees their display name from the Convex `users.me` query. The screenshot `signed-in-my-name.png` is kept locally and is not committed.
- Settings the proof needed (no keys, URLs, emails, passwords or deployment names recorded here): the Clerk development instance had Device Trust (client trust) turned off for the password test user; the Clerk session token carries the claims `aud=convex` and `name={{user.full_name}}`; the Convex development deployment had its auth config pushed with `npx convex dev --once` run in `packages/backend`, and `CLERK_JWT_ISSUER_DOMAIN` set. Where `pnpm` is not on PATH, the repo's pinned version may need `npx -y pnpm@12.11.2`.

## Feature 2: identity, family groups, invitations

### Intended behavior
Members create or claim profiles, invite relatives by email (phone when available, D-060), state a claimed relationship, and allow the invitee to confirm or correct it. Pending members have limited access. Account verification is not proof of kinship. Nobody completes registration without a disclosed relationship confirmed by the other party: the invitee confirms the relation the inviter stated, or the inviter confirms the relation the invitee disclosed. Profiles created on someone's behalf require their email (phone when available) so they can register through the invitation link. Required profile fields follow FR-02 (D-017).

### Checklist
Plan approved by the owner on 2026-10-25 with all recommended defaults (D-058 to D-066). Four vertical slices, each working on web, iOS, and Android: 2a identity and my family group (F2-2 to F2-4), 2b invite and confirm (F2-5 to F2-8), 2c invite on behalf and claim (F2-9, F2-10), 2d hardening and release (F2-11). Every owner gate below returns to the owner for approval. Almost every step touches the security-sensitive list in `docs/model-routing.md`, so implementation uses paid models with a Codex review.

- [ ] F2-0 `feat/para-f2-0-decisions` (in review): decisions D-058 to D-066, these steps, the family group, membership, role, and invitation state diagrams in `docs/domain-model.md`, and the AC-2.06, AC-2.10, AC-2.11, AC-2.19 wording. Docs only. Owner gate 1; before approval Codex reads the stated-relationship edge model (D-058) against `relationship-domain-review`.
- [ ] F2-1 `feat/para-f2-1-domain-rules` (in review): pure domain rules in `packages/domain` and `packages/validation`: invitation and relationship state machines, who may confirm, stated-relationship validation against canonical term registry v1 (D-058), email normalization, token, expiry and limit policy as data, the pending-member capability matrix, and the single `can(actor, action, resource, context)` module in `packages/domain/src/permissions.ts`. Choices the decisions left open are recorded in D-069. Criteria: AC-2.10, 2.16 (policy), 2.22, 2.24 (policy), 2.25, 2.26, 2.29, 2.30.
- [ ] F2-2 additive schema and append-only audit events: `persons` with name variants, `privateProfiles`, `familyGroups`, `memberships`, `invitations`, minimal `relationshipEdges`, `auditEvents`, optional `personId` on `users`. Owner gate 2: regenerate `_generated/` (D-031).
- [ ] F2-3 account, profile, and group backend (slice 2a): `ensureUser`, account state derived from verified identity claims, self-registration profile, `createFamilyGroup` (D-059). Criteria: AC-2.01 to 2.05, 2.27, 2.28. Owner gate 3: Clerk JWT template email claims, mandatory email verification, regenerate `_generated/`.
- [ ] F2-4 sign-up, profile, and create-group screens on web and mobile, starting with the D-068 foundation: `@parampara/i18n` (en and te catalogs, with the Telugu catalog typed so a missing key fails typecheck) and `@parampara/tokens`, with Tailwind CSS v4 on web and `StyleSheet` on mobile. Owner gate 4: any new dependency.
- [ ] F2-5 invitation core backend (slice 2b, highest risk): create, preview, accept, correct, disclose, confirm, reject, resend; hashed tokens of at least 128 bits; email only (D-060); expiry and limits from config (D-061); different-email refusal (D-066). Criteria: AC-2.06 to 2.10, 2.14 to 2.26, 2.29 to 2.31. Owner gate 5: Codex adversarial review and regenerate `_generated/`.
- [ ] F2-6 email delivery through our own adapter (D-063). Owner gate 6: provider, sender domain, and keys set by the owner.
- [ ] F2-7 invite, accept, correct, disclose, and reject screens on web and mobile, and the pending-member home (AC-2.22).
- [ ] F2-8 two-user device proof on web, iOS, and Android. Owner gate 7: second synthetic Clerk user and the development deploy key as a protected Environment secret.
- [ ] F2-9 invite on behalf and claim backend (slice 2c, D-062). Criteria: AC-2.11 to 2.14. Owner gate 8: Codex adversarial review plus both review skills, regenerate `_generated/`.
- [ ] F2-10 on-behalf and claim screens and end-to-end tests on all three platforms.
- [ ] F2-11 hardening and release (slice 2d): registry test that every public Convex function has a declared policy and denial tests, attack sweep, parity check, mobile Device Trust and MFA (D-065), `adversarial-release-review`, `update-scope`. Owner gate 9: Codex adversarial review; no open critical or high finding.
- [ ] Before any real person is invited: data residency, retention policy, Device Trust and MFA (D-065), and real app ids (D-051). Until then every record is synthetic.

### Verification

F2-1, local only (2026-10-25, branch `feat/para-f2-1-domain-rules`):
- Automated, run locally without any keys: `pnpm --filter @parampara/domain test` (237 tests) and `typecheck`, `pnpm --filter @parampara/validation test` (38 tests), lint on both packages, and the root `pnpm run check`. Tests are table-driven and named by AC id, with denial cases first: signed out and unverified for every action, every action outside the pending-member capabilities, third-party and self confirmation, the wrong or unbound invitee account, expiry at the configured value, replay of a closed invitation, non-member and cross-group use, an administrator reading private details, a second active group (D-059), unsupported terms and variants, self-relationships, ancestor cycles, and graph-index projection of anything other than an accepted typed edge.
- The denial tests were checked to fail when a guard is removed: the pending-member gate (3 failures), third-party party resolution (11), an inviter confirming their own statement (3), and the second-active-group check (2).
- Not run: anything in Convex or on a client; F2-1 adds no backend function or screen. AC-2.22 to AC-2.26 are proven here on the policy side only; their backend proofs are F2-5 and F2-11.

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
