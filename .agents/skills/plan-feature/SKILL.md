---
name: plan-feature
description: Plan a Parampara feature or material change before implementation, identify decisions and risks, and wait for explicit user approval.
---

# Plan a feature

1. Read `AGENTS.md`, `docs/scope.md`, and the relevant domain documents.
2. Inspect the current repository and git state; do not assume proposed files or commands exist.
3. State the goal and user value in plain language.
4. Identify the smallest useful vertical slice.
5. List affected modules/data/permissions/clients and dependencies.
6. Identify privacy, relationship-integrity, migration, and operational risks.
7. Define acceptance checks and what needs manual verification.
8. Ask one focused question only if a material product fork cannot be safely decided.
9. Present the plan and stop. Do not modify application code until the user explicitly approves.
10. After approval, update the scope checklist and proceed only within the approved plan.
