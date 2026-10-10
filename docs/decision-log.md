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
- Status: Accepted with edge case open
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
