# Architecture: Parampara

## Status

Proposed. No technology choice is final until the actual Parampara repository and operating constraints have been inspected.

## Architecture principles

- One canonical person identity, multiple relationship edges.
- Domain rules independent of UI and AI providers.
- Authorization enforced server-side.
- Explicit workflow states for claims, reviews, disputes, and publication.
- Sensitive changes are auditable and transactionally consistent.
- Media is private by default.
- Shared business rules across web and mobile.
- External AI is optional and cannot be required for core family operations.

## Candidate stack

- Web: Next.js + TypeScript.
- Mobile: React Native + Expo + TypeScript.
- Persistence: PostgreSQL.
- Backend/auth/storage: evaluate Supabase and alternatives against privacy, authorization, cost, operational complexity, and mobile support.
- Data access: use a typed data-access layer and a reviewed migration system. Prisma is a candidate if it fits the selected backend.
- Media: private object storage, short-lived signed URLs, quotas, and lifecycle policies.
- Background processing: managed queue/worker for import processing, media processing, and dispute deadline handling.
- Monitoring: structured operational logs and privacy-conscious error reporting.

Do not copy LLM Arena's exact stack by default. Its Next.js/Prisma/Postgres/Clerk/PostHog/Arcjet choices serve a different product. Reuse its decision discipline, not its vendor list.

## Logical layers

1. Client applications: screens, navigation, local validation, accessibility.
2. Application services: authorization-aware commands and queries.
3. Domain layer: relationship graph, kinship calculations, claim transitions, reviewer eligibility, dispute rules.
4. Persistence: relational data, transactions, migrations, audit events.
5. Media services: private uploads, signed access, lifecycle and deletion.
6. Background jobs: imports, media processing, deadline checks, notifications.
7. External integrations: email/SMS delivery and optional AI services.

## Domain boundaries

- Identity and family membership
- Family graph and kinship terminology
- Verification and evidence
- Memories and media
- Discovery and consent
- Import/export
- Administration and audit
- Notifications
- AI assistance and model routing (optional)

Boundaries should be reflected in code organization only after inspecting the actual framework. Avoid one giant shared folder for all domain types and helpers.

## Data integrity

- Use transactions for approval plus status change plus audit record.
- Use optimistic concurrency or equivalent protection for competing edits.
- Keep history for approved sensitive fields.
- Do not use a single `verified` boolean for unrelated verification dimensions.
- Keep original imported values and import provenance where needed.
- Model failed and pending workflow states explicitly rather than dropping them.
- Validate graph constraints and detect invalid cycles where the relationship type requires it.

## Security boundaries

- Client-supplied role, relationship, reviewer eligibility, and consent flags are never trusted.
- Authorize each resource read and write on the server.
- Keep evidence and media private.
- Never include secrets in source, logs, or agent prompts.
- AI output is untrusted input and cannot directly write approved family facts.
- Admin tools use least privilege and are themselves audited.

## Architecture decision records

Create a decision record before making a material choice. Each record should include context, options, decision, rationale, consequences, risks, and status. Record reversals explicitly.

Required early decisions:
- Web/mobile repository structure.
- Backend and authentication provider.
- Relationship graph representation and query strategy.
- Migration and ORM approach.
- Media storage and deletion behavior.
- Notification provider.
- Analytics and operational logging boundaries.
- AI/model router scope and cost caps.
