# Parampara review guidance

Parampara is a private family legacy app (web with Next.js, iOS and Android with Expo, Convex backend, Clerk auth, Cloudflare R2 media). It stores sensitive personal data about living and deceased family members. Review with privacy and relationship integrity as the top priorities, above style.

## What to flag

- Any path where a user can read or change another family's data, or a private field (phone, email, exact address, evidence, media) of someone in their own family without permission.
- A single `verified` boolean standing in for separate account, relationship, historical-claim, and content verification states.
- Unknown or disputed facts (for example a birth date) being stored or displayed as certain.
- A deceased profile becoming approved with fewer than three eligible approvals, unless exactly two approvals plus reviewed documentary evidence are present.
- AI or model output writing directly to verified family data without a human approval step.
- Personal data (names, addresses, story text, evidence) in logs, analytics events, error messages, or test fixtures. Fixtures must use synthetic families.
- Features that work on web but not on iOS or Android (or the reverse) without a stated reason in the PR.
- Kinship terms hard-coded in UI instead of computed by `packages/kinship-engine`.

## What not to flag

- Documentation-only wording preferences.
- Files under `.agents/` and `.claude/`, which are agent instructions.

## Pull request expectations

- The PR description lists checks actually run. Flag claims like "tests pass" when no test files or CI exist for the changed code.
- Durable decisions are recorded in `docs/decision-log.md` and progress in `docs/scope.md`.
