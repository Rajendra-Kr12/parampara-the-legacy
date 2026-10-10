---
name: privacy-security-review
description: Review Parampara changes involving personal information, phone or email, addresses, city discovery, children, evidence, photos or audio, retention, deletion, authentication (Clerk), authorization (Convex functions), media access (R2 signed URLs), secrets, or external AI services. Use before merging any such change.
---

# Privacy and security review

1. Read `docs/privacy-and-governance.md`, `docs/architecture.md` (security boundaries), and `docs/agent-workflow.md`.
2. Identify the sensitive data touched and the purpose for each field.
3. Trace authorization from client request to Convex function to data and media:
   - every public Convex query, mutation, and action checks the Clerk identity from `ctx.auth`;
   - privileged operations use internal functions, never public ones;
   - client-supplied roles, relationships, eligibility, and consent flags are ignored.
4. Media: R2 objects are private; presigned URLs are issued only after an authorization check and expire quickly; revoked access stops future URL issuance.
5. Secrets: none in source, docs, fixtures, prompts, or logs; none in `NEXT_PUBLIC_*` or `EXPO_PUBLIC_*` variables (those ship to clients); Clerk webhook signatures verified.
6. Consent: city discovery and contact sharing require explicit consent; revocation takes effect on the next query.
7. Attack tests: direct Convex function calls without the UI, role escalation, cross-family access, expired or replayed invitation links, leaked or expired media URLs, unauthorized reads and writes.
8. Check logs, analytics, error messages, prompts, and fixtures for personal data.
9. Review retention, archival copies, deletion requests, and backups.
10. Confirm AI output (including the Laya router) cannot bypass approval or authorization and never receives family data.
11. Report findings with severity, impact, reproduction, and required retest. Critical privacy or security findings block release.
