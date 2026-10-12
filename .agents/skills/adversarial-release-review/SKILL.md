---
name: adversarial-release-review
description: Use when a Parampara feature is believed done and needs an independent challenge before shipment or before merging a feature PR, covering security, privacy, relationship integrity, migrations, and web/iOS/Android regressions. Do NOT use for planning, for reviewing a work-in-progress draft, or as a substitute for the targeted domain and privacy reviews.
---

# Adversarial release review

1. Read the approved plan, acceptance criteria, changed files (`git diff main...HEAD`), and relevant domain docs.
2. Independence: the reviewer must be a different model family from the implementer. If Claude implemented, use Codex; if Codex implemented, use a Claude model (Opus or Fable).
3. Codex path: the user runs `/codex:adversarial-review --base main` in Claude Code (it cannot be invoked by the model), or runs a review in Codex CLI on the branch. Record the output.
4. Assume hidden failure modes. Attempt unauthorized reads and writes, self-approval, reviewer spoofing, conflicting concurrent edits, duplicate imports, and invalid relationship paths as relevant.
5. Inspect migration safety, rollback and recovery options, audit completeness, and data preservation.
6. Run skill `platform-parity-check` when UI or client behavior changed.
7. Check the Greptile review on the PR; every conversation must be resolved or answered.
8. Run the available targeted checks. Never claim tests or reviews ran if they did not.
9. Classify findings as critical, high, medium, or low with reproduction evidence.
10. Block release for unresolved critical security, privacy, or data-integrity findings.
11. Record remediation and retest results in the PR description and `docs/scope.md`.

## Gotchas

- The reviewer must be a different model family from the implementer; the same family sharing blind spots is not independence.
- Claude cannot invoke `/codex:adversarial-review`; the user runs it, and its output is recorded.
- Never claim a test or review ran if it did not; write "not run".
- A UI that renders is not a feature that is done.

## Before you finish

- [ ] Reviewer family differs from the implementer.
- [ ] Greptile conversations are resolved or answered.
- [ ] Findings are classified by severity, and unresolved critical ones block release.
- [ ] Remediation and retest results are recorded in the PR description and `docs/scope.md`.
