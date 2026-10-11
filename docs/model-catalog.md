# Model Catalog

Companion to `docs/model-routing.md`. Lists models agents may be routed to, with price, harness access, and a **data-handling class** that decides what content a model may see.

**Verified 2026-10-11** from the official OpenCode Zen page (opencode.ai/docs/zen). Free lineups rotate and "free for a limited time" models disappear without notice, so re-verify before relying on any row, and update the verification date when you do. Prices are USD per 1M tokens (input / output).

Capability is not listed because we have not benchmarked these models on Parampara tasks. Before trusting a free or cheap model with real work, run one small task from its tier and have an independent reviewer check it.

## Data-handling classes

| Class | Meaning | May receive |
|---|---|---|
| A | Paid first-party or provider API; no training on inputs per provider terms | Anything allowed by `AGENTS.md`, including T2/T3 design discussion of private rules |
| B | Free tier, provider states zero retention / no training | Public repository content only (code, docs, synthetic fixtures) |
| C | Free tier, collected data may be used to improve the model | Public repository content only, and only T0, T1 or D tasks with low sensitivity |
| D | Trial only, logged, "do not submit confidential data" | Throwaway public text only; never review or security work |

Never sent to any class: real family data, secrets, `.env*` contents, API keys, personal addresses or phone numbers. Public repository content is already public, so classes B to D are acceptable for it; the concern is accidental leaks of secrets and private data, and training on prompts.

## OpenCode Zen: free models (2026-10-11)

| Model | ID | Class | Notes |
|---|---|---|---|
| Space Bunny Free | space-bunny-free | B | Zero-retention provider |
| LongCat 2.5 Preview Free | longcat-2.5-preview-free | B | Limited-time free |
| Step 5 Preview Free | step-5-preview-free | B | Limited-time free |
| Jev 1.13 Free | jev-1.13-free | B | Provider states inputs are not used for training; verify |
| Big Pickle | big-pickle | C | Stealth model, free for a limited time |
| Exo Free | exo-free | C | Limited time |
| MiMo-V2.6-Flash Free | mimo-v2.6-flash-free | C | Limited time |
| MiMo-V2.5 Free | mimo-v2.5-free | C | Limited time |
| Ling 3.1 Flash Free | ling-3.1-flash-free | C | Limited time |
| Ling 3.0 Flash Fin Free | ling-3.0-flash-fin-free | C | Limited time |
| Muse Spark 1.3 Contributor Free | muse-spark-1.3-contributor-free | C | Prompts may train future Meta models |
| Nemotron 3 Ultra Free | nemotron-3-ultra-free | D | Trial only, logged |
| Nemotron 3.5 Lightning Free | nemotron-3.5-lightning-free | D | Trial only, logged |

Kimi and MiniMax are **not free** on Zen as of this date, despite older articles saying so.

## OpenCode Zen: paid models worth routing to (class A, 2026-10-11)

| Model | ID | Input / Output | Suggested tier |
|---|---|---|---|
| GPT 6 Luna (up to 272K) | gpt-6-luna | 0.10 / 0.50 | T0, D |
| Claude Haiku 5.5 (up to 100K) | claude-haiku-5-5 | 0.10 / 0.50 | T0 |
| DeepSeek V4 Flash | deepseek-v4-flash | 0.14 / 0.28 | T0, T1 |
| GLM 5.3 Flash | glm-5.3-flash | 0.15 / 0.50 | T0, T1 |
| MiniMax M2.7 | minimax-m2.7 | 0.30 / 1.20 | T1 |
| MiniMax M3 | minimax-m3 | 0.30 / 1.20 | T1 |
| Kimi K2.6 | kimi-k2.6 | 0.95 / 4.00 | T1 |
| Kimi K2.7 Code | kimi-k2.7-code | 0.95 / 4.00 | T1 |
| DeepSeek V4 Pro | deepseek-v4-pro | 1.74 / 3.48 | T1, T2 reviewer candidate |
| Claude Sonnet 5.5 | claude-sonnet-5-5 | 2.00 / 10.00 | T1, D |
| Claude Opus 5.5 | claude-opus-5-5 | 4.00 / 20.00 | T2 |
| Claude Fable 5.1 | claude-fable-5-1 | 10.00 / 50.00 | T3 |

Avoid models Zen lists as deprecated (GLM 5, Kimi K2.5, MiniMax M2.5). Other paid families on Zen (GPT 6/5.x, Gemini 3.x, Grok 4.x, Qwen, Mistral) are available; add them here only after a trial task.

Tier suggestions are starting points for the Laya classifier and humans, not benchmarks.

## Harness model access

Observed on 2026-10-11 on the owner's machine, versus what documentation says. Provider key names are never recorded here.

| Harness | Observed | Docs say |
|---|---|---|
| OpenCode 1.18.32 | `opencode models` lists 77 `opencode/*` (Zen) models plus one `freellmapi/auto`. Free ids seen: big-pickle, ling-3.0-flash-fin-free, longcat-2.5-preview-free, mimo-v2.6-flash-free, muse-spark-1.3-contributor-free, nemotron-3-ultra-free, nemotron-3.5-lightning-free, space-bunny-free. `opencode run -m opencode/space-bunny-free` answered | Zen free list above; other providers by config |
| Pi 0.85.1 | `pi --list-models` shows only the `nvidia` provider (21 models) as configured; no OpenRouter or Zen provider is configured on this machine. `nvidia/nemotron-3-super-120b-a12b` and `z-ai/glm-5.3-flash` answered; `deepseek-ai/deepseek-v4-flash-0731` returned HTTP 410 | OpenRouter works with `OPENROUTER_API_KEY` or `/login`; custom providers via `~/.pi/agent/models.json` with `baseUrl` and per-model `id` and `api` (e.g. `openai-completions`). Whether OpenCode Zen works as a Pi custom provider: **docs-only, not tried** (Zen documents `https://opencode.ai/zen/v1/chat/completions`, used with `@ai-sdk/openai-compatible` for some models; it needs the owner's Zen key, which was not used here) |
| Hermes 0.20.4 | Two `hermes chat -Q -q` probes answered on its configured default model. Local `config.yaml` (values redacted) shows `fallback_providers`: two Nous `:free` models and one custom OpenAI-compatible endpoint on localhost serving an NVIDIA model | Nous Portal, OpenRouter, OpenAI, or any compatible endpoint via `hermes model` / `hermes setup --portal`; Nous `:free` and OpenRouter `:free` models rotate |
| Claude Code, Codex | Both ran with the owner's logged-in accounts (Claude Code on `haiku`; Codex defaulted to `gpt-5.6-terra`) | Own subscriptions or keys |
| Antigravity (agy) 1.3.3 | `agy models` lists Gemini 3.x Flash variants with high/medium/low effort. Prompts fail with 429 individual quota, resets in about 44 hours | Own subscription |
| Vercel AI Gateway | Not tested | `AI_GATEWAY_API_KEY`; credits owned by the project owner; Laya free through 2026-10-31 |

Keys live in each harness's own config or the gitignored `.env.local`, never in this repository.

## Maintenance

- Re-verify this file at least monthly and before any large multi-agent run.
- When a free model disappears or changes its data policy, update its row and date here; do not leave stale rows.
- The Laya classifier (Feature 0) reads the class and tier columns from this file; keep the table format stable.
