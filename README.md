# Parampara: The Legacy

This repository documentation pack adapts the workflow and documentation patterns observed in `adrianhajdin/llm-arena` for Parampara. It contains product and engineering documentation only. It does not contain application code or make changes to the reference repository.

## Start here

1. `CLAUDE.md` — Claude Code entry point.
2. `AGENTS.md` — shared, cross-agent rules.
3. `docs/scope.md` — living plan, current status, decisions, and next work.
4. `docs/product-requirements.md` — product requirements and MVP behavior.
5. `docs/architecture.md` — proposed technical architecture and decisions still requiring validation.
6. `docs/domain-model.md` — family identity, relationship graph, kinship terminology, and verification model.
7. `docs/privacy-and-governance.md` — access control, consent, evidence, disputes, retention, and deletion.
8. `docs/coding-standards.md` — standards to validate against the actual repository and tooling before claiming enforcement.
9. `docs/agent-workflow.md` — Firstmate/Herdr and model-router operating rules.
10. `docs/decision-log.md` — durable record of product and architecture decisions.
11. `.agents/skills/` — focused, reusable agent workflows.

## Important status note

This is a documentation baseline and planning proposal, not proof that a repository has been initialized or that a technology stack, dependency, test framework, skill, or CI workflow has been installed. Before implementation, the agent must inspect the actual Parampara repository and reconcile this pack with its existing files. Do not overwrite existing work blindly.

## Product summary

Parampara is a private, relationship-aware family network that preserves family history, supports maternal and paternal family branches, represents multiple valid relationship paths, and helps relatives maintain stories, photos, audio memories, and connections across generations.

The MVP includes family trees, invitations and relationship verification, deceased profiles and historical evidence, memories and stories, photos, privacy controls, opt-in city discovery, audio memories, and spreadsheet import. Web, Android, and iOS are in scope for the initial release, with shared domain rules and backend authorization.
