@AGENTS.md

## Claude Code notes

- Project skills: `.claude/skills` is a symlink to `.agents/skills`. Edit skills in `.agents/skills/`; never create a separate copy.
- Use plan mode for any feature or material change, and wait for explicit approval before editing application code.
- When spawning subagents, pick the model from `docs/model-routing.md` (Haiku for small edits, Sonnet for routine work, Opus or Fable for high-risk design).
- Codex adversarial review cannot be invoked by Claude: ask the user to run `/codex:adversarial-review --base main` on the feature branch before shipping, then record the result.
- Personal, uncommitted notes go in `CLAUDE.local.md` (gitignored).
