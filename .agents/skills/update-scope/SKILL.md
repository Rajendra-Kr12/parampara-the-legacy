---
name: update-scope
description: Keep docs/scope.md and docs/decision-log.md accurate in Parampara. Use after a decision, an implementation step, a verification run, a blocker, a plan correction, or before opening a pull request.
---

# Update the living scope

1. Read the relevant feature section in `docs/scope.md` and the "Current status" section.
2. Record only facts supported by the conversation, repository, or checks actually run.
3. Mark checklist items complete only when the work is done and evidence exists; add the date.
4. Separate automated checks, manual checks (per platform: web, iOS, Android), and checks not run.
5. Record changed decisions and why the previous plan was amended.
6. Keep blockers, risks, and next actions explicit. Update the "Current status" section.
7. Do not rewrite history to make progress look cleaner than it was.
8. For durable decisions, add a numbered entry to `docs/decision-log.md`; mark replaced entries "Superseded by D-xxx" instead of deleting them.
9. Commit scope updates on the same feature branch as the change they describe, so the PR shows both.
