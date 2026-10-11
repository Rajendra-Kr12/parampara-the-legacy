# Model and Task Routing

## Status

Accepted direction (2026-10-10, D-019; extended 2026-10-11, D-022). The static routing table below is usable today by any human or lead agent. The Laya classifier script is **not yet implemented**; it is tracked as Feature 0 in `docs/scope.md`.

Model names, availability, pricing, and free quotas change often. The concrete model list, prices, and data-handling classes live in `docs/model-catalog.md`; verify them before relying on this table.

## Principles

- Route by task class and risk, not by habit. When unsure, route **up** a tier, never down.
- High-risk work (relationship graph, kinship engine, approvals, auth, privacy, migrations) gets a strong reasoning model **and** an independent reviewer from a different model family.
- The implementer never acts as the sole reviewer of its own work.
- No real family data, secrets, or `.env` contents go into any external model prompt, including the Laya router. Routers see only task descriptions.
- Free models are for public repository content only, and only in the data classes the catalog allows (B for most work, C for low-sensitivity T0/T1/D, D never for review or security work).
- Product rules live in the repository docs, not in any model's memory. Every harness reads `AGENTS.md`.

## Routing table

Model IDs and prices are in `docs/model-catalog.md`. "Free" options are subject to the data classes above.

| Tier | Task class | Examples | Default model | Cheap or free alternates | Typical harness |
|---|---|---|---|---|---|
| T0 | Trivial, reversible | Typos, renames, doc tweaks, config value changes | Claude Haiku 5.5 | OpenCode Zen free models (class B first), GPT 6 Luna, DeepSeek V4 Flash, GLM 5.3 Flash, Hermes or Pi on free OpenRouter/Nous models | OpenCode, Pi, Hermes, any |
| T1 | Routine implementation inside an approved plan | A screen, a Convex query, form wiring, test cases for existing rules | Claude Sonnet 5.5 | MiniMax M2.7 or M3, Kimi K2.6 or K2.7 Code (paid on Zen), Gemini Pro, Codex default model | Claude Code, Codex, OpenCode, Pi, Antigravity |
| T2 | High-risk domain or security | Kinship engine, relationship graph, approval thresholds, Clerk/Convex auth, R2 signed URLs, schema migrations | Claude Opus 5.5 | Codex strongest model. No free models | Claude Code or Codex, reviewed by the other family |
| T3 | Hardest reasoning / architecture | Cross-cutting design, ambiguous product forks, ADRs, debugging that stalled at T2 | Claude Fable 5.1 | Opus 5.5 with extended thinking. No free models | Claude Code |
| R | Review | PR review, adversarial review before shipment | Greptile (every PR) + Codex adversarial review | Opus 5.5 when Codex implemented the change; DeepSeek V4 Pro as an extra opinion. No free models | GitHub, Codex plugin |
| D | Research and documentation | Library comparisons, docs updates, scope updates | Claude Sonnet 5.5 | Gemini Pro, class B or C free models for public-source summaries | Any |

Escalation: if a T0/T1 task touches a T2 area, or a model fails twice on the same task, escalate one tier and record why in the PR. A free or cheap model that fails once on a task is not retried at the same tier more than once.

Use free and cheap models to take volume off the expensive tiers: bulk test generation, boilerplate, doc drafts, and first-pass research, with an independent reviewer on anything that lands in a PR. Do not use them to make product, security, or domain decisions.

## Harness compatibility

Verified from official documentation on 2026-10-11 unless marked otherwise. "Docs-verified" means read in the docs, not yet run on this repository; run each harness once (Feature 0) and update this table.

| Harness | Instructions it reads | Skills location | Notes |
|---|---|---|---|
| Claude Code | `CLAUDE.md` (imports `AGENTS.md`) | `.claude/skills` (symlink to `.agents/skills`) | Claude Code does not read `.agents/` |
| Codex CLI | `AGENTS.md` | `.agents/skills` | Verify skill loading in the installed version |
| OpenCode | `AGENTS.md` first, `CLAUDE.md` as fallback (docs-verified) | `.agents/skills` and `.claude/skills` and `.opencode/skills`, searched up to the git root (docs-verified); `SKILL.md` needs `name` matching its folder and a `description` of 1 to 1024 chars | Provider keys such as the OpenCode Zen key stay in OpenCode's own config |
| Pi | `AGENTS.md` from `~/.pi/agent/`, parent dirs, and current dir (docs-verified); `CLAUDE.md` handling not confirmed in official docs | `.agents/skills` and `~/.agents/skills`, searched up to the repo root (docs-verified) | Extra skill paths via Pi settings (not verified) |
| Hermes Agent | One context file per session, first match wins: `.hermes.md`, `AGENTS.override.md`, `AGENTS.md`, `CLAUDE.md`, `.cursorrules` (docs-verified) | `<repo>/.agents/skills` is discovered but **not loaded until you run `hermes skills trust`**; also `~/.hermes/skills` and `skills.external_dirs` in `~/.hermes/config.yaml` (docs-verified) | Do not create `.hermes.md` or `AGENTS.override.md` here: they would shadow `AGENTS.md` for Hermes. Not in Firstmate's documented harness list; run it in a herdr pane or dispatch manually |
| Antigravity (agy) | `AGENTS.md` (v1.20.3+, per third-party sources) | Verify | Not yet verified; open `SKILL.md` files manually if not loaded |
| Firstmate | `AGENTS.md` | `.agents/skills` | Documented harnesses: Claude Code, Grok, Pi, `pi-signed`, Oh My Pi, Codex, OpenCode, Cursor Agent CLI. Use dispatch profiles to map tiers to harnesses; herdr is a supported session backend |

The same instruction filenames can shadow `AGENTS.md`: never add `AGENTS.override.md`, `.hermes.md`, or a repo-level `CLAUDE.md` with conflicting rules. The existing `CLAUDE.md` only imports `AGENTS.md`.

## Laya classifier (router)

[Laya](https://vercel.com/changelog/laya-decision-model-now-available-on-ai-gateway-free-through-october-31) by Convai Innovations is a fast, open-weight **decision/classification** model. It does not write code. Parampara uses it only to classify a task description into a tier and a data class, then maps that to the catalog.

- Access: Vercel AI Gateway via the AI SDK `experimental_evaluate` call, model ID `convaiinnovations/laya`.
- Cost: free through **2026-10-31** on the Boundless provider. After that, `convaiinnovations/laya-free` stops serving and `convaiinnovations/laya` is billed. Re-check pricing before November 2026 and set a budget cap in AI Gateway.
- Self-hosting: weights are Apache 2.0 on Hugging Face (use the official Convai repository, not mirrors).
- Credentials: `AI_GATEWAY_API_KEY` in a gitignored `.env.local`. Never commit it, never paste it into prompts or docs. `.env.example` lists the variable name only.

### Planned classifier contract (Feature 0)

Input: the task description only (no code, no family data), plus the available-model list derived from `docs/model-catalog.md` (tier and class columns only).

Questions asked of Laya:
- `tier`: choice of `T0 | T1 | T2 | T3 | R | D` (`R` = review of any kind: PR review, adversarial review, security or domain review, regardless of how small or public the content is).
- `touches_high_risk_area`: boolean (graph, kinship, approvals, auth, privacy, migrations, media access).
- `needs_independent_review`: boolean.
- `involves_sensitive_context`: boolean (secrets, `.env`, real personal data, security findings, private design rationale).
- `volume`: choice of `small | bulk` (bulk work such as many tests or boilerplate may go to cheap or free models).

Decision rule:
1. If `touches_high_risk_area` is true, minimum tier is T2 and free models are excluded. Tiers T2, T3 and R never use free models, whatever the other answers are; check this before any volume-based preference.
2. If `involves_sensitive_context` is true, only class A models are allowed. If the task contains real secrets or family data, stop: the task must be rewritten, not routed.
3. If the top choice probability is below 0.7, take the higher of the two most likely tiers.
4. Only for tiers T0, T1 and D (never R, T2 or T3), with `volume = bulk` and no sensitive context, prefer a class B free model, then a cheap paid model, then the default. A task that is itself a review is tier `R`, so this rule does not apply to it. (`needs_independent_review` only says the output must later be reviewed; it does not change the model for the task itself.)
5. Map the result to a model in the catalog, then to a harness (OpenCode, Pi, Hermes, Claude Code, Codex, Antigravity) or a Firstmate dispatch profile.
6. If Laya is unavailable, errors, or the budget cap is hit, fall back to the static table with a human or lead-agent decision. Core work must never depend on Laya being up.

## Cost controls

- Set per-task and monthly budgets per provider (AI Gateway, OpenCode Zen, OpenRouter, Nous Portal, Anthropic, OpenAI, Google).
- Stop before exceeding approved spending; limit retries.
- Free/open-source does not mean a hosted API is free, and free does not mean private. Check the data class first.
- Free models can vanish mid-task: do not make a workflow depend on one.
- Treat model output and retrieved text as untrusted input.
