# Parampara: shared agent rules

These rules apply to every coding agent, reviewer, subagent, and orchestration workflow. Tool-specific files may add instructions but must not contradict this file. If instructions conflict, stop, describe the conflict, and ask for a decision when it changes product behavior or security.

## Before work

- Read `docs/scope.md` and the relevant feature/domain documents.
- Inspect the actual repository and current git state before proposing file changes.
- Explain the intended change and why before implementing. Wait for explicit approval.
- Do not infer that a proposed stack, dependency, command, skill, or test runner exists until verified in the repository.
- Prefer small, vertical, end-to-end slices over broad speculative scaffolding.

## Product and domain invariants

- One person has one canonical identity, even when connected through multiple family branches.
- Preserve all valid maternal and paternal relationship paths.
- Kinship labels are presentation choices derived from relationship paths and locale/custom settings; changing a label must not change the graph.
- Keep account verification, relationship verification, and historical-claim verification separate.
- Preserve provenance and history for sensitive changes.
- Never convert missing or disputed facts into certainty.
- AI suggestions require human confirmation before changing family data.
- Private contact details, exact addresses, evidence, and restricted media must be protected by backend authorization.
- Do not weaken approval rules or privacy controls to make a demo pass.

## Engineering practice

- Follow SOLID and separation of concerns where they improve clarity; avoid abstraction without a concrete use.
- Prefer pure domain functions and explicit side-effect boundaries.
- Use strict types and avoid untyped escape hatches.
- Validate inputs at trust boundaries.
- Use transactions for multi-record operations that must remain consistent.
- Make migrations reviewable, reversible where feasible, and safe for existing data.
- Use feature-oriented organization when compatible with the actual framework and repository.
- Do not introduce dependencies, frameworks, paid services, or new test tools without explaining why and getting approval when material.
- Never expose raw provider exceptions, credentials, internal paths, or sensitive evidence to end users.
- Do not run destructive commands outside the approved project directory. Flag destructive operations and ask first.
- Do not commit secrets or real family data. Use synthetic test fixtures.

## Verification and reporting

- Test the changed behavior and relevant failure paths, including authorization failures.
- Run repository-supported lint, typecheck, tests, formatting checks, and production build when applicable.
- Record commands and outcomes in the work summary or `docs/scope.md`.
- Distinguish automated verification from manual checks and from checks not run.
- A feature is not done merely because the UI renders.
- Critical security, privacy, data-integrity, or migration findings block release.

## Scope and documentation

- `docs/scope.md` is the living source of truth for status and next work.
- `docs/product-requirements.md` describes intended product behavior.
- `docs/decision-log.md` records accepted decisions and superseded decisions.
- If implementation evidence contradicts a plan, update the plan openly rather than silently working around it.
- Keep root instruction files concise. Put detailed procedures in docs and skills.
