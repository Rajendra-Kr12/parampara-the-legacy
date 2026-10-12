# Acceptance Criteria: Features 2 to 8

Testable acceptance checklists for the P0 features in `docs/scope.md`, derived from `docs/product-requirements.md` (PRD), `docs/domain-model.md`, `docs/privacy-and-governance.md`, and `docs/decision-log.md`. A feature is not done until every criterion in its checklist has a passing automated test or a recorded manual check (see "Definition of done" in `docs/scope.md`).

This file states **what must be true**, not how it is built. Where a value is not yet decided (for example a retention period or a traversal limit), the criterion names the configured value and the test asserts against that configuration; it never invents a number.

## How to read this file

- Each criterion has an ID (`AC-<feature>.<nn>`) so tests, PRs, and reviews can cite it.
- Case tags:
  - `[P]` positive: the allowed path works.
  - `[F]` failure: invalid input or state is rejected cleanly, with no partial write.
  - `[A]` authorization denial: a caller without the right is refused **by the backend** (Convex function), tested by calling the function directly, not only through the UI.
  - `[R]` invalid relationship path: a graph or eligibility path that must not be accepted or counted.
- "Rejected" always means: no state change, no partial write, a safe user-facing error with no provider error text or internal path, and (for sensitive actions) an audit event of the refused attempt.
- "Denied" responses for private resources are indistinguishable from "not found", so a caller cannot probe whether a private record exists.
- Every test uses the synthetic fixture family below. Never real family data.
- Platform scope: every `[P]` criterion that has a user-facing flow is checked on web, iOS, and Android (skill `platform-parity-check`). Backend-only criteria are checked once against Convex.

## Synthetic fixture family

All names are invented. "Registered" means the person has an account and an accepted relationship into the family group.

| Person | Relationship to Kiran | Status |
|---|---|---|
| Venkata | Paternal grandfather | Deceased |
| Sarada | Paternal grandmother (Venkata's wife) | Living, registered |
| Ravi | Father (son of Venkata and Sarada) | Living, registered |
| Lakshmi | Mother (Ravi's wife) | Living, registered |
| Padma | Father's sister; also mother's brother's wife (married to Suresh) | Living, registered |
| Anil | Father's brother | Living, registered |
| Suresh | Mother's brother; also father's sister's husband (married to Padma) | Living, registered |
| Gopal | Maternal grandfather (Lakshmi's father) | Living, profile created by Lakshmi, not yet registered |
| Kamala | Maternal grandmother (Gopal's wife) | Deceased |
| Kiran | Primary test user (self), name variant కిరణ్ in Telugu script | Living, registered, family administrator of family group A |
| Meena | Kiran's daughter, minor | Guardian-managed by Kiran |
| Hari | Invited by Kiran as a cousin | Pending (invitation not yet confirmed) |
| Zed | No relationship to the family | Has an account, not a member |
| Bala | Administrator of a different family group B | Registered in family group B only |

The Padma and Suresh marriage is the overlap case: Padma is reachable from Kiran through the paternal path (father's sister) and the maternal path (mother's brother's wife), and Suresh likewise. Both paths are valid and must both be preserved.

## Shared definitions

### Verification dimensions (D-003)

Each is a separate state and is never collapsed into one `verified` flag:
- Account state: control of the email or phone (Clerk).
- Relationship state: `pending`, `accepted`, `rejected`, `disputed`, `superseded`.
- Historical-claim state per field: `unverified`, `verified`, `uncertain`, `disputed`.
- Content state: `draft`, `in_review`, `published`, `disputed`, `archived_restricted`.
- Profile lifecycle state: for deceased profiles `pending`, `approved`, `rejected`; it never erases field-level states.

### Close-relative eligibility

Decided in D-023. Relatives are counted from the subject's point of view:
- **Core relatives**: spouse or partner, parents, children, siblings (including half-siblings).
- **Extended relatives**: grandparents, grandchildren, parents' siblings, siblings' children, children's spouses.

| Claim type | Who may approve | Threshold |
|---|---|---|
| New relationship at invitation | The other party to the invitation only | 1 |
| Low-risk profile-field correction | The subject alone when living and registered; otherwise a core or extended relative | 1 |
| Change to an established parent-child edge | Every living, registered party to the edge, plus core relatives of either party | 2 in total, including every living registered party; a party's rejection blocks |
| Change to an established marriage or partner edge | Every living, registered spouse or partner, plus core relatives of either | 2 in total, including every living registered spouse; a spouse's rejection blocks |
| Uncertain historical claim | Core or extended relatives of the subject | 2, plus evidence under D-005 |
| Deceased profile | Core or extended relatives of the deceased; requests go to core relatives first | D-016: 3, or 2 plus reviewed documentary evidence |
| New edges connecting a new deceased profile (D-027) | Each living registered person on a proposed edge confirms their own edge | Accepted when the profile is approved (D-016 threshold met) |

In the fixture family, for Venkata: core relatives are Sarada, Ravi, Anil, and Padma; extended relatives include Kiran (grandchild), Lakshmi (son's wife), and Suresh (daughter's husband). For Kamala: core relatives are Gopal (not registered, so not yet eligible), Lakshmi, and Suresh; extended relatives include Kiran, Ravi, and Padma.

Rules for every claim type:
- Eligibility is computed server-side from stored data; a client-supplied reviewer list or eligibility flag is ignored.
- The proposer never counts as a reviewer for their own claim (AGENTS.md invariant). When the proposer is a party to the edge, their proposal stands as their consent but never counts toward the threshold; the living-party requirement then applies to the other parties.
- A reviewer has a verified account and is a registered member of the family group.
- A reviewer's own relationship to the subject must run only through `accepted` edges. A path that uses a `pending`, `rejected`, or `disputed` edge, or the very edge under review, does not make anyone eligible.
- A guardian-managed minor is never a reviewer.
- One person counts once per claim, however many paths connect them to the subject.

### Audit event

Every sensitive action writes an audit event in the same Convex mutation as the state change, with actor, time, action, target, outcome, and provenance (evidence references, previous value). Audit events never contain secrets, story text, exact addresses, or evidence content.

---

## Feature 2: identity, family groups, invitations

Sources: FR-01, FR-02, D-003, D-007, D-017; scope Feature 2.

### Registration and profile fields
- [ ] **AC-2.01** [P] A person who signs up with an email or phone that Clerk has verified gets account state `verified` and no relationship state at all; account verification creates no relationship.
- [ ] **AC-2.02** [P] A living person registering themselves can save a profile with name, date of birth, and current address. The address is visible only to them.
- [ ] **AC-2.03** [P] Date of birth accepts an exact date, or a year only when the exact date is unknown; a year-only value is stored with year precision and is displayed as a year, never as a made-up day and month.
- [ ] **AC-2.04** [F] Saving a self-registration profile without a name, without a date of birth (or year), or without a current address is rejected, with the missing field named.
- [ ] **AC-2.05** [P] Names are stored and displayed in Unicode, including Telugu script; a Telugu-script name and a Latin transliteration are stored as name variants of the same person (Kiran and కిరణ్).

### Invitations
- [ ] **AC-2.06** [P] A registered member can invite a relative by email or phone, either stating the claimed relationship or asking the invitee to disclose it. The invitation is `pending` and the invitee receives a link.
- [ ] **AC-2.07** [P] Inviter-states path: Kiran invites Hari as "cousin"; when Hari confirms, the relationship becomes `accepted` and Hari becomes a registered member.
- [ ] **AC-2.08** [P] Invitee-corrects path: Hari changes the stated relationship; the corrected claim goes back to Kiran, and only Kiran's confirmation makes it `accepted`.
- [ ] **AC-2.09** [P] Invitee-discloses path: the invitation carries no stated relationship; Hari discloses one; it becomes `accepted` only when Kiran confirms it.
- [ ] **AC-2.10** [F] Nobody completes registration into a family group without a disclosed relationship confirmed by the other party. An invitee who signs in but has not had a relationship confirmed stays a pending member.
- [ ] **AC-2.11** [P] A member creating a profile for a living person who cannot register themselves now (for example Gopal) must enter that person's phone or email; the system sends that contact an invitation link.
- [ ] **AC-2.12** [F] Creating a profile for a living person without a phone or email is rejected. (Deceased profiles follow Feature 6 and need no contact.)
- [ ] **AC-2.13** [P] When Gopal registers through the link, he claims the existing Gopal person record; no second person record is created.
- [ ] **AC-2.14** [P] Inviting a contact that already belongs to a registered account links the invitation to that account's existing person record and creates no duplicate.
- [ ] **AC-2.15** [P] The inviter sees the same response whether or not the contact already has an account, so invitations cannot be used to discover who is registered.

### Invitation token security
- [ ] **AC-2.16** [F] An expired invitation link is rejected with no state change; the inviter can send a fresh invitation. The expiry period is a configured value and the test uses that value.
- [ ] **AC-2.17** [F] A link that was already used is rejected on second use (replay protection), even by the same invitee.
- [ ] **AC-2.18** [F] A tampered or guessed token is rejected. Tokens have at least 128 bits of randomness and are stored hashed, never in plain text.
- [ ] **AC-2.19** [A] An invitation sent to one email or phone cannot be accepted by an account that has not verified that same email or phone.
- [ ] **AC-2.20** [F] Re-inviting the same contact to the same family group while an invitation is pending does not create a second pending invitation; it refreshes or resends the existing one.
- [ ] **AC-2.21** [P] The invitee can reject the invitation. The invitation becomes `rejected`, no relationship edge is created, the inviter is told it was declined, and an audit event is written.

### Pending members and access
- [ ] **AC-2.22** [P] A pending member (Hari before confirmation) can see their own profile, the pending invitation, and the inviter's display name, and nothing else in the family group.
- [ ] **AC-2.23** [A] A pending member calling the backend directly for the family tree, another person's profile, a story, a memory, media, contact details, or evidence is denied.
- [ ] **AC-2.24** [A] A pending member cannot send invitations, propose claims, or review anything.
- [ ] **AC-2.25** [A] A third party (for example Anil) cannot confirm or correct the relationship between Kiran and Hari; only the other party to the invitation can.
- [ ] **AC-2.26** [A] The inviter cannot confirm their own stated relationship on the invitee's behalf.
- [ ] **AC-2.27** [A] A non-member account (Zed) cannot invite anyone into family group A or read any of its data.
- [ ] **AC-2.28** [A] Roles are scoped per family group: Kiran's administrator role in family group A gives no rights in family group B, and Bala's gives none in A.

### Invalid relationship paths at invitation
- [ ] **AC-2.29** [R] A stated relationship that is not a supported relationship type is rejected.
- [ ] **AC-2.30** [R] A stated relationship that would make a person their own ancestor (for example Kiran states Hari is both her parent and her child, or a self-relationship) is rejected.
- [ ] **AC-2.31** [R] A stated relationship that conflicts with an established `accepted` relationship (for example a different father for Kiran than Ravi) is not accepted by the invitee's confirmation alone; it becomes a Feature 5 claim with the stricter review for parent-child changes.

---

## Feature 3: canonical person records and relationship graph

Sources: FR-02, FR-03, D-001; scope Feature 3; domain model.

### Canonical identity
- [ ] **AC-3.01** [P] Each real individual has exactly one person record. Name variants, scripts, and nicknames are stored as variants of that record, not as new people.
- [ ] **AC-3.02** [P] Relationships are stored as typed edges between person IDs (at minimum parent-child and spouse or partner), each with its own relationship state and provenance (who proposed it, when, from which source such as invitation, manual entry, or import).
- [ ] **AC-3.03** [P] No stored field holds "relation to the current user"; the same edges serve every viewer.

### Multiple paths and overlap
- [ ] **AC-3.04** [P] Querying paths from Kiran to Padma returns both the paternal path (Ravi's sister) and the maternal path (Lakshmi's brother Suresh's wife), and both point to the same Padma record.
- [ ] **AC-3.05** [P] Querying paths from Kiran to Suresh returns both the maternal path (Lakshmi's brother) and the paternal path (Padma's husband).
- [ ] **AC-3.06** [P] Adding the Padma and Suresh marriage edge does not change, merge, or remove any existing edge; it adds one edge.
- [ ] **AC-3.07** [P] Path queries stop at a configured traversal limit and return the paths found plus a "truncated" indicator; they never hang or error on a large family.

### Invalid graph changes
- [ ] **AC-3.08** [R] A self-edge (a person as their own parent or spouse) is rejected.
- [ ] **AC-3.09** [R] A parent-child edge that would create an ancestry cycle (for example making Venkata a child of Kiran) is rejected, and the graph is unchanged.
- [ ] **AC-3.10** [R] A spouse edge between a person and their own direct ancestor or descendant is rejected. (Marriage between cousins, including cross-cousins, is valid and accepted.)
- [ ] **AC-3.11** [F] A multi-edge change (for example adding a parent plus a sibling link) is one Convex mutation: if any edge fails validation, none is written.

### Duplicates and merge
- [ ] **AC-3.12** [P] Creating a person who matches an existing record on name variant plus birth year plus a shared relative raises a duplicate candidate for review; it does not merge automatically.
- [ ] **AC-3.13** [P] An approved merge keeps one record, re-points every edge, keeps all name variants, and records both original records' provenance; the merge can be traced in the audit history.
- [ ] **AC-3.14** [P] When merged records disagree on a field (for example two different birth years), the field becomes `disputed` with both values kept, not overwritten.
- [ ] **AC-3.15** [A] The member who proposed a merge cannot approve it.
- [ ] **AC-3.16** [R] A merge that would create a self-edge or an ancestry cycle (for example merging a person with their own parent) is rejected.
- [ ] **AC-3.17** [P] Importing the same family twice creates duplicate candidates for review, not a second silent set of people, and every imported edge stays unverified (`pending`).

### Access
- [ ] **AC-3.18** [A] A pending member or a non-member cannot create persons or edges, and cannot read the graph.
- [ ] **AC-3.19** [A] A member of family group B cannot read people or edges that exist only in family group A.
- [ ] **AC-3.20** [A] A rejected or pending edge is never returned to members other than the parties to it and its reviewers.

---

## Feature 4: kinship terminology and preferred labels

Sources: FR-04, D-002; scope Feature 4; domain model.

The specific terms below (for example Menatta for father's sister, Nanamma for father's mother) are illustrative. Every catalogue term is `unvalidated` until checked by native speakers (scope Feature 4).

### Calculation
- [ ] **AC-4.01** [P] The kinship engine returns labels computed from accepted graph paths plus the viewer's locale; labels are never read from a stored relation field.
- [ ] **AC-4.02** [P] For Kiran viewing Padma, the engine returns the paternal-path label (father's sister) and the maternal-path label (mother's brother's wife), each linked to its path.
- [ ] **AC-4.03** [P] With no viewer preference set, the default displayed label is the paternal-path label.
- [ ] **AC-4.04** [P] When two paths produce the same term, the UI shows the term once but both paths remain available on request.
- [ ] **AC-4.05** [P] The same viewer, target, and locale produce the same labels on web, iOS, Android, and in backend responses, because all use `packages/kinship-engine`.

### Viewer preference
- [ ] **AC-4.06** [P] Kiran can select the maternal-path label for Padma; it becomes Kiran's displayed label for Padma only.
- [ ] **AC-4.07** [P] Changing a preferred label creates, deletes, or modifies no relationship edge. The test compares the full edge set before and after.
- [ ] **AC-4.08** [P] Kiran's preference does not change what Ravi or any other viewer sees for Padma.
- [ ] **AC-4.09** [F] A preference for a label that is not valid for any path between the viewer and the target is rejected.
- [ ] **AC-4.10** [P] If a later graph change removes the path behind a saved preference, the display falls back to the default label and the preference is flagged stale, not silently kept.

### Locale, fallback, and custom labels
- [ ] **AC-4.11** [P] Each catalogue entry records language, script, region or cultural context, path pattern, term, optional explanation, source, and validation status.
- [ ] **AC-4.12** [P] When the requested locale has no validated term for a path, including when a term exists but is `unvalidated`, the engine falls back along a documented chain using only validated catalogue terms and finally to a plain descriptive phrase in the viewer's interface language (for example "father's sister's husband" in English, or its Telugu equivalent); it never returns an empty label, an unvalidated catalogue term, or a term for a different path.
- [ ] **AC-4.13** [P] A missing term is recorded as a catalogue gap for later review.
- [ ] **AC-4.14** [P] A family custom label is offered alongside the catalogue labels, marked as a family custom, and applies only inside that family group.
- [ ] **AC-4.15** [P] Newly added catalogue terms default to `unvalidated`.

### First-launch languages (D-025)
- [ ] **AC-4.16** [P] The interface is available in English and Telugu on web, iOS, and Android, and any member can switch between them at any time; the choice persists across sessions and devices.
- [ ] **AC-4.17** [P] Every user-facing string, including notifications, invitation emails or SMS, and error messages, exists in both languages; the build or CI fails when a translation key is missing in either language.
- [ ] **AC-4.18** [P] A new member's interface language defaults to Telugu when the device or browser language is Telugu, otherwise English.
- [ ] **AC-4.19** [P] Kinship terms come from the general Telugu catalogue (`te-IN`) and display in Telugu script, Latin transliteration, or both, as the viewer chooses (for example అత్త, Atta, or అత్త (Atta)); this choice is independent of the interface language.
- [ ] **AC-4.20** [P] A regional or household variant (for example a Telangana term) is added as a family custom label, offered alongside the catalogue term, and does not change the catalogue.
- [ ] **AC-4.21** [P] Telugu text renders correctly (conjuncts and vowel signs intact) in names, kinship terms, and interface strings on all three platforms, including in screen-reader output.
- [ ] **AC-4.22** [F] Switching interface language changes no relationship edge, no saved label preference, and no stored content.

### Invalid paths and privacy
- [ ] **AC-4.23** [R] Paths through `pending`, `rejected`, or `disputed` edges are not used for labels shown to anyone other than the parties to that edge.
- [ ] **AC-4.24** [R] For two people with no accepted path within the traversal limit, the engine returns "no known relationship", never a guessed term.
- [ ] **AC-4.25** [A] A viewer cannot obtain a label, or a path, for a person they are not allowed to see; the label response reveals no hidden person or edge.
- [ ] **AC-4.26** [P] `packages/kinship-engine` imports no UI, Convex, or provider code (checked by a dependency rule in CI).

---

## Feature 5: relationship claims, approvals, audit trail

Sources: FR-05, FR-11, D-003, D-005, D-010; scope Feature 5; domain model "Relationship claims and changes".

### Claims
- [ ] **AC-5.01** [P] A registered member can propose a claim: a new relationship, a change or removal of an established relationship, a profile-field correction, or a historical claim. The claim records subject, type, object, proposer, state, evidence references, reviewer decisions, timestamps, and resolution.
- [ ] **AC-5.02** [P] A proposed change never overwrites the current value. The old value stays in force and visible until the claim is approved; after approval the old value is kept in history.
- [ ] **AC-5.03** [P] Reviewers can approve, reject, request evidence, or dispute. Each decision is recorded separately with reviewer, time, and evidence references.

### Eligibility and thresholds per claim type
Eligible reviewers and thresholds per claim type follow the table in "Close-relative eligibility" above (D-023).

- [ ] **AC-5.04** [P] A claim reaches `accepted` only when the required number of eligible reviewers for its type have approved, and the approval, the state change, and the audit event are written in one Convex mutation.
- [ ] **AC-5.05** [P] A change to an established parent-child or marriage relationship requires 2 approvals including every living registered party, which is stricter than the single approval for a low-risk profile-field correction.

Field corrections:
- [ ] **AC-5.06** [P] Ravi proposes a correction to Kiran's birth year. It is accepted when Kiran approves, and only Kiran's decision counts.
- [ ] **AC-5.07** [A] For the same correction, an approval by Lakshmi (Kiran's core relative) is refused, because a living registered subject decides their own fields.
- [ ] **AC-5.08** [P] Kiran proposes a correction to Venkata's (deceased) name variant. It is accepted after one approval from a core or extended relative of Venkata, for example Sarada or Lakshmi.
- [ ] **AC-5.09** [P] Lakshmi proposes a correction to Gopal's (living, not registered) birth year. It is accepted after one approval from a core or extended relative of Gopal, for example Suresh.

Parent-child and marriage changes:
- [ ] **AC-5.10** [P] Anil proposes a change to the Padma and Suresh marriage edge. It is accepted only when both Padma and Suresh approve.
- [ ] **AC-5.11** [F] For the same change, if Padma rejects, the claim is `rejected` regardless of any other approvals, and the edge is unchanged.
- [ ] **AC-5.12** [F] For the same change, approvals from Ravi and Lakshmi (core relatives of the spouses) without Padma and Suresh leave the claim pending.
- [ ] **AC-5.13** [P] Ravi proposes a change to the Venkata (deceased) to Anil parent-child edge. It is accepted after Anil and one other core relative of either party (for example Sarada or Padma) approve.
- [ ] **AC-5.14** [F] For the same change, approvals from Sarada and Padma without Anil leave the claim pending, because Anil is a living registered party.
- [ ] **AC-5.15** [R] For the same change, Kiran's approval is refused: Kiran is an extended relative (grandchild) of Venkata, and edge changes accept only core relatives besides the parties.
- [ ] **AC-5.16** [A] Anil proposes a change to his own parent-child edge with Venkata. Anil's approval is refused (proposer), and the claim needs 2 approvals from core relatives of either party.
- [ ] **AC-5.17** [P] Lakshmi proposes a change to the Gopal (living, not registered) to Lakshmi parent-child edge. Gopal cannot approve until registered; the claim is accepted after 2 approvals from core relatives of either party other than Lakshmi (for example Suresh and Ravi), and Gopal is notified through the contact on file and can open a dispute after registering.

Historical claims:
- [ ] **AC-5.18** [P] A claim that Venkata was born in a given year is accepted after 2 approvals from core or extended relatives (Kiran counts) plus documentary evidence or multiple independent testimonies (D-005), and the birth-year field becomes `verified`.
- [ ] **AC-5.19** [F] The same claim with 2 approvals but no evidence stays `uncertain`.

Every claim type:
- [ ] **AC-5.20** [A] The proposer's approval of their own claim is refused and never counted.
- [ ] **AC-5.21** [A] An approval from an ineligible member (for example Zed, a pending member, a member of another family group, or a guardian-managed minor) is refused and never counted.
- [ ] **AC-5.22** [A] A family administrator who is not an eligible reviewer for the claim cannot approve it; administrator status alone gives no approval right.
- [ ] **AC-5.23** [A] An eligibility flag or reviewer list sent by the client is ignored; eligibility is recomputed on the server at decision time.
- [ ] **AC-5.24** [R] A reviewer whose only path to the subject runs through the edge under review is not eligible (for example, for a claim "Hari is Ravi's son", Hari's eligibility cannot come from that claimed edge).
- [ ] **AC-5.25** [R] A reviewer whose only path runs through a `pending`, `rejected`, or `disputed` edge is not eligible.
- [ ] **AC-5.26** [P] A reviewer reached through two paths (for example Padma through the paternal and maternal path) counts once.

### Reject, evidence, dispute, escalation
- [ ] **AC-5.27** [P] A rejection by a living registered party to the edge (or by the living registered subject of a field correction) makes the claim `rejected`. A rejection by any other eligible reviewer moves the claim to `disputed` for evidence or escalation (AC-5.29). In both cases the current value stays unchanged.
- [ ] **AC-5.28** [P] "Request evidence" pauses the claim, which stays pending, until evidence is attached or the proposer withdraws; evidence is visible only to the claim's eligible reviewers and the submitter.
- [ ] **AC-5.29** [P] A disputed claim can be escalated to a family administrator who is not a party to it; the administrator's resolution records the basis of the decision, and an administrator who is the proposer or the subject cannot resolve it.
- [ ] **AC-5.30** [P] Missing or disputed facts remain `uncertain` or `disputed`; no workflow turns them into `verified` without the required approvals or evidence.

### Concurrency and history
- [ ] **AC-5.31** [F] Two conflicting claims on the same relationship (for example two different proposed fathers for Kiran) cannot both be accepted; once one is accepted, the other is moved to `superseded` or back to review, never silently accepted.
- [ ] **AC-5.32** [F] Two reviewers approving at the same moment never push the count past the threshold twice or produce two audit records for one state change.
- [ ] **AC-5.33** [P] The audit history of a relationship shows every past value, claim, decision, reviewer, time, and evidence reference, and cannot be edited or deleted through any member-facing function.
- [ ] **AC-5.34** [A] An AI-generated suggestion cannot approve, reject, or change a claim; it can only be attached as a suggestion that a human acts on.
- [ ] **AC-5.35** [P] Imported relationships enter as `pending` claims and never become `accepted` without their workflow.

---

## Feature 6: deceased profiles and historical evidence

Sources: FR-02, FR-06, D-005, D-016, D-017; scope Feature 6; domain model "Deceased profiles" and "Evidence".

### Creating a deceased profile
- [ ] **AC-6.01** [P] A registered member can propose a deceased profile with name, birth information (exact date, year, or an approximate year marked as approximate), and a last known address. No phone or email is needed.
- [ ] **AC-6.02** [F] A deceased profile without a name is rejected.
- [ ] **AC-6.03** [P] A new deceased profile starts with profile state `pending` and is visible only to the proposer and its eligible reviewers until approved.
- [ ] **AC-6.04** [P] A proposed deceased profile that matches an existing person raises a duplicate candidate (AC-3.12) instead of creating a second record.
- [ ] **AC-6.05** [P] Marking an existing living person as deceased is a deceased-profile claim with the same threshold; it never takes effect on one member's say-so, and a registered member being marked is notified.

### Approval threshold (D-016)
- [ ] **AC-6.06** [P] With three or more eligible close relatives available, the profile becomes `approved` after three eligible approvals (for Venkata: for example Sarada, Ravi, and Anil).
- [ ] **AC-6.07** [P] With exactly two eligible close relatives available, the profile becomes `approved` after both approve and documentary evidence has been attached and each of the two approvers has recorded that they reviewed it.
- [ ] **AC-6.08** [F] With exactly two eligible available, two approvals without reviewed documentary evidence leave the profile `pending`.
- [ ] **AC-6.09** [F] With fewer than two eligible close relatives available, the profile stays `pending` whatever evidence is attached.
- [ ] **AC-6.10** [A] The proposer never counts as an approver, even if they are a close relative (if Ravi proposes Venkata, Ravi's approval is refused).
- [ ] **AC-6.11** [F] Two approvals from the same person count once.
- [ ] **AC-6.12** [P] Each approval is stored as its own record with reviewer, time, decision, and evidence references.
- [ ] **AC-6.13** [P] The number of eligible reviewers available is computed on the server at decision time; an approval reached under the two-plus-evidence rule stays approved if more relatives join later.
- [ ] **AC-6.14** [R] Eligibility for a deceased profile uses core and extended relatives of the deceased (D-023) through `accepted` edges, or through a connecting edge the reviewer confirmed themselves (D-027); a relative reachable only through someone else's pending edge is not counted as available or as an approver.
- [ ] **AC-6.15** [P] For Kamala, the registered core relatives are Lakshmi and Suresh (Gopal is not registered). With extended relatives Kiran, Ravi, and Padma also eligible, five are available, so the profile needs three approvals, and Kiran's approval counts toward them.
- [ ] **AC-6.16** [P] Review requests for a deceased profile go to its eligible core relatives first. Extended relatives may approve at any time, and are sent requests as well when fewer than three core relatives are eligible.

### Connecting a new deceased profile (D-027)
Worked example: Venkata has no profile yet. Ravi proposes Venkata's deceased profile together with four connecting edges: spouse of Sarada, and parent of Ravi, Anil, and Padma.

- [ ] **AC-6.17** [P] The claim stores the profile and its four proposed edges together, all `pending`; Sarada, Anil, and Padma are each asked to confirm their own edge, and Ravi's own edge stands on his proposal.
- [ ] **AC-6.18** [P] Sarada, Anil, and Padma each confirm their own edge and approve the profile. The D-016 threshold of three is met, and the profile becomes `approved` and all four edges become `accepted` in one Convex mutation with one audit event per decision.
- [ ] **AC-6.19** [F] If that final mutation fails, the profile is not approved and no edge is accepted.
- [ ] **AC-6.20** [R] Anil's approval of the profile does not count until he has confirmed his own edge; before that, he has no accepted path to Venkata.
- [ ] **AC-6.21** [R] Kiran is not eligible while the claim is pending: Kiran's only path to Venkata runs through Ravi's proposed edge, which Kiran did not confirm and which is not yet accepted.
- [ ] **AC-6.22** [A] Ravi cannot confirm an edge on behalf of Sarada, Anil, or Padma, and his own approval of the profile is refused.
- [ ] **AC-6.23** [F] Anil rejects his edge. That edge is not created, Anil gains no eligibility through it, and the claim continues with the remaining edges; with only Sarada and Padma eligible, the profile needs both approvals plus reviewed documentary evidence (D-016).
- [ ] **AC-6.24** [F] If fewer than two people named on proposed edges confirm, and no other eligible relative exists through accepted edges, the profile and its edges stay `pending`.
- [ ] **AC-6.25** [P] A proposed edge to a living person who is not registered (for example Gopal) does not block the profile; it stays `pending` after the profile is approved, until that person registers and confirms it.

### Field-level status and evidence
- [ ] **AC-6.26** [P] Every historical field (for example birth date, death date, birthplace) carries its own status: `unverified`, `verified`, `uncertain`, or `disputed`; profile approval does not mark every field verified.
- [ ] **AC-6.27** [P] Two conflicting birth dates leave the birth-date field `disputed` with both values and their evidence kept; the rest of the profile is unaffected.
- [ ] **AC-6.28** [P] A field becomes `verified` from documentary evidence reviewed by eligible reviewers, or from multiple independent testimonies when documents are unavailable (D-005); otherwise it stays `uncertain`.
- [ ] **AC-6.29** [P] Testimonies count as independent only when given by different people; one person submitting two testimonies counts once.
- [ ] **AC-6.30** [P] An uploaded document is recorded as evidence to assess; uploading it does not change any field status by itself.
- [ ] **AC-6.31** [A] Evidence files and testimony text are readable only by the claim's eligible reviewers and the submitter; other members, including a family administrator who is not a reviewer, are denied through the API and through media URLs.
- [ ] **AC-6.32** [P] An administrator resolving an escalated historical claim records the basis of the decision, and the record is kept in the audit history.

---

## Feature 7: memories, stories, photos, audio, dispute workflow

Sources: FR-07, FR-08, FR-12, D-006, D-008; scope Feature 7; domain model "Memories and stories".

### Content types and states
- [ ] **AC-7.01** [P] A contributor can create a memory (their own experience) or a story (a narrative making claims about other people or events). Both start as `draft`, visible only to the contributor.
- [ ] **AC-7.02** [P] A memory is published to the audience the contributor chooses without any approval step.
- [ ] **AC-7.03** [P] Authorship is preserved: the contributor is recorded on the content and every version and cannot be changed by another member.
- [ ] **AC-7.04** [P] Before first publication, the contributor is shown the family preservation rules (FR-12) and the acknowledgement is recorded.

### Story approval
Decided in D-024, using the eligibility circles of D-023:

| Content | Approval needed |
|---|---|
| Memory (the contributor's own experience), even when other people appear | None |
| Story about a living, registered adult subject | The subject alone (1) |
| Story about a deceased or not-registered subject | 2 registered core relatives of the subject; extended relatives fill in when fewer than 2 core relatives are eligible |
| Story about a minor | The minor's guardian |
| Story with several subjects | Every subject's rule is met |

A story is content that names one or more people (its subjects) or makes historical claims about a family event the contributor did not experience. A story about a family event must tag at least one subject, the person or people the event concerns (D-028). The contributor is never counted, and one person's approval counts toward only one subject's rule (D-029): an approver who is both a subject and a core relative of another subject satisfies only one of those rules.

- [ ] **AC-7.05** [P] A story that requires approval moves `draft` to `in_review` on submission, is visible only to the contributor and its eligible reviewers while in review, and is published only when its approval rule is met.
- [ ] **AC-7.06** [A] The contributor cannot approve their own story.
- [ ] **AC-7.07** [A] A member who is not an eligible reviewer for the story cannot read it while it is `in_review` or approve it.
- [ ] **AC-7.08** [R] A reviewer whose only path to the story's subject runs through a `pending`, `rejected`, or `disputed` edge is not eligible.
- [ ] **AC-7.09** [P] Ravi publishes a memory of time spent with Venkata. It is published to Ravi's chosen audience with no approval step.
- [ ] **AC-7.10** [P] Kiran submits a story about Padma (living, registered). It is published when Padma approves.
- [ ] **AC-7.11** [A] For the same story, an approval by Suresh (Padma's spouse) is refused; only Padma decides a story about herself.
- [ ] **AC-7.12** [P] Ravi submits a story about Venkata (deceased). It is published after 2 approvals from Venkata's registered core relatives other than Ravi (for example Sarada and Anil).
- [ ] **AC-7.13** [F] For the same story, one core approval leaves it `in_review`.
- [ ] **AC-7.14** [R] For the same story, Kiran's approval is refused: Kiran is an extended relative, and Venkata has at least 2 eligible core relatives (Sarada, Anil, Padma).
- [ ] **AC-7.15** [P] Lakshmi submits a story about Kamala (deceased). Kamala's only eligible core relative is Suresh (Lakshmi is the contributor and Gopal is not registered), so the story is published after Suresh and one extended relative (for example Kiran) approve.
- [ ] **AC-7.16** [P] Kiran submits a story about Gopal (living, not registered). It is published after 2 approvals from his registered core relatives (Lakshmi and Suresh).
- [ ] **AC-7.17** [P] Ravi submits a story about Meena (a minor). It is published when Kiran, Meena's guardian, approves.
- [ ] **AC-7.18** [P] Kiran submits a story about both Venkata and Padma. It is published only when Padma approves as subject and 2 other core relatives of Venkata approve; Padma's approval does not also count as one of Venkata's 2 (D-029).
- [ ] **AC-7.19** [F] A story about a deceased or unregistered adult subject with fewer than 2 eligible relatives in total stays `in_review`; the contributor can withdraw it to drafts at any time.
- [ ] **AC-7.20** [P] Kiran publishes an untagged memory that makes claims about Venkata. Anil, an eligible reviewer for Venkata, flags it; it moves to `in_review` under the story rules for Venkata and is hidden from the wider family until approved.
- [ ] **AC-7.21** [A] A member who is not an eligible reviewer for any person in the content (for example Zed, or Hari while pending) cannot flag it.
- [ ] **AC-7.22** [P] A rejection by any eligible reviewer of a story moves it to `disputed` and starts the dispute workflow below.

Event stories (D-028):
- [ ] **AC-7.23** [F] Submitting a story with no tagged subject is rejected, with a message asking the contributor to tag the person or people the event concerns, or to save it as a memory if it is their own experience.
- [ ] **AC-7.24** [P] Kiran submits a story about the ancestral home being destroyed in a flood, tagged with Venkata as head of the household at the time. It follows the D-024 rule for Venkata (2 approvals from his registered core relatives).
- [ ] **AC-7.25** [P] An event story tagged with Venkata and Sarada is published only when Sarada approves as a living registered subject and 2 core relatives of Venkata other than Sarada approve (for example Anil and Padma), 3 approvals in total (D-029).
- [ ] **AC-7.26** [F] For the same story, Sarada plus only one other core relative of Venkata leaves it `in_review`; Sarada's approval does not count as one of Venkata's 2. With Sarada, Anil, and Padma all approving, it is published.
- [ ] **AC-7.27** [P] Ravi, who lived through the flood, records it as a memory of his own experience; it needs no approval.
- [ ] **AC-7.28** [P] Changing the tagged subjects of a story that is in review or published restarts review under the new subject set.
- [ ] **AC-7.29** [F] Removing the last tagged subject from a submitted story is rejected.

### Disputes and the 60-day rule
Decided in D-026 (filling in D-006). Worked example: Ravi's published story about Venkata (approved by Sarada and Anil) is disputed by Padma. Its eligible reviewers are Venkata's core relatives other than Ravi: Sarada, Anil, and Padma. Kiran is the family administrator.

Who can see a story while it is disputed:

| Person | Sees the disputed story and its versions |
|---|---|
| Contributor (Ravi) | Yes |
| Every member who disputed it (Padma) | Yes |
| The story's eligible reviewers under D-024 (Sarada, Anil) | Yes |
| Living, registered subjects, and a minor subject's guardian | Yes |
| A family administrator who is not a party, once the dispute is escalated to them | Yes, from escalation until resolution |
| Any other administrator (Kiran before escalation), and everyone else in the story's audience (Lakshmi, Suresh) | No |

Opening a dispute:
- [ ] **AC-7.30** [P] An eligible reviewer of the story can open a dispute on a story that is in review or published, and may attach an alternative version; the original and alternative versions are linked while the dispute is open.
- [ ] **AC-7.31** [P] When Padma opens the dispute, in the same Convex mutation the story becomes `disputed`, the timer starts, and the story and its versions are hidden from everyone not listed as "Yes" in the table above.
- [ ] **AC-7.32** [A] While the dispute is open, Lakshmi, Suresh, and Kiran (administrator, not escalated) are denied the story, its versions, and the dispute record through every query and every media path; no signed URL is issued for its photos or audio.
- [ ] **AC-7.33** [P] When Anil disputes Kiran's story about Venkata and Padma (AC-7.18), Padma can still see it as a living registered subject; for a disputed story about Meena, Kiran can still see it as her guardian.
- [ ] **AC-7.34** [A] A member who is not an eligible reviewer of the story (for example Kiran for the story about Venkata, as an extended relative where enough core relatives exist, or Zed) cannot open a dispute.
- [ ] **AC-7.35** [F] A member who already has an open dispute on a story cannot open a second one on the same story.

Timer:
- [ ] **AC-7.36** [P] The deadline is the dispute-opening time plus 60 days, computed and stored on the server; a client-supplied time is ignored.
- [ ] **AC-7.37** [P] Anil opens a second dispute on day 10. It joins the existing dispute and the deadline does not change.
- [ ] **AC-7.38** [P] The contributor, the disputers, and the eligible reviewers are notified when the dispute opens, at day 30, 7 days before the deadline, and at expiry. Email and SMS notifications contain no story text.

Resolution:
- [ ] **AC-7.39** [P] When every disputing member withdraws, the dispute ends, the timer stops, and the story returns to the state and audience it had before the dispute.
- [ ] **AC-7.40** [P] Ravi edits the story; Padma and Anil both accept the edited version; and the edited version meets the D-024 rule (2 core approvals for Venkata). The story is published to its audience as the edited version, with the earlier version kept in history.
- [ ] **AC-7.41** [F] If only Padma accepts the edited version and Anil does not, the dispute stays open and the story stays hidden.
- [ ] **AC-7.42** [P] Ravi escalates the dispute to Kiran, who is not a party. Kiran can then read the story, its versions, and the dispute record, and can resolve it (publish a version or move the story to drafts), recording the basis. Kiran's access ends when the dispute is resolved.
- [ ] **AC-7.43** [A] An administrator who is the contributor, a disputer, or a subject of the story cannot receive the escalation, resolve the dispute, or extend it.
- [ ] **AC-7.44** [P] A new dispute opened after an earlier one was resolved starts a new 60-day timer.

Extension:
- [ ] **AC-7.45** [P] Before the deadline, a family administrator who is not a party can extend the dispute once, by up to 30 days, with a recorded reason; the new deadline is stored and everyone in AC-7.38 is notified.
- [ ] **AC-7.46** [F] A second extension, an extension longer than 30 days, an extension without a reason, and an extension requested after the deadline are all rejected.
- [ ] **AC-7.47** [A] A member who is not a family administrator cannot extend a dispute.

Expiry and exceptions:
- [ ] **AC-7.48** [P] If the dispute is still unresolved at the deadline, the story moves to the contributor's private drafts: only the contributor can see it, and disputers, reviewers, subjects, and administrators lose access (PRD acceptance criterion).
- [ ] **AC-7.49** [P] The expiry move is performed by a scheduled backend job, not by a client, and happens even if no one opens the app; it writes an audit event.
- [ ] **AC-7.50** [P] Moving a story to drafts does not delete it, its versions, or the dispute record.
- [ ] **AC-7.51** [A] The dispute deadline cannot be changed or skipped by a client request; only the extension path in AC-7.45 changes it.
- [ ] **AC-7.52** [P] A story under legal hold is not moved at the deadline; it stays hidden in its current state until the hold is lifted, and the hold and its release are audited.
- [ ] **AC-7.53** [P] If the contributor has closed their account or died before the deadline, the unresolved story moves to `archived_restricted` under the preservation policy instead of to drafts.

### Media
- [ ] **AC-7.54** [P] Photos and audio can be attached to a person, memory, story, or event, and inherit the access rules of what they are attached to.
- [ ] **AC-7.55** [P] Media is stored privately; a member allowed to see the content gets a short-lived signed URL issued after a server-side authorization check.
- [ ] **AC-7.56** [A] A member not allowed to see the content gets no signed URL, and a direct, unsigned object URL returns access denied.
- [ ] **AC-7.57** [A] After access is revoked (content unpublished, hidden by a dispute, moved to drafts, or the member removed), no new signed URL is issued, and any URL issued earlier stops working by its configured expiry time.
- [ ] **AC-7.58** [F] An upload with a disallowed file type or above the configured size limit is rejected with no stored object and no metadata record.
- [ ] **AC-7.59** [F] An interrupted upload leaves no orphaned metadata record visible to members.

---

## Feature 8: privacy, consent, access control, retention

Sources: FR-08, FR-09, FR-11, FR-12, D-007, D-008, D-017; scope Feature 8; privacy and governance doc.

### Private by default
- [ ] **AC-8.01** [A] Unshared phone numbers and email addresses, and exact addresses under any setting, are returned only to that member (and their guardian, for a minor). Every other caller, including a family administrator, is denied through every query and every export path. Explicitly shared phone numbers and email addresses follow AC-8.02.
- [ ] **AC-8.02** [P] A member can explicitly share their phone or email with their family group; after consent, members of that group can see it, and members of other groups cannot.
- [ ] **AC-8.03** [P] Revoking that consent removes the contact detail from every later query and response; no cached copy is served after revocation.
- [ ] **AC-8.04** [P] Exact addresses are never shown to other members under any setting; at most city or locality is shared, and only with discovery consent.
- [ ] **AC-8.05** [P] City discovery is off by default; an opted-in member appears in discovery results by city or locality only, and after revoking consent no longer appears in any later result (details in Feature 10).

### Consent records
- [ ] **AC-8.06** [P] Each consent stores subject, purpose, scope, granted state, timestamp, source, and revocation time.
- [ ] **AC-8.07** [A] Consent can be granted or revoked only by the subject (or their guardian for a minor); another member or an administrator cannot grant it on their behalf.

### Children
- [ ] **AC-8.08** [P] A minor's profile is guardian-managed: the guardian (Kiran for Meena) creates and edits it, and every guardian action is audited.
- [ ] **AC-8.09** [A] A minor's profile, media, and stories about the minor are not visible beyond the minor's guardians and the audience the guardian chooses.
- [ ] **AC-8.10** [A] A minor cannot be a reviewer, cannot consent to discovery, and is never listed in city discovery.
- [ ] **AC-8.11** [P] No contact details are collected for a minor unless the guardian provides them for a stated purpose.

### Administrator boundaries
- [ ] **AC-8.12** [A] A family administrator cannot read another member's drafts, private memories, contact details, exact address, or evidence unless they are independently authorized for that item (for example as an eligible reviewer).
- [ ] **AC-8.13** [A] An administrator of family group B (Bala) has no administrative or read rights in family group A.
- [ ] **AC-8.14** [P] Every administrative action writes an audit event.

### Backend enforcement
- [ ] **AC-8.15** [A] Every public Convex query, mutation, and action rejects a caller with no valid Clerk identity.
- [ ] **AC-8.16** [A] Calling any function directly with another person's ID (bypassing the UI) returns only what the caller is authorized to see; a private record returns the same response as a missing one.
- [ ] **AC-8.17** [A] A leaked signed media URL stops working after its configured expiry; a URL issued for one object cannot be altered to reach another object.
- [ ] **AC-8.18** [F] Error messages shown to users contain no provider error text, stack traces, internal paths, or other members' data.
- [ ] **AC-8.19** [P] Operational logs contain no secrets, story text, exact addresses, contact details, or evidence content.

### Retention, closure, and deletion
The retention periods and archival rules are an open PRD decision (PRD section 10, item 4). These criteria hold for whatever periods are chosen; tests read the periods from configuration.

- [ ] **AC-8.20** [P] The account-closure flow tells the member, before they confirm, what will be deleted, what may be kept under the family archival policy, and for how long.
- [ ] **AC-8.21** [P] After a deletion request completes, the deleted content and media are not returned by any API or media URL, and the deletion is recorded by an audit event that keeps actor, time, and outcome but not the content.
- [ ] **AC-8.22** [P] Content kept under the archival policy is `archived_restricted`: readable only by the roles the policy names, never published, and kept no longer than the configured period.
- [ ] **AC-8.23** [P] Backups expire after the configured backup retention period, and a restore test shows that content deleted before the backup expired is deleted again after restore.
- [ ] **AC-8.24** [P] A closed account's authorship stays attributed on retained content, without exposing the closed account's contact details.

---

## Traceability to the PRD acceptance criteria

| PRD section 8 criterion | Covered by |
|---|---|
| Maternal and paternal paths without duplicate identity | AC-3.01, AC-3.04, AC-3.05, AC-3.06 |
| Multiple valid kinship labels; preference stored separately | AC-4.02, AC-4.03, AC-4.06, AC-4.07 |
| Independent account, relationship, historical states | AC-2.01, AC-5.30, AC-6.26 |
| Disputed birth date stays uncertain until resolved | AC-3.14, AC-6.27, AC-6.28 |
| Deceased approval: three, or two plus reviewed evidence | AC-6.06 to AC-6.10 |
| Proposer cannot approve own sensitive change | AC-3.15, AC-5.20, AC-6.10, AC-7.06 |
| Story unresolved after 60 days not visible to wider family | AC-7.31, AC-7.48, AC-7.49 |
| Private contact info and addresses not fetchable | AC-8.01, AC-8.04, AC-8.16 |
| Revoking city-discovery consent removes from discovery | AC-8.05 (Feature 10 adds detail) |
| Imported relationships not verified automatically | AC-3.17, AC-5.35 |
| Revoked or expired media URL gives no indefinite access | AC-7.57, AC-8.17 |
| Every sensitive decision auditable | Shared "Audit event" definition, AC-5.33, AC-6.12, AC-8.14 |

## Decisions reflected in this file

| Decision | Covered by |
|---|---|
| D-023 close-relative eligibility per claim type | "Close-relative eligibility", AC-5.04 to AC-5.27, AC-6.14 to AC-6.16 |
| D-024 which stories need approval, and by whom | "Story approval", AC-7.05 to AC-7.22 |
| D-025 first-launch languages | AC-4.12, AC-4.16 to AC-4.22 |
| D-026 story dispute timer rules | "Disputes and the 60-day rule", AC-7.30 to AC-7.53, AC-7.57 |
| D-027 connecting a new deceased profile | "Close-relative eligibility", AC-6.14, AC-6.17 to AC-6.25 |
| D-028 event stories must tag a subject | "Story approval", AC-7.23 to AC-7.29 |
| D-029 no double counting of one approver across subjects | "Story approval", AC-7.18, AC-7.25, AC-7.26 |

Audio-specific rules (Feature 9), city-discovery search (Feature 10), and spreadsheet import (Feature 11) get their own checklists when those features are planned.
