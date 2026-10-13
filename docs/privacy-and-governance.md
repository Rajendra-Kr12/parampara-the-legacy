# Privacy, Consent, Evidence, and Governance

## Defaults

- Phone number and email: private unless the individual explicitly shares them.
- Exact residential address: required for self-registering living members (D-017) but private to them by default; never shown to other members.
- City/locality discovery: opt-in.
- Children: guardian-managed, with age-appropriate safeguards.
- Historical evidence: restricted to assigned/authorized reviewers.
- Personal memories: contributor-controlled, subject to clearly disclosed preservation and legal rules.
- Family administrator: no blanket access to every private record.
- Imported relationship: unverified until its applicable workflow completes.

## Access control

Enforce access in the backend/data layer, not just in client rendering. Test both allowed and denied access. Every API and media-access path must apply the same policy.

### Users table (`packages/backend/convex/schema.ts`)

Any Convex function that reads or writes the `users` table must:

- derive `tokenIdentifier` from `ctx.auth.getUserIdentity()`, never from client arguments;
- filter only by the caller's own `tokenIdentifier`, so it can never return or change another account's row;
- handle the signed-out case, where the identity is `null`, explicitly.

Roles may include member, reviewer, family administrator, contributor, and guardian. Roles are scoped; an administrator of one family group does not automatically administer another family group.

## Consent

Store the subject, purpose, scope, granted state, timestamp, source, and revocation. City discovery and optional sharing of contact details require explicit consent. Revocation must take effect in future queries and access decisions.

## Historical evidence

Evidence records should capture type, source, submitter, associated claim, reviewer, decision, and relevant timestamps. Avoid logging document contents or private testimony in operational logs. Access should be limited to people who need it to review the claim.

## Disputes

- Conflicting dates remain uncertain or disputed until credible evidence supports resolution.
- Administrators can resolve escalated disputes but must record the basis of the decision.
- Multiple story versions may coexist during review.
- A story unresolved after 60 days moves to the contributor's private draft, subject to a documented exception. Timer, visibility, extension, and exceptions are owned by D-026.
- Disagreement on one field does not automatically invalidate an entire person's profile.

## Archival preservation and deletion

Parampara's policy is contributor ownership with family-level preservation rules. Do not implement unconditional permanent retention. Define:
- which content qualifies for archival preservation
- who can access retained copies
- retention periods and review dates
- account closure and deletion request handling
- backup expiration and restoration behavior
- legal holds or mandatory deletion/restriction exceptions
- audit events that can be retained without preserving the deleted content itself

The application must explain preservation rules to contributors before publication. Apply applicable law and counsel guidance to final policy; this document is not legal advice.

## Security requirements

- Secure, expiring invitation tokens with replay protection.
- Least-privilege database and service credentials.
- Private media buckets and short-lived signed URLs.
- Input validation at API boundaries.
- Rate limits and abuse protection appropriate to actual threat models.
- Safe error messages for users; detailed but privacy-conscious server logs.
- Secret scanning and no credentials in repository docs, fixtures, or prompts.
- Tested backup restoration and deletion behavior.
- Audited administrative actions.
