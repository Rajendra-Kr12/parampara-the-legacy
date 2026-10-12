# Harness Setup: Firstmate Dispatch Profiles and Herdr

Companion to `docs/model-routing.md` (tiers) and `docs/agent-workflow.md`. Documentation only: nothing here changes a Firstmate file. Facts are labelled **observed** (run on the owner's machine on 2026-10-11) or **docs** (documentation read, not run). Model IDs and prices are in `docs/model-catalog.md`.

## Tier to dispatch-profile map (proposed)

Firstmate reads a local, gitignored `config/crew-dispatch.json` (schema in Firstmate `docs/configuration.md`, example `docs/examples/crew-dispatch.json`). Each rule has `when` text, `use` (a profile object or an array resolved by quota-aware selection) and optional `why`; a profile is `harness` (required), `model`, `effort`, and optional `provider`. Firstmate passes concrete `--harness`, `--model`, `--effort` to its spawn script. An effort value a harness does not accept is recorded but omitted from launch flags.

Accepted effort values per harness (docs, from Firstmate adapter notes): Claude Code `low|medium|high|xhigh|max`; Codex `low|medium|high|xhigh` (`max` only on some models); Pi `low|medium|high|xhigh|max`; agy `low|medium|high`; OpenCode has no effort flag in Firstmate's launch path.

| Tier | Harness | Model (from catalog) | Effort | Notes |
|---|---|---|---|---|
| T0 | `claude` | `haiku` | `low` | Paid class A. Free OpenCode Zen class B models (`opencode` harness, `opencode/space-bunny-free` ran in this verification) only for public, non-sensitive, bulk work |
| T1 | `claude` or `codex` (array, quota-aware) | `claude-sonnet-5-5`; Codex default model | `medium` | Alternates on `opencode`: `opencode/minimax-m3`, `opencode/kimi-k2.7-code` (paid class A) |
| T2 | `claude` or `codex` | `claude-opus-5-5`; Codex strongest model | `high` | No free models. Reviewer must be the other family |
| T3 | `claude` | `claude-fable-5-1` | `xhigh` | Fall back to Opus 5.5 at `xhigh` |
| R | `codex` (adversarial review) with `claude` Opus as second opinion | Codex strongest; `claude-opus-5-5` | `high` | Greptile runs on GitHub. `/codex:adversarial-review` stays user-triggered |
| D | `claude` | `claude-sonnet-5-5` | `low` or `medium` | Free class B or C only for public-source summaries |

Rules to carry over: route up on doubt; high-risk areas (graph, kinship, approvals, auth, privacy, migrations) match a T2 rule before any bulk or free-model rule; never a free model for T2, T3, R. Rules are read in natural language by Firstmate, so write the `when` text from `docs/model-routing.md` task classes, and put the high-risk rule first. A schema-valid file does not prove the harness/model pair works: Firstmate refuses a model a harness listing omits, and effort is only recorded when unsupported.

Dispatchable harnesses (docs, Firstmate `AGENTS.md` section 4): `claude`, `codex`, `opencode`, `pi`, `pi-signed`, `grok`, `kimi`, `cursor`, `omp`, plus `muse`, `gemini`, `rovo`, `agy`, `devin` for crewmates and scouts only. **Hermes is not in the list, so Firstmate cannot dispatch it** (docs); use the manual herdr workflow below. Antigravity is dispatchable in principle, but the owner's account was quota-limited when probed (observed), so keep agy out of profiles until it passes the probe.

## Reaching free models from Pi and Hermes

- **Pi** (observed): only the `nvidia` provider is configured on this machine; no OpenRouter provider. NVIDIA models answered (Nemotron 3 Super, GLM 5.3 Flash), one returned HTTP 410. (docs) OpenRouter needs `OPENROUTER_API_KEY` or `/login`, and `:free` suffixed model IDs are the free ones; free IDs rotate. Custom providers go in `~/.pi/agent/models.json` with a `baseUrl` and model `id`/`api`.
- **OpenCode Zen as a Pi custom provider**: docs-only, not tried. Zen exposes `https://opencode.ai/zen/v1/chat/completions` (docs), so a `models.json` provider with that `baseUrl` and `api: openai-completions` is plausible for the models documented on that endpoint; Claude and GPT models use other Zen endpoints. Try it with one class B model before relying on it.
- **Hermes** (docs; local config shows Nous `:free` models as fallbacks, values redacted; the probes ran on its configured default model, whose name I did not record): `hermes model` or `hermes setup --portal` selects Nous Portal, OpenRouter or a compatible endpoint. Nous Portal `:free` offers and OpenRouter `:free` models rotate; check the live list in the tool before relying on one. Not run end to end here.
- Data classes still apply: free means class B to D in the catalog, public repository content only.

## Herdr setup

Herdr is a terminal workspace manager for coding agents and a supported Firstmate runtime backend (docs, Firstmate `docs/herdr-backend.md`). Installed here (observed): `herdr 0.9.3`. Firstmate's broad verification covers 0.7.1 to 0.8.0 and requires protocol 14 or newer, so 0.9.3 is newer than anything verified; confirm with `herdr status` before relying on it.

Setup, from the docs:
1. Install from herdr.dev (official source; several mirrors exist). Needs `jq`.
2. Select it: put `herdr` in Firstmate's local `config/backend`, or set `FM_BACKEND=herdr` for one launch, or ask Firstmate. It is also auto-detected when Firstmate itself runs inside Herdr (`HERDR_ENV=1`, not inside tmux).
3. Each crewmate gets a task tab in the launching home's workspace, or a disposable one-task workspace by default on Herdr 0.8.0 or newer. Task worktrees still come from Treehouse. Watch with `herdr session attach <name>`; Firstmate supervises with its own peek and send scripts without attaching.
4. Herdr is AGPL-3.0-or-later (or commercial); Firstmate runs it as a separate process.

Manual Hermes workflow (docs-derived, not run): open a herdr pane in a git worktree of this repository on its own branch, run `hermes` there, give it a task and the tier from `docs/model-routing.md`, review its branch like any other PR. Do not create `.hermes.md` or `AGENTS.override.md`. Hermes docs say project skills in `.agents/skills` load only after `hermes skills trust` for that checkout. Observed 2026-10-11: after trust the skill listing showed 6 of 7 skills; the figure 7 appears only in the trust command's own output (tool output, not an observed load); `hermes skills untrust` then reported project skills no longer load. Trust is per path, so a new worktree needs it again; it is an owner decision each time. Treat Hermes output as T0/T1 volume work with independent review.

Lifecycle commands (`workspace`, `pane`, `tab`, `worktree` create or delete, `server stop`) were not run in this verification, on purpose; tasks that drive them must use a named non-default isolated lab (Firstmate `AGENTS.md`).

## Open items

- Skill file discovery for Claude Code, Codex, OpenCode and Pi: unconfirmed. The first probe only asked for skill names, which `AGENTS.md` also lists. Stronger probe still open: ask for information found only inside a `SKILL.md` body (or the harness's own discovered-skill list), run with the skill files as the only source.
- Hermes: model self-report was inconsistent (one probe said no instruction files, one quoted the `AGENTS.md` heading); repeat with a second model if exact loading matters.
- agy: not verified, quota error (429, reset about 44 hours). Re-run the probe in `docs/model-routing.md` after the reset.
- Pi + Zen custom provider, and Pi on OpenRouter free models: not tried.
- Laya classifier: implemented in `tools/route-task`; open owner items are tracked in `docs/scope.md` (Feature 0).
