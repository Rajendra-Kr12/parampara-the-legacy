# Domain Model: People, Relationships, Kinship, Verification

## Canonical identity

`Person` represents one real individual. Names, name variants, relationships, memories, and evidence are related records, not reasons to create duplicate people. Duplicate resolution must be reviewed and preserve provenance.

## Relationship graph

Store relationships as typed edges between canonical person IDs. The model must support parent-child and spouse/partner edges and leave room for other explicitly supported relationship types. Do not store only `relation_to_current_user`, because the same person has different relations from different viewpoints.

All valid paths must remain available. A marriage between relatives can cause a person to be related through maternal and paternal branches at once; this is legitimate, not necessarily a data error.

## Kinship terminology

Kinship terms are derived from graph paths plus locale/custom configuration. The default display preference favors the paternal-side label when several valid labels apply, unless the viewer has chosen another valid label. The preferred label is a presentation setting, never the source of truth for the graph.

Terminology records should support:
- language and script
- region or cultural context
- relationship-path pattern
- term and optional explanatory text
- source/reviewer and validation status
- fallback behavior when no term is known
- user-selected preferred label

The initial term catalogue needs validation by native speakers and families. Do not assume one Telugu vocabulary is universal across regions or households.

## Independent verification dimensions

- Account: control of email/phone or identity provider.
- Relationship: whether a claimed connection is accepted.
- Historical claim: evidence status for a field or assertion.
- Content: whether a story is approved for family publication.
- Profile: overall lifecycle status, which must not erase field-level uncertainty.

## Relationship claims and changes

A claim has a subject, predicate/type, object, proposer, state, evidence references, reviewer decisions, timestamps, and resolution. Sensitive changes preserve previous values and must not be overwritten silently.

Close-relative reviewers should be eligible for the claim being reviewed. Proposers cannot approve their own changes. Define separate thresholds for:
- a newly invited person's self-confirmed relationship
- a low-risk profile-field correction
- a change to an established parent-child relationship
- a change to an established marriage/partner relationship
- an uncertain historical claim

## Deceased profiles

Initial approval requires three eligible close relatives. If fewer than three eligible reviewers exist, two eligible approvals plus documentary evidence reviewed by those approvers is sufficient; with fewer than two, the profile remains pending (D-016). The proposer never counts. Record each review and its evidence references separately. Do not silently reduce the threshold beyond this rule.

## Evidence

Preferred order:
1. Relevant documents or certificates.
2. Multiple independent testimonies if documentary evidence is unavailable.
3. Explicit uncertain/disputed status if evidence is insufficient or conflicting.
4. Administrator resolution with recorded rationale when escalated.

An uploaded document is evidence to assess, not automatic proof of authenticity. Evidence visibility is restricted to authorized reviewers and follows retention/deletion policy.

## Memories and stories

- Memory: contributor's personal experience.
- Story: historical narrative that may make claims about other people/events.
- Draft: private to the contributor.
- In review: visible only to authorized reviewers and any explicitly permitted participants.
- Published: visible according to family/content permissions.
- Disputed: competing claims or versions are recorded.
- Archived/restricted: retained under documented policy with limited access.

A story dispute follows a 60-day resolution policy. Define the timer start event, extension authority, notification behavior, and exact visibility at expiry before implementation.
