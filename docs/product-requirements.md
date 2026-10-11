# Product Requirements: Parampara

## 1. Product summary

Parampara, The Legacy, is a private family network for preserving family relationships, historical profiles, personal memories, stories, photos, audio recordings, and connections across generations. It supports maternal and paternal family branches, overlapping relationships, regional kinship terminology, and consent-based relative discovery.

## 2. Goals

- Preserve family legacy beyond marriages and across generations.
- Represent all valid relationship paths without duplicating people.
- Let members invite relatives and establish claimed relationships.
- Distinguish verified facts, uncertain claims, and disputed information.
- Preserve memories with clear authorship and privacy controls.
- Support Telugu and other Indian kinship conventions through locale-aware terminology.
- Help willing members discover relatives in the same city without exposing exact addresses.

## 3. Non-goals for the initial MVP

Unless explicitly approved later: public social networking, public family trees, matrimonial matching, public memorial pages, unrestricted cross-family people search, automatic AI adjudication of family disputes, and automatic publication of unverified relationships.

## 4. Target users

- Family member preserving stories or photos.
- Relative joining through an invitation.
- Family administrator responsible for membership and disputes.
- Reviewer assessing a historical claim or proposed correction.
- Guardian managing a minor's profile.
- Contributor importing an existing family tree.

## 5. MVP scope

The MVP includes family trees, invitations and verification, deceased profiles and evidence, memories and stories, photos, privacy controls, city discovery, audio memories, and spreadsheet import. Web, Android, and iOS are in scope for the initial release.

## 6. Functional requirements

### FR-01: Account and invitation
Members can register and manage an account. Invitations use a verified email or phone channel. The invitee must disclose or confirm a claimed relationship. An unverified claim does not become a verified relationship merely because an account exists.

### FR-02: Person profiles
A canonical person record supports names, name variants, approximate or exact birth information, living/deceased status, profile source, and field-level verification status. Required fields (D-017):
- Name: required.
- Date of birth: required; exact date, or year only when the exact date is unknown. Unknown dates are represented explicitly, never fabricated.
- Address: a living member registering themselves provides a current address, private to them by default. Profiles created by others and deceased profiles take a last known address. Only city/locality is ever shared, and only with discovery consent.
- Phone or email: required for any living person whose profile is created by someone else, so they receive an invitation link to register and verify.

### FR-03: Family graph
A person may connect to multiple family branches. Relationship edges are stored independently of a viewer's display label. The system preserves all valid maternal and paternal paths, including overlap caused by marriage between relatives.

### FR-04: Kinship labels
The system calculates supported kinship terms from relationship paths. When multiple labels are valid, paternal-side preference is the default unless the viewer selected another valid label. Labels are localized by language, region, and family custom. Changing the preferred label does not mutate relationship edges.

### FR-05: Relationship changes
Verified members can propose changes. Changes to established parent-child and marriage relationships require stricter review than low-risk profile edits. Reviewers cannot approve their own proposal. Old values and decisions remain auditable.

### FR-06: Deceased profiles
A deceased profile requires approval by three eligible close relatives. If fewer than three eligible relatives are available, two eligible approvals plus documentary evidence reviewed by those approvers is sufficient; with fewer than two, it remains pending (D-016). The proposer never counts as an approver. Documentary evidence is preferred; multiple independent testimonies may be used where documents are unavailable. Unresolved facts remain uncertain or disputed.

### FR-07: Memories and stories
A memory is a contributor's personal experience. A story may make historical claims about another person or event. Memories do not need approval. A story that names people or makes claims about family events the contributor did not experience needs approval under D-024 (for example, a story about a deceased grandfather is verified by 2 registered core relatives). A story about a family event must tag at least one subject (D-028), and one approver counts toward only one subject's rule (D-029). Multiple versions may coexist during dispute resolution. If a story dispute remains unresolved for 60 days, the contested story becomes the contributor's private draft unless a documented exception applies.

### FR-08: Media
Members can attach photos and audio recordings to people, memories, stories, or events. Media must use private storage and authorization-controlled access. Revoked access must invalidate future access, including signed-link expiry behavior.

### FR-09: City discovery
Members opt into city/locality discovery. Exact residential addresses are not shown. Revoking consent removes the member from future discovery results.

### FR-10: Import
Users can import a spreadsheet using a mapping and validation flow. They preview results, correct errors, and review duplicate candidates before committing. Imported relationship claims remain unverified.

### FR-11: Privacy and administration
The backend enforces visibility, reviewer eligibility, consent, and role permissions. Administrative status does not imply unrestricted access to private content. Sensitive actions produce audit events.

### FR-12: Preservation and deletion
Contributor authorship is preserved. Family-level archival rules may preserve approved material under restricted access, but retention is subject to a documented policy and applicable privacy/deletion obligations. Account closure and deletion requests must have defined outcomes.

## 7. Non-functional requirements

- Security: authorization at the server/data layer, least privilege, secure invitation tokens, protected media, secret management.
- Integrity: transactional writes for multi-record approval/change operations; validated migrations; duplicate and concurrency handling.
- Privacy: data minimization, purpose-limited collection, consent, restricted evidence access, retention/deletion controls.
- Accessibility: keyboard support, visible focus, screen-reader semantics, sufficient contrast, reduced-motion support.
- Reliability: backups and tested restoration; graceful behavior when external AI/model providers are unavailable.
- Performance: tree navigation and common profile views should remain usable on representative mobile devices and ordinary network connections. Define numeric budgets after baseline measurement.
- Localization: Unicode names and native scripts, locale-aware display, region/custom terminology, and future language expansion.
- Observability: log meaningful operational events without logging secrets, private story text, exact addresses, or evidence content unnecessarily.

## 8. Acceptance criteria

High-level criteria are below; testable per-feature criteria (Features 2 to 8) are in `docs/acceptance-criteria.md`.

- A person can be connected through maternal and paternal paths without duplicate identity.
- The UI presents multiple valid kinship labels and stores a viewer preference separately from the graph.
- Account, relationship, and historical verification have independent states.
- A disputed birth date remains uncertain until resolved with credible evidence.
- Deceased-profile approval records three eligible close-relative decisions, or two plus reviewed documentary evidence when fewer than three are eligible.
- A proposer cannot approve their own sensitive change.
- A story unresolved after the 60-day policy deadline is no longer visible to the wider family.
- Private contact information and exact addresses cannot be fetched by unauthorized users.
- Revoking city-discovery consent removes the member from discovery.
- Imported relationships do not become verified automatically.
- A revoked or expired media URL does not provide indefinite access.
- Every sensitive decision has an auditable actor, time, outcome, and provenance.

## 9. Success metrics

Track family activation, invitation acceptance, relationship verification rate, time to decision, sourced historical profile completeness, memory contribution, dispute resolution time, import success, privacy incidents, and returning-family retention. Establish numerical targets after a pilot rather than inventing targets before baseline data exists.

## 10. Open decisions

1. Resolved: close-relative eligibility and approval thresholds (D-023), story approval (D-024), first-launch languages and regional terminology (D-025), and story dispute timer and exceptions (D-026). Testable criteria are in `docs/acceptance-criteria.md`.
2. Resolved: see item 1 (new-relationship review in D-023).
3. Resolved: see item 1 (D-025).
4. Exact evidence-handling and retention periods.
5. Numeric performance targets and initial pilot scale.
6. Analytics and model-routing budget (hosting and storage decided in D-014, D-015).
7. Family friends and well-wishers (from the original brief): whether and how non-relatives join, and what they can see.
8. Data residency for Convex and R2 under India's DPDP Act.
