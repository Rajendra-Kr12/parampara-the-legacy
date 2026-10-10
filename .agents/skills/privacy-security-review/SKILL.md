---
name: privacy-security-review
description: Review Parampara changes involving personal information, addresses, city discovery, children, evidence, media, retention, deletion, authorization, or external AI services.
---

# Privacy and security review

1. Read `docs/privacy-and-governance.md` and `docs/agent-workflow.md`.
2. Identify sensitive data and its purpose.
3. Trace authorization from client request through server/data access and media delivery.
4. Verify consent and revocation paths.
5. Test direct API access, role escalation, cross-family access, expired links, and unauthorized reads/writes.
6. Check logs, analytics, error messages, prompts, and fixtures for personal data or secrets.
7. Review retention, archival copies, deletion requests, and backups.
8. Confirm AI output cannot bypass approval or authorization.
9. Report findings with severity, impact, reproduction, and required retest.
10. Critical privacy/security findings block release.
