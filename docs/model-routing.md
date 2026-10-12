# Model and Task Routing

## Status

Accepted direction (2026-10-10, D-019; extended 2026-10-11, D-022). The static routing table below is usable today by any human or lead agent. The Laya classifier script is implemented in `tools/route-task` (usage in its README); the owner's live check (2026-10-12) and the open budget-cap decision for paid Laya are recorded in D-030 and `docs/scope.md`.

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

Probe run 2026-10-11 from a git worktree of this repository, one non-interactive call per harness, same prompt each time (name the instruction files loaded, quote the first heading of `AGENTS.md`, list the repository skills visible). "Observed" is what the harness itself reported; it is self-report from the model, so it proves content reached the context, not how. "Docs say" is documentation or Firstmate adapter notes, not run here. Raw outputs are in Firstmate's task data, not in this repository.

| Harness (version) | Observed: instructions | Observed: skill names | Observed: command and caveats | Docs say |
|---|---|---|---|---|
| Claude Code 2.1.296 | `CLAUDE.md` and `AGENTS.md` loaded; quoted heading "Parampara: shared agent rules" | 7 skill names visible, but `AGENTS.md` already lists them, so skill file discovery is unconfirmed (adversarial-release-review, plan-feature, platform-parity-check, privacy-security-review, relationship-domain-review, route-task, update-scope) | `claude -p --model haiku --no-session-persistence "<prompt>"`. The `.claude/skills` symlink exists but discovery through it was not shown; the model could not confirm paths from the skill list | Reads `CLAUDE.md` (imports `AGENTS.md`); does not read `.agents/` |
| Codex CLI 0.147.0 | `AGENTS.md` only; heading quoted | Same 7 skill names; visible via `AGENTS.md`, skill file discovery unconfirmed | `codex exec --sandbox read-only --skip-git-repo-check "<prompt>"`. Printed a pre-existing local error `failed to load models cache: missing field supports_parallel_tool_calls` (flagged, not caused by this repo) | Reads `AGENTS.md` and `.agents/skills` |
| OpenCode 1.18.32 | `AGENTS.md` loaded; reported `CLAUDE.md` not loaded; heading quoted | 7 skill names visible via `AGENTS.md`, skill file discovery unconfirmed (the model attributed one to `.claude/skills`, which is unreliable self-report) | `opencode run -m opencode/space-bunny-free "<prompt>"` (free class B Zen model, public content only) | `AGENTS.md` first, `CLAUDE.md` fallback; skills from `.agents/skills`, `.claude/skills`, `.opencode/skills` |
| Pi 0.85.1 | Both `CLAUDE.md` and `AGENTS.md` reported on one model, `AGENTS.md` plus the global `~/CLAUDE.md` on another; heading quoted | 7 skill names visible via `AGENTS.md`, skill file discovery unconfirmed | `pi -p --provider nvidia --model nvidia/nemotron-3-super-120b-a12b --no-session "<prompt>"`. `deepseek-ai/deepseek-v4-flash-0731` on the same provider returned HTTP 410 (provider-side, retry on another model worked). Pi keeps a per-directory trust list (`~/.pi/agent/trust.json`); `--approve` / `--no-approve` control project-local files, so a fresh checkout outside a trusted parent may need approval | `AGENTS.md` from `~/.pi/agent/`, parent dirs, current dir; `.agents/skills` up to the repo root. `--no-context-files` disables `AGENTS.md` and `CLAUDE.md` discovery |
| Hermes Agent 0.20.4 | Mixed self-report. Probe 1 (project trusted): said it loaded no instruction files. Probe 2 (project untrusted, narrower prompt): quoted the `AGENTS.md` heading and also claimed `CLAUDE.md`, which contradicts the first-match-wins rule, so treat as unreliable; `AGENTS.md` reaching context is observed, `CLAUDE.md` is not credible | After `hermes skills trust`: listed 6 of 7 repo skills (missed `plan-feature`) among about 100 bundled and user skills; the figure 7 comes only from `hermes skills trust` output ("7 project skill(s) will load"), which is tool output and not an observed load. Before trust: not probed. After `hermes skills untrust` the repo skills no longer load (command output) | `hermes skills trust` (output: Trusted: <worktree path>), then `hermes chat -Q -q "<prompt>"`, then `hermes skills untrust` (output: Untrusted; project skills no longer load). Trust was per path (this worktree only) and has been revoked; `trusted_project_dirs` in `~/.hermes/config.yaml` is `[]`, an empty value that does not show where Hermes stores trust | One context file, first match wins: `.hermes.md`, `AGENTS.override.md`, `AGENTS.md`, `CLAUDE.md`, `.cursorrules`. `./.agents/skills` loads only after `hermes skills trust` |
| Antigravity agy 1.3.3 | Not verified, quota error | Not verified, quota error | `agy --print="<prompt>" --output-format text`. Three attempts across about 10 minutes, a 60 second wait before the last, all failed with `RESOURCE_EXHAUSTED (code 429): Individual quota reached ... Resets in 44h` (exit 3). Note `--print` needs its prompt attached with `=`, otherwise it consumes the next flag as the prompt | `AGENTS.md` (v1.20.3+, third-party sources); skills location not verified. Firstmate verified agy 1.2.0 as a crewmate and scout adapter only |
| Firstmate | Reads `AGENTS.md` | Reads `.agents/skills` | Not run as a harness here; this task was itself dispatched by Firstmate | Verified harnesses per Firstmate `AGENTS.md` section 4: `claude`, `codex`, `opencode`, `pi`, `pi-signed`, `grok`, `kimi`, `cursor`, `omp`, plus `muse`, `gemini`, `rovo`, `agy`, `devin` for crewmates and scouts only. Hermes is not in the list, so it cannot be dispatched; use a manual herdr pane (see `docs/harness-setup.md`) |

Findings: `AGENTS.md` loading is observed for Claude Code, Codex, OpenCode and Pi (heading quoted). All four listed the seven skill names, but the probe asked for names that `AGENTS.md` itself lists, so this shows the names are visible via `AGENTS.md`, not that any `SKILL.md` was discovered: skill file discovery is unconfirmed (docs say each harness searches its skills directory; see Docs say column). Only Claude Code needs the `CLAUDE.md` import and `.claude/skills` symlink per the docs. For Hermes, the first probe reported no instruction files and the observed skill listing (after `hermes skills trust`) showed 6 of 7 skills; the figure 7 comes only from the trust command's own output (tool output, not an observed load), so full loading is not confirmed. agy: not verified, quota error 429 after 3 attempts.

The same instruction filenames can shadow `AGENTS.md`: never add `AGENTS.override.md`, `.hermes.md`, or a repo-level `CLAUDE.md` with conflicting rules. The existing `CLAUDE.md` only imports `AGENTS.md`.

## Laya classifier (router)

[Laya](https://vercel.com/changelog/laya-decision-model-now-available-on-ai-gateway-free-through-october-31) by Convai Innovations is a fast, open-weight **decision/classification** model. It does not write code. Parampara uses it only to classify a task description into a tier and a data class, then maps that to the catalog.

- Access: Vercel AI Gateway via the AI SDK `experimental_evaluate` call, model ID `convaiinnovations/laya`.
- Cost: free through **2026-10-31** on the Boundless provider. After that, `convaiinnovations/laya-free` stops serving and `convaiinnovations/laya` is billed. Re-check pricing before November 2026 and set a budget cap in AI Gateway.
- Self-hosting: weights are Apache 2.0 on Hugging Face (use the official Convai repository, not mirrors).
- Credentials: `AI_GATEWAY_API_KEY` in a gitignored `.env.local`. Never commit it, never paste it into prompts or docs. `.env.example` lists the variable name only.

### Classifier contract

Input to Laya: the task description only (no code, no family data). The router applies the tier and class columns of `docs/model-catalog.md` locally after Laya answers, so no catalog content is sent to Laya.

Questions asked of Laya:
- `tier`: choice of `T0 | T1 | T2 | T3 | R | D` (`R` = review of any kind: PR review, adversarial review, security or domain review, regardless of how small or public the content is).
- `touches_high_risk_area`: boolean (graph, kinship, approvals, auth, privacy, migrations, media access).
- `needs_independent_review`: boolean.
- `involves_sensitive_context`: boolean (secrets, `.env`, real personal data, security findings, private design rationale).
- `volume`: choice of `small | bulk` (bulk work such as many tests or boilerplate may go to cheap or free models).

Decision rule:
1. If `touches_high_risk_area` is true, minimum tier is T2 and free models are excluded. Tiers T2, T3 and R never use free models, whatever the other answers are; check this before any volume-based preference.
2. If `involves_sensitive_context` is true, only class A models are allowed. If the task contains real secrets or family data, stop: the task must be rewritten, not routed.
3. If the top choice probability is below 0.7, take the higher of the two most likely tiers; when R is one of the two, choose R, and otherwise break ties toward the higher-risk tier (T1 over D, T2 over T1, T3 over T2).
4. Only for tiers T0, T1 and D (never R, T2 or T3), with `volume = bulk` and no sensitive context, prefer a class B free model, then a cheap paid model, then the default. A task that is itself a review is tier `R`, so this rule does not apply to it. (`needs_independent_review` only says the output must later be reviewed; it does not change the model for the task itself.)
5. Map the result to a model in the catalog, then to a harness (OpenCode, Pi, Hermes, Claude Code, Codex, Antigravity) or a Firstmate dispatch profile.
6. If Laya is unavailable, errors, or the budget cap is hit, fall back to the static table with a human or lead-agent decision. Core work must never depend on Laya being up.

## Cost controls

- Set per-task and monthly budgets per provider (AI Gateway, OpenCode Zen, OpenRouter, Nous Portal, Anthropic, OpenAI, Google).
- Stop before exceeding approved spending; limit retries.
- Free/open-source does not mean a hosted API is free, and free does not mean private. Check the data class first.
- Free models can vanish mid-task: do not make a workflow depend on one.
- Treat model output and retrieved text as untrusted input.
