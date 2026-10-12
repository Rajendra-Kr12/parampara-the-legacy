---
name: relationship-domain-review
description: Use when a change touches family identities, relationship edges, kinship terms (Atta, Menatta, Nanamma, Tatayya and others), relationship or claim verification, deceased profiles, stories about other people, or approvals, and before merging any change to packages/domain, packages/kinship-engine, or Convex functions that write people, edges, claims, or approvals. Do NOT use for UI-only styling, copy edits, or changes that touch no family data model or approval logic.
---

# Relationship-domain review

1. Read `docs/domain-model.md`, `docs/product-requirements.md`, `docs/privacy-and-governance.md`, and the relevant entries in `docs/decision-log.md`.
2. Canonical identity: one `Person` per real individual; duplicates are resolved by a reviewed merge that keeps provenance.
3. Paths: maternal and paternal paths are both preserved, including overlaps from marriages between relatives. No `relation_to_current_user` field as the source of truth. Invalid cycles are rejected.
4. Kinship labels: derived by `packages/kinship-engine` from graph paths plus locale and custom settings; paternal-side default; viewer preference stored separately; changing a label never mutates edges. Missing terms fall back gracefully. New terms are marked unvalidated until checked by native speakers.
5. Purity: `packages/domain` and `packages/kinship-engine` import no UI, Convex, or provider code.
6. States: account, relationship, historical-claim, content, and profile states stay distinct. No single `verified` boolean.
7. Approvals: proposer never approves their own change; reviewer eligibility is computed server-side. Deceased profiles need three eligible approvals, or two plus reviewed documentary evidence when fewer than three are eligible (D-016). Eligibility circles and thresholds are owned by D-023 and story approval by D-024 (see `docs/acceptance-criteria.md`).
8. Evidence: provenance recorded; uncertain and disputed states preserved; a document is evidence to assess, not automatic proof.
9. Integrity: approval + status change + audit event happen in one Convex mutation; concurrent conflicting proposals are handled; audit history is preserved.
10. Tests: positive and negative cases, including cousin-marriage overlap, self-approval attempt, insufficient approvers, and missing kinship term. Use synthetic families only.
11. Report findings by severity (critical, high, medium, low) with reproduction and suggested correction. Do not silently change product policy; raise it with the user.

## Gotchas

- Overlapping maternal and paternal paths from marriages between relatives are valid data, not duplicates or errors.
- A kinship label change must never edit an edge; check the code path, not only the UI.
- A single `verified` boolean is a defect even when it looks convenient.
- Use synthetic families in tests; never real family data.

## Before you finish

- [ ] Findings listed by severity with reproduction.
- [ ] Negative tests exist: self-approval, insufficient approvers, cousin-marriage overlap, missing kinship term.
- [ ] Product-policy questions raised with the user, not changed silently.
