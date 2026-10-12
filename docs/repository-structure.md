# Repository Structure

## Current (documentation, agent tooling, workspace tooling, and the Convex backend)

```text
parampara-the-legacy/
├── AGENTS.md                 # shared rules for every agent and harness (source of truth)
├── CLAUDE.md                 # imports AGENTS.md + Claude Code notes
├── README.md                 # project index
├── .env.example              # variable names only, never values
├── .github/
│   └── pull_request_template.md
├── .greptile/                # Greptile review settings, rules, and doc context
│   ├── config.json
│   ├── rules.md
│   └── files.json
├── .agents/
│   └── skills/               # canonical skills (Codex, Firstmate, others)
│       ├── plan-feature/
│       ├── route-task/
│       ├── update-scope/
│       ├── relationship-domain-review/
│       ├── privacy-security-review/
│       ├── platform-parity-check/
│       └── adversarial-release-review/
├── .claude/
│   └── skills -> ../.agents/skills   # symlink so Claude Code sees the same skills
├── package.json              # pnpm workspace root (pnpm 12.11.2, Node 24)
├── pnpm-workspace.yaml       # packages/* only; tools/route-task is excluded (npm)
├── turbo.json                # lint, typecheck, test, build; root format check
├── .nvmrc
├── .prettierignore
├── .github/workflows/ci.yml  # format, lint, typecheck, test, build
├── packages/
│   ├── backend/              # Convex schema and functions (auth and users.me so far)
│   ├── config/               # shared tsconfig, ESLint, Prettier, enforcement probes
│   ├── domain/               # pure TS (empty so far)
│   ├── kinship-engine/       # pure TS (empty so far)
│   └── validation/           # shared input schemas (empty so far)
├── tools/
│   └── route-task/           # Laya task router (Feature 0); npm, not in the pnpm workspace
└── docs/
    ├── scope.md              # living plan and status
    ├── original-brief.md     # the owner's original idea notes (historical)
    ├── product-requirements.md
    ├── architecture.md
    ├── domain-model.md
    ├── privacy-and-governance.md
    ├── coding-standards.md
    ├── agent-workflow.md
    ├── model-routing.md
    ├── harness-setup.md
    ├── model-catalog.md
    ├── decision-log.md
    └── repository-structure.md
```

## Planned application layout (Feature 1)

```text
apps/
├── web/                      # Next.js
└── mobile/                   # Expo (iOS + Android)
packages/
├── domain/                   # pure TS rules: claims, thresholds, eligibility
├── kinship-engine/           # pure TS kinship path -> term calculation
├── validation/               # shared input schemas
└── config/                   # shared tsconfig, lint, format settings
```

Tests sit next to the code they cover, grouped as unit, integration (Convex), end-to-end (web, mobile), and security/authorization tests. Adjust names if the scaffolding tools establish a better convention, and record the change.

## What was borrowed from adrianhajdin/llm-arena

- Short root instructions that route agents to a living scope and detailed docs.
- Scope file with feature status, decisions, checklists, evidence, and unresolved manual checks.
- Skill directories for reusable workflows (`.agents/skills` plus a Claude-visible copy).
- Feature-oriented organization; small vertical slices; explicit approval before implementation.
- Clerk and Greptile, evaluated on their own merits (D-021).

## What was not copied

- Next.js-only architecture (Parampara needs native iOS and Android).
- Prisma, PostHog, Arcjet, OpenRouter-in-app, and product-specific model-cost behavior.
- Its decision not to use a test runner. Parampara's graph, permissions, and workflows need automated tests.
