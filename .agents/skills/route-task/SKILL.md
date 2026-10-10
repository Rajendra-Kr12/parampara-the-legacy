---
name: route-task
description: Choose the model, harness, and reviewer for a Parampara task using the routing table in docs/model-routing.md. Use when planning a feature, splitting work across agents or Firstmate crewmates, spawning subagents, or when a model has failed twice on a task.
---

# Route a task

1. Read the routing table in `docs/model-routing.md`.
2. Describe the task in one or two sentences, with no code, family data, or secrets.
3. Classify it:
   - T0 trivial and reversible, T1 routine within an approved plan, T2 high-risk domain or security, T3 hardest reasoning or architecture, D research or docs.
   - Any task touching the relationship graph, kinship engine, approvals, auth, privacy, media access, or migrations is at least T2.
4. If the Laya router (`tools/route-task`) exists and `AI_GATEWAY_API_KEY` is configured, run it with the description and compare its answer with your classification. When they differ, take the higher tier. If Laya is unavailable, use your classification. Never block work on Laya.
5. Pick the default model and harness for the tier, and a reviewer from a different model family for T2 and T3.
6. Split mixed tasks: route the high-risk part at its tier and the routine parts lower, with clear interfaces between them.
7. Escalate one tier if the task fails twice or turns out to touch a T2 area; note the escalation in the PR.
8. State the routing decision in the plan or handoff: tier, model, harness, reviewer, and reason.
