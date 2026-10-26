/**
 * Invitation state machine (docs/domain-model.md "Invitation", AC-2.06 to AC-2.10,
 * AC-2.16, AC-2.17, AC-2.21, AC-2.25, AC-2.26). One transition table decides which
 * party may do what in which state; `can()` reads the same table, so authorization and
 * state rules cannot drift apart.
 */
import { normalizeEmail, type NormalizedEmail } from "@parampara/validation";
import type { AccountId, GroupId, InvitationId } from "./ids";
import { invitationExpiresAt, isPastExpiry } from "./policy-config";
import {
  buildAcceptedRelationship,
  type AcceptedRelationship,
  type AcceptingParties,
  type DirectEdge,
  type GraphRejection,
  type Party,
  type StatedRelationship,
} from "./relationship-graph";
import { parseTermCode } from "./relationship-terms";

/** The sub-states of `pending` (AC-2.06). */
export type PendingInvitationState = "awaitingInvitee" | "awaitingDisclosure" | "awaitingInviter";
export type InvitationState = PendingInvitationState | "accepted" | "rejected" | "expired";

export type InvitationAction = "confirm" | "correct" | "disclose" | "reject";

interface InvitationTransition {
  readonly from: PendingInvitationState;
  readonly action: InvitationAction;
  readonly by: Party;
  readonly to: InvitationState;
}

/**
 * Every allowed move. Only the other party confirms: never whoever made the current
 * statement (AC-2.26), and a third party is never a party at all (AC-2.25). Expiry is
 * not an action; it is applied by `effectiveInvitationState`.
 */
export const INVITATION_TRANSITIONS: readonly InvitationTransition[] = [
  { from: "awaitingInvitee", action: "confirm", by: "invitee", to: "accepted" },
  { from: "awaitingInvitee", action: "correct", by: "invitee", to: "awaitingInviter" },
  { from: "awaitingInvitee", action: "reject", by: "invitee", to: "rejected" },
  { from: "awaitingDisclosure", action: "disclose", by: "invitee", to: "awaitingInviter" },
  { from: "awaitingDisclosure", action: "reject", by: "invitee", to: "rejected" },
  { from: "awaitingInviter", action: "confirm", by: "inviter", to: "accepted" },
  { from: "awaitingInviter", action: "reject", by: "inviter", to: "rejected" },
  { from: "awaitingInviter", action: "reject", by: "invitee", to: "rejected" },
];

const pendingStates: ReadonlySet<InvitationState> = new Set<PendingInvitationState>([
  "awaitingInvitee",
  "awaitingDisclosure",
  "awaitingInviter",
]);

export function isPendingInvitationState(state: InvitationState): state is PendingInvitationState {
  return pendingStates.has(state);
}

export function findInvitationTransition(
  state: InvitationState,
  action: InvitationAction,
  by: Party,
): InvitationTransition | undefined {
  return INVITATION_TRANSITIONS.find((t) => t.from === state && t.action === action && t.by === by);
}

/** What the domain needs to know about a stored invitation. */
export interface InvitationFacts {
  readonly id: InvitationId;
  readonly groupId: GroupId;
  readonly inviterAccountId: AccountId;
  readonly invitee: {
    readonly email: NormalizedEmail;
    /** Set once the invitee signs in with the verified invited email. */
    readonly accountId: AccountId | null;
  };
  readonly state: InvitationState;
  /** Null only while awaiting disclosure. */
  readonly statement: StatedRelationship | null;
  readonly expiresAt: number;
}

/** A pending invitation past its expiry is expired, whether or not that was stored yet. */
export function effectiveInvitationState(
  invitation: InvitationFacts,
  nowMs: number,
): InvitationState {
  return isPendingInvitationState(invitation.state) && isPastExpiry(invitation.expiresAt, nowMs)
    ? "expired"
    : invitation.state;
}

/** The identity facts that decide whether an account is a party to an invitation. */
export interface PartyCandidate {
  readonly accountId: AccountId;
  readonly verifiedEmails: readonly NormalizedEmail[];
}

/**
 * The inviter, the invitee, or null for anyone else. Before the invitee is bound to an
 * account, only an account that has verified the invited email is the invitee
 * (AC-2.19, D-066); after that, only the bound account is.
 */
export function partyOf(invitation: InvitationFacts, candidate: PartyCandidate): Party | null {
  if (candidate.accountId === invitation.inviterAccountId) {
    return "inviter";
  }
  const { accountId, email } = invitation.invitee;
  const isInvitee =
    accountId === null
      ? candidate.verifiedEmails.includes(email)
      : candidate.accountId === accountId;
  return isInvitee ? "invitee" : null;
}

export type InvitationRefusal =
  | "invitation_expired"
  | "invitation_closed"
  | "action_not_allowed"
  | "own_statement"
  | "unsupported_term"
  | GraphRejection;

/** The parties' records needed to write the relationship when an invitation is accepted. */
export interface AcceptanceInput {
  readonly parties: AcceptingParties;
  /** Accepted typed edges read in the same mutation (pending ones are not facts). */
  readonly acceptedEdges: readonly DirectEdge[];
}

export type InvitationEvent =
  | { readonly action: "confirm"; readonly by: Party; readonly acceptance: AcceptanceInput }
  | { readonly action: "reject"; readonly by: Party }
  | {
      readonly action: "correct" | "disclose";
      readonly by: Party;
      /** Untrusted input: must be an exact canonical term code. */
      readonly term: unknown;
      readonly subject: Party;
    };

export type InvitationDecision =
  | {
      readonly ok: true;
      readonly state: InvitationState;
      readonly statement: StatedRelationship | null;
      /** Present exactly when the invitation becomes accepted. */
      readonly record: AcceptedRelationship | null;
    }
  | { readonly ok: false; readonly reason: InvitationRefusal };

/**
 * Applies one event. A refusal means nothing changes: no state move, no record. Call
 * `can()` first; this function re-checks the transition table but does not resolve who
 * the caller is.
 */
export function decideInvitationEvent(
  invitation: InvitationFacts,
  event: InvitationEvent,
  nowMs: number,
): InvitationDecision {
  const state = effectiveInvitationState(invitation, nowMs);
  if (state === "expired") {
    return { ok: false, reason: "invitation_expired" };
  }
  if (!isPendingInvitationState(state)) {
    return { ok: false, reason: "invitation_closed" };
  }
  const transition = findInvitationTransition(state, event.action, event.by);
  if (transition === undefined) {
    return { ok: false, reason: "action_not_allowed" };
  }
  switch (event.action) {
    case "reject":
      return { ok: true, state: transition.to, statement: invitation.statement, record: null };
    case "correct":
    case "disclose": {
      const term = parseTermCode(event.term);
      if (term === null) {
        return { ok: false, reason: "unsupported_term" };
      }
      const statement = { term, subject: event.subject, statedBy: event.by };
      return { ok: true, state: transition.to, statement, record: null };
    }
    case "confirm": {
      const { statement } = invitation;
      if (statement === null || statement.statedBy === event.by) {
        return { ok: false, reason: "own_statement" };
      }
      const built = buildAcceptedRelationship(
        statement,
        event.acceptance.parties,
        invitation.id,
        event.acceptance.acceptedEdges,
      );
      if (!built.ok) {
        return built;
      }
      return { ok: true, state: transition.to, statement, record: built.record };
    }
  }
}

export type NewInvitationRequest =
  | { readonly kind: "state"; readonly term: unknown; readonly subject: Party }
  | { readonly kind: "askToDisclose" };

export type NewInvitationRefusal =
  "missing_contact" | "invalid_contact" | "self_invitation" | "unsupported_term";

/**
 * Validates a new invitation: the contact, that it is not the inviter's own verified
 * email, and the stated term. Authorization (`can(actor, "invitation.create", ...)`)
 * and the limits in policy-config are checked separately.
 */
export function openInvitation(input: {
  readonly inviterVerifiedEmails: readonly NormalizedEmail[];
  readonly inviteeEmail: unknown;
  readonly request: NewInvitationRequest;
  readonly nowMs: number;
}):
  | {
      readonly ok: true;
      readonly channel: "email";
      readonly inviteeEmail: NormalizedEmail;
      readonly state: PendingInvitationState;
      readonly statement: StatedRelationship | null;
      readonly expiresAt: number;
    }
  | { readonly ok: false; readonly reason: NewInvitationRefusal } {
  const email = normalizeEmail(input.inviteeEmail);
  if (!email.ok) {
    return {
      ok: false,
      reason: email.reason === "missing" ? "missing_contact" : "invalid_contact",
    };
  }
  if (input.inviterVerifiedEmails.includes(email.email)) {
    return { ok: false, reason: "self_invitation" };
  }
  const base = {
    ok: true,
    channel: "email",
    inviteeEmail: email.email,
    expiresAt: invitationExpiresAt(input.nowMs),
  } as const;
  if (input.request.kind === "askToDisclose") {
    return { ...base, state: "awaitingDisclosure", statement: null };
  }
  const term = parseTermCode(input.request.term);
  if (term === null) {
    return { ok: false, reason: "unsupported_term" };
  }
  return {
    ...base,
    state: "awaitingInvitee",
    statement: { term, subject: input.request.subject, statedBy: "inviter" },
  };
}

/**
 * Re-inviting a contact with a pending invitation in the same group refreshes that
 * invitation instead of opening a second one (AC-2.20). An expired or closed invitation
 * is not refreshed; the inviter opens a fresh one.
 */
export function refreshInvitation(
  invitation: InvitationFacts,
  nowMs: number,
):
  | { readonly ok: true; readonly expiresAt: number }
  | { readonly ok: false; readonly reason: "invitation_expired" | "invitation_closed" } {
  const state = effectiveInvitationState(invitation, nowMs);
  if (state === "expired") {
    return { ok: false, reason: "invitation_expired" };
  }
  if (!isPendingInvitationState(state)) {
    return { ok: false, reason: "invitation_closed" };
  }
  return { ok: true, expiresAt: invitationExpiresAt(nowMs) };
}
