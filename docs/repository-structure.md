# Repository Structure Proposal

This is a documentation-first proposal inspired by the reference repository's root instructions, living scope, skills directories, docs, feature-oriented folders, and separate infrastructure. It is not a command to restructure an existing repository without inspection.

## Proposed documentation and agent structure

```text
parampara/
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── docs/
│   ├── scope.md
│   ├── product-requirements.md
│   ├── architecture.md
│   ├── domain-model.md
│   ├── privacy-and-governance.md
│   ├── coding-standards.md
│   ├── agent-workflow.md
│   ├── decision-log.md
│   └── repository-structure.md
└── .agents/
    └── skills/
        ├── plan-feature/
        │   └── SKILL.md
        ├── update-scope/
        │   └── SKILL.md
        ├── relationship-domain-review/
        │   └── SKILL.md
        ├── privacy-security-review/
        │   └── SKILL.md
        └── adversarial-release-review/
            └── SKILL.md
```

## Application folders to decide after repository inspection

Potentially:
- `apps/web/`
- `apps/mobile/`
- `packages/domain/`
- `packages/kinship-engine/`
- `packages/validation/`
- `backend/` or framework-native server modules
- database schema and migrations
- tests grouped by unit, integration, end-to-end, and security behavior

Do not impose these names if the actual framework or existing repository has a better established convention.

## What to borrow from LLM Arena

- Short root instructions that route agents to the living scope and detailed docs.
- A scope file with feature status, decisions, checklists, evidence, and unresolved manual checks.
- Feature-oriented organization rather than one giant layer-wide folder.
- Coding standards that distinguish machine-enforced rules from human review rules.
- Small vertical slices and explicit approval before implementation.
- Record corrections and contradictions openly.
- Skill directories for reusable, task-specific workflows.
- Separate configuration/infra concerns from domain logic.
- Real verification, not assumptions based on reading source.

## What not to copy blindly

- LLM Arena's exact Next.js-only architecture, vendor choices, visual style, or product-specific rules.
- Its decision not to use a test runner. Parampara's graph, permissions, and historical workflows need repeatable automated tests.
- Its product-specific model-cost behavior.
- Its framework-specific `AGENTS.md` content. Parampara should have shared rules appropriate to its chosen stack.
