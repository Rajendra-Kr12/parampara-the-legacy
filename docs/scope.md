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
- Initial stack is not yet validated against a real Parampara repository. Candidate: Next.js + TypeScript for web, React Native + Expo for mobile, PostgreSQL, and a managed backend/auth/storage provider such as Supabase. Final selection requires repository inspection and a short architecture decision record.

## At a glance

| # | Feature | Priority | Status |
|---|---|---|---|
| 1 | Repository inspection and architecture decision | Foundation | Not started |
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

- [ ] Inspect current repository, runtime versions, package manager, existing files, test tools, CI, and agent configuration.
- [ ] Decide web/mobile monorepo strategy after inspecting the actual repository.
- [ ] Decide backend, authentication, storage, migrations, and hosting.
- [ ] Confirm supported relationship types and constraints.
- [ ] Define close-relative eligibility and the exception path when three eligible relatives are unavailable.
- [ ] Define review thresholds for new claims versus changes to established parent-child or marriage relationships.
- [ ] Define first-launch languages/regions for kinship terminology.
- [ ] Define profile and archival retention policy, including deletion requests and backups.

## Feature 1: repository inspection and architecture

### Intended slice
Understand the existing repository and establish a documented architecture before implementation.

### Checklist
- [ ] Inventory root files and feature folders.
- [ ] Read `CLAUDE.md`, `AGENTS.md`, scope, docs, skill definitions, package manifests, migrations, and CI configuration.
- [ ] Record existing versus proposed technologies.
- [ ] Produce `docs/architecture.md` and update this scope.
- [ ] Identify security, privacy, data integrity, and cost risks.
- [ ] Present plan and wait for approval before application-code changes.

### Verification
Not run. This pack is a documentation proposal, not a claim that a Parampara code repository has been inspected.

## Feature 2: identity, family groups, invitations

### Intended behavior
Members create or claim profiles, invite relatives by email or phone, state a claimed relationship, and allow the invitee to confirm or correct it. Pending members have limited access. Account verification is not proof of kinship.

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
- [ ] Define terminology catalogue and locale fallback.
- [ ] Keep labels separate from canonical relationship edges.
- [ ] Validate initial terminology with native speakers/families.
- [ ] Test alternate paths, missing terms, custom labels, and user preferences.

## Feature 5: relationship changes and approvals

### Intended behavior
Verified members can propose changes. Established parent-child and marriage relationships receive stricter review by close relatives. Reviewers must not approve their own proposal. All sensitive changes preserve old values, evidence, decisions, and timestamps.

### Checklist
- [ ] Define eligibility for close and independent reviewers.
- [ ] Define approval thresholds by change type.
- [ ] Define reject, request-evidence, dispute, and escalation paths.
- [ ] Test unauthorized approval and concurrent conflicting proposals.

## Feature 6: deceased profiles and historical evidence

### Intended behavior
Initial approval requires three eligible close relatives where available. If the threshold cannot be met, keep the profile pending unless an explicit, documented administrator exception is allowed. Documentary evidence takes precedence; where unavailable, multiple independent testimonies may support a claim. Uncertain information remains uncertain.

### Checklist
- [ ] Define field-level confidence/status.
- [ ] Define reviewer eligibility and conflict-of-interest rules.
- [ ] Restrict evidence to authorized reviewers.
- [ ] Test insufficient evidence, contradictory evidence, and unavailable reviewers.

## Feature 7: memories, stories, photos, audio

### Intended behavior
Personal memories represent the contributor's own experience. Historical stories make claims about people or events and can require review. Disputed versions may coexist during review. An unresolved story dispute moves to the contributor's private drafts after 60 days, subject to documented exceptions. Photos and audio inherit content permissions.

### Checklist
- [ ] Define content types, authorship, access, and publication state.
- [ ] Define when the 60-day timer starts and who can resolve/extend it.
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
