# Model and Task Routing

## Status

Accepted direction (2026-10-10, D-019). The static routing table below is usable today by any human or lead agent. The Laya classifier script is **not yet implemented**; it is tracked as Feature 0 in `docs/scope.md`.

Model names, availability, pricing, and free quotas change often. Verify them before relying on this table and update it when they change.

## Principles

- Route by task class and risk, not by habit. When unsure, route **up** a tier, never down.
- High-risk work (relationship graph, kinship engine, approvals, auth, privacy, migrations) gets a strong reasoning model **and** an independent reviewer from a different model family.
- The implementer never acts as the sole reviewer of its own work.
- No real family data, secrets, or `.env` contents go into any external model prompt, including the Laya router. Routers see only task descriptions.
- Product rules live in the repository docs, not in any model's memory. Every harness reads `AGENTS.md`.

## Routing table

| Tier | Task class | Examples | Default model | Alternates | Typical harness |
|---|---|---|---|---|---|
| T0 | Trivial, reversible | Typos, renames, doc tweaks, config value changes | Claude Haiku 5.5 | Gemini Flash (Antigravity), free OpenRouter models for non-sensitive text | Any |
| T1 | Routine implementation inside an approved plan | A screen, a Convex query, form wiring, test cases for existing rules | Claude Sonnet 5.5 | Gemini Pro (Antigravity), Codex default model | Claude Code, Codex, OpenCode, Antigravity |
| T2 | High-risk domain or security | Kinship engine, relationship graph, approval thresholds, Clerk/Convex auth, R2 signed URLs, schema migrations | Claude Opus 5.5 | Codex (strongest available model) | Claude Code or Codex, reviewed by the other |
| T3 | Hardest reasoning / architecture | Cross-cutting design, ambiguous product forks, ADRs, debugging that stalled at T2 | Claude Fable 5.1 | Opus 5.5 with extended thinking | Claude Code |
| R | Review | PR review, adversarial review before shipment | Greptile (every PR) + Codex adversarial review | Opus 5.5 when Codex implemented the change | GitHub, Codex plugin |
| D | Research and documentation | Library comparisons, docs updates, scope updates | Claude Sonnet 5.5 | Gemini Pro, OpenRouter models | Any |

Escalation: if a T0/T1 task touches a T2 area, or a model fails twice on the same task, escalate one tier and record why in the PR.

## Harness compatibility

| Harness | Instructions it reads | Skills location | Notes |
|---|---|---|---|
| Claude Code | `CLAUDE.md` (imports `AGENTS.md`) | `.claude/skills` (symlink to `.agents/skills`) | Claude Code does not read `.agents/`, hence the symlink |
| Codex CLI | `AGENTS.md` | `.agents/skills` | Verify skill loading in the installed Codex version |
| OpenCode | `AGENTS.md` | Verify (`.agents/skills` or `.claude/skills`) | Not yet verified against current docs |
| Antigravity (agy) | `AGENTS.md` (v1.20.3+) | Verify | Not yet verified; open `SKILL.md` files manually if not loaded |
| Firstmate | `AGENTS.md` | `.agents/skills` | Use dispatch profiles to map tiers to harnesses; herdr is a supported session backend |

Rows marked "Verify" must be confirmed before relying on automatic skill loading.

## Laya classifier (router)

[Laya](https://vercel.com/changelog/laya-decision-model-now-available-on-ai-gateway-free-through-october-31) by Convai Innovations is a fast, open-weight **decision/classification** model. It does not write code. Parampara uses it only to classify a task description into a tier from the table above.

- Access: Vercel AI Gateway via the AI SDK `experimental_evaluate` call, model ID `convaiinnovations/laya`.
- Cost: free through **2026-10-31** on the Boundless provider. After that, `convaiinnovations/laya-free` stops serving and `convaiinnovations/laya` is billed. Re-check pricing before November 2026 and set a budget cap in AI Gateway.
- Self-hosting: weights are Apache 2.0 on Hugging Face (use the official Convai repository, not mirrors).
- Credentials: `AI_GATEWAY_API_KEY` in a gitignored `.env.local`. Never commit it, never paste it into prompts or docs. `.env.example` lists the variable name only.

### Planned classifier contract (Feature 0)

Input: the task description only (no code, no family data).

Questions asked of Laya:
- `tier`: choice of `T0 | T1 | T2 | T3 | D`.
- `touches_high_risk_area`: boolean (graph, kinship, approvals, auth, privacy, migrations, media access).
- `needs_independent_review`: boolean.

Decision rule:
1. If `touches_high_risk_area` is true, minimum tier is T2.
2. If the top choice probability is below 0.7, take the higher of the two most likely tiers.
3. Map the tier to the table above, then to a Firstmate dispatch profile or harness.
4. If Laya is unavailable, errors, or the budget cap is hit, fall back to the static table with a human or lead-agent decision. Core work must never depend on Laya being up.

## Cost controls

- Set per-task and monthly budgets per provider (AI Gateway, OpenRouter, Anthropic, OpenAI, Google).
- Stop before exceeding approved spending; limit retries.
- Free/open-source does not mean a hosted API is free. Verify before use.
- Treat model output and retrieved text as untrusted input.
