---
name: relationship-domain-review
description: Review Parampara changes involving family identities, relationship edges, kinship terminology, verification, deceased profiles, or historical claims.
---

# Relationship-domain review

1. Read `docs/domain-model.md`, `docs/product-requirements.md`, and `docs/privacy-and-governance.md`.
2. Check canonical identity and duplicate handling.
3. Check maternal and paternal paths, overlapping kinship paths, and cycles/invalid edges.
4. Ensure display labels are derived from graph paths and locale/custom settings, not stored as the only relationship truth.
5. Check account, relationship, historical-claim, and content states remain distinct.
6. Check proposer/reviewer separation and reviewer eligibility.
7. Check evidence provenance and uncertain/disputed handling.
8. Check transactions, concurrency, audit history, and migration implications.
9. Add or review positive and negative test cases.
10. Report findings by severity with reproduction and suggested correction. Do not silently change product policy.
