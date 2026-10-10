---
name: plan-feature
description: Plan a Parampara feature or material change before any code is written. Use when the user asks to build, add, change, or refactor something, or before starting any item in docs/scope.md. Produces a plan and stops for explicit approval.
---

# Plan a feature

1. Read `AGENTS.md`, `docs/scope.md`, and the domain docs relevant to the feature.
2. Inspect the actual repository: run `git status` and `git log -5`, and read the files involved. Do not assume proposed files, packages, or commands exist.
3. State the goal and user value in plain language.
4. Identify the smallest useful vertical slice that works on web, iOS, and Android together. If one platform must lag, say why.
5. List affected areas: apps (`web`, `mobile`), Convex functions and schema, shared packages, permissions, and dependencies.
6. Classify the work tier with skill `route-task` and name the model and reviewer for each part.
7. Identify privacy, relationship-integrity, migration, cost, and operational risks. Name which review skills will run (`relationship-domain-review`, `privacy-security-review`, `platform-parity-check`).
8. Define acceptance checks: automated tests, manual checks per platform, and authorization-denial cases.
9. Propose the branch name (`feat/<slug>`, `fix/<slug>`, `docs/<slug>`, `chore/<slug>`).
10. If an abstraction or pattern is introduced, give the SOLID or design rationale in one or two sentences.
11. Ask at most one focused question, and only if a material product fork cannot be safely decided.
12. Present the plan and stop. Do not modify application code until the user explicitly approves.
13. After approval: create the branch from up-to-date `main`, add the checklist to `docs/scope.md`, and work only within the approved plan. If the plan must change, stop and say so.
