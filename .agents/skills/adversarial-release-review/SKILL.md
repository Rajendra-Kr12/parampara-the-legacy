---
name: adversarial-release-review
description: Independently challenge a Parampara feature before shipment, focusing on security, privacy, relationship integrity, migrations, and cross-platform regressions.
---

# Adversarial release review

1. Read the approved plan, acceptance criteria, changed files, and relevant domain docs.
2. Assume the implementation has hidden failure modes; test the assumptions rather than restating the implementation.
3. Attempt unauthorized reads/writes, self-approval, reviewer spoofing, conflicting concurrent edits, duplicate imports, and invalid relationship paths as relevant.
4. Inspect migration safety, rollback/recovery options, audit completeness, and data preservation.
5. Inspect mobile/web parity and accessibility where the feature changes UI.
6. Run the available targeted checks. Never claim tests were run if they were not.
7. Classify findings as critical, high, medium, or low and include reproduction evidence.
8. Block release for unresolved critical security, privacy, or data-integrity findings.
9. Record remediation and retest results in the release handoff and `docs/scope.md`.
