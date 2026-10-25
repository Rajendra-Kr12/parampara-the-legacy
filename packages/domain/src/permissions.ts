/**
 * The single permission policy: `can(actor, action, resource, context)`. Every Convex
 * function and every client decides access here and nowhere else, so a rule is changed,
 * reviewed and tested in one place. Attribute based: rules read the actor (account
 * state, memberships, verified emails), the resource (group, owner, invitation state)
 * and the context (time). Every rule checks its denials first, and anything not
 * granted here is denied.
 */
import type { NormalizedEmail } from "@parampara/validation";
import type { AccountId, GroupId, PersonId } from "./ids";
import {
  effectiveInvitationState,
  findInvitationTransition,
  isPendingInvitationState,
  partyOf,
  type InvitationAction,
  type InvitationFacts,
} from "./invitation";
import type { Membership } from "./membership";

/** Account state is derived from the verified identity at call time (D-003, AC-2.01). */
export type AccountState = "verified" | "unverified";

export type Actor =
  | { readonly kind: "signedOut" }
  | {
      readonly kind: "account";
      readonly accountId: AccountId;
      readonly accountState: AccountState;
      /** The person record this account claimed, if any. */
      readonly personId: PersonId | null;
      readonly verifiedEmails: readonly NormalizedEmail[];
      readonly memberships: readonly Membership[];
    };

type AccountActor = Extract<Actor, { kind: "account" }>;

export interface GroupResource {
  readonly type: "group";
  readonly groupId: GroupId;
}

export interface PersonResource {
  readonly type: "person";
  readonly personId: PersonId;
  readonly groupId: GroupId;
}

export interface InvitationResource extends InvitationFacts {
  readonly type: "invitation";
  /**
   * Whether the invitee's account holds an active membership in another group, read by
   * the backend. Accepting would then give the account a second active group (D-059).
   */
  readonly inviteeHasActiveMembershipElsewhere: boolean;
}

export interface ClaimResource {
  readonly type: "claim";
  readonly groupId: GroupId;
  readonly proposerAccountId: AccountId;
  /** Reviewers eligible for this claim, computed server-side (D-023, Feature 5). */
  readonly eligibleReviewerAccountIds: readonly AccountId[];
}

export interface NoResource {
  readonly type: "none";
}

/** Each action and the resource it is checked against. */
export interface ResourceByAction {
  readonly "group.found": NoResource;
  readonly "group.readTree": GroupResource;
  readonly "person.readProfile": PersonResource;
  readonly "person.readPrivateDetails": PersonResource;
  readonly "person.updateOwnProfile": PersonResource;
  readonly "invitation.create": GroupResource;
  readonly "invitation.view": InvitationResource;
  readonly "invitation.resend": InvitationResource;
  readonly "invitation.confirm": InvitationResource;
  readonly "invitation.correct": InvitationResource;
  readonly "invitation.disclose": InvitationResource;
  readonly "invitation.reject": InvitationResource;
  readonly "claim.propose": GroupResource;
  readonly "claim.review": ClaimResource;
}

export type Action = keyof ResourceByAction;

export interface PolicyContext {
  readonly nowMs: number;
}

export type DenialReason =
  | "signed_out"
  | "account_not_verified"
  | "membership_pending"
  | "not_a_member"
  | "already_in_a_group"
  | "not_own_record"
  | "not_a_party"
  | "invitation_expired"
  | "invitation_closed"
  | "action_not_allowed"
  | "own_statement"
  | "proposer_cannot_review"
  | "not_an_eligible_reviewer";

export type Decision =
  { readonly allowed: true } | { readonly allowed: false; readonly reason: DenialReason };

const allow: Decision = { allowed: true };
const deny = (reason: DenialReason): Decision => ({ allowed: false, reason });

/**
 * What a pending member may do (AC-2.22, AC-2.24): see their own profile and the
 * pending invitation (which shows the inviter's display name), and act on that
 * invitation as its invitee. Everything else in that group is denied, and founding a
 * group is denied while any membership is pending. Every action must appear, so a new
 * action has to be classified here.
 */
export const PENDING_MEMBER_CAPABILITIES: Readonly<Record<Action, boolean>> = {
  "group.found": false,
  "group.readTree": false,
  "person.readProfile": true,
  "person.readPrivateDetails": true,
  "person.updateOwnProfile": true,
  "invitation.create": false,
  "invitation.view": true,
  "invitation.resend": false,
  "invitation.confirm": true,
  "invitation.correct": true,
  "invitation.disclose": true,
  "invitation.reject": true,
  "claim.propose": false,
  "claim.review": false,
};

type Rule<A extends Action> = (
  actor: AccountActor,
  resource: ResourceByAction[A],
  context: PolicyContext,
) => Decision;

function membershipIn(actor: AccountActor, groupId: GroupId): Membership | undefined {
  return actor.memberships.find((m) => m.groupId === groupId && m.state !== "ended");
}

/** Allowed only for an active member of `groupId`; a pending member is told so. */
function requireActiveMember(actor: AccountActor, groupId: GroupId): Decision {
  const membership = membershipIn(actor, groupId);
  if (membership === undefined) {
    return deny("not_a_member");
  }
  return membership.state === "active" ? allow : deny("membership_pending");
}

/** Own records only: a pending member's own profile, and nobody else's private details. */
function requireOwnPerson(actor: AccountActor, resource: PersonResource): Decision {
  return actor.personId !== null && actor.personId === resource.personId
    ? allow
    : deny("not_own_record");
}

/** Shared by every invitation action that moves state, through the one transition table. */
function invitationTransitionRule(
  action: InvitationAction,
): Rule<`invitation.${InvitationAction}`> {
  return (actor, invitation, context) => {
    const party = partyOf(invitation, actor);
    if (party === null) {
      return deny("not_a_party");
    }
    const state = effectiveInvitationState(invitation, context.nowMs);
    if (state === "expired") {
      return deny("invitation_expired");
    }
    if (!isPendingInvitationState(state)) {
      return deny("invitation_closed");
    }
    const transition = findInvitationTransition(state, action, party);
    if (transition === undefined) {
      return deny("action_not_allowed");
    }
    if (
      action === "confirm" &&
      (invitation.statement === null || invitation.statement.statedBy === party)
    ) {
      return deny("own_statement");
    }
    if (party === "inviter") {
      const inviterMembership = requireActiveMember(actor, invitation.groupId);
      if (!inviterMembership.allowed) {
        return inviterMembership;
      }
    }
    if (transition.to === "accepted") {
      const actorActiveElsewhere =
        party === "invitee" &&
        actor.memberships.some((m) => m.state === "active" && m.groupId !== invitation.groupId);
      if (actorActiveElsewhere || invitation.inviteeHasActiveMembershipElsewhere) {
        return deny("already_in_a_group");
      }
    }
    return allow;
  };
}

const rules: { readonly [A in Action]: Rule<A> } = {
  "group.found": (actor) =>
    // One active group per account (D-059); a pending member may do nothing else.
    actor.memberships.some((m) => m.state === "active") ? deny("already_in_a_group") : allow,
  "group.readTree": (actor, group) => requireActiveMember(actor, group.groupId),
  "person.readProfile": (actor, person) =>
    requireOwnPerson(actor, person).allowed ? allow : requireActiveMember(actor, person.groupId),
  // Contact details and address: the subject only. An administrator gets no blanket
  // access to private records (docs/privacy-and-governance.md).
  "person.readPrivateDetails": (actor, person) => requireOwnPerson(actor, person),
  "person.updateOwnProfile": (actor, person) => requireOwnPerson(actor, person),
  "invitation.create": (actor, group) => requireActiveMember(actor, group.groupId),
  // Both parties see only the current, pending invitation (D-070). The invitee needs a
  // pending membership in its group (AC-2.22) and the inviter an active one; outcomes
  // reach the inviter by notification (AC-2.21) and an expired invitation is replaced
  // by a fresh one (AC-2.16), neither of which reads the old record.
  "invitation.view": (actor, invitation, context) => {
    const party = partyOf(invitation, actor);
    if (party === null) {
      return deny("not_a_party");
    }
    const state = effectiveInvitationState(invitation, context.nowMs);
    if (state === "expired") {
      return deny("invitation_expired");
    }
    if (!isPendingInvitationState(state)) {
      return deny("invitation_closed");
    }
    if (party === "inviter") {
      return requireActiveMember(actor, invitation.groupId);
    }
    return membershipIn(actor, invitation.groupId)?.state === "pending"
      ? allow
      : deny("not_a_member");
  },
  "invitation.resend": (actor, invitation, context) => {
    if (partyOf(invitation, actor) !== "inviter") {
      return deny("not_a_party");
    }
    const state = effectiveInvitationState(invitation, context.nowMs);
    if (state === "expired") {
      return deny("invitation_expired");
    }
    if (!isPendingInvitationState(state)) {
      return deny("invitation_closed");
    }
    return requireActiveMember(actor, invitation.groupId);
  },
  "invitation.confirm": invitationTransitionRule("confirm"),
  "invitation.correct": invitationTransitionRule("correct"),
  "invitation.disclose": invitationTransitionRule("disclose"),
  "invitation.reject": invitationTransitionRule("reject"),
  "claim.propose": (actor, group) => requireActiveMember(actor, group.groupId),
  // Feature 5 builds review; this is the necessary condition it must keep.
  "claim.review": (actor, claim) => {
    const membership = requireActiveMember(actor, claim.groupId);
    if (!membership.allowed) {
      return membership;
    }
    if (claim.proposerAccountId === actor.accountId) {
      return deny("proposer_cannot_review");
    }
    return claim.eligibleReviewerAccountIds.includes(actor.accountId)
      ? allow
      : deny("not_an_eligible_reviewer");
  },
};

/**
 * Decides whether `actor` may perform `action` on `resource`. Denials come first: a
 * signed-out caller, an unverified account, and a pending member outside the
 * pending-member capabilities are refused before any action rule runs.
 */
export function can<A extends Action>(
  actor: Actor,
  action: A,
  resource: ResourceByAction[A],
  context: PolicyContext,
): Decision {
  if (actor.kind === "signedOut") {
    return deny("signed_out");
  }
  if (actor.accountState !== "verified") {
    return deny("account_not_verified");
  }
  // The pending-member limits apply in the group the resource belongs to; an action
  // with no group (founding) is limited by a pending membership anywhere.
  const groupId = "groupId" in resource ? resource.groupId : null;
  const pendingHere = actor.memberships.some(
    (m) => m.state === "pending" && (groupId === null || m.groupId === groupId),
  );
  if (pendingHere && !PENDING_MEMBER_CAPABILITIES[action]) {
    return deny("membership_pending");
  }
  const rule: Rule<A> = rules[action];
  return rule(actor, resource, context);
}

/**
 * Fixed, non-revealing text for refusals a person sees while using an invitation link.
 * None of them names a group, a member or the invited address (AC-2.15, D-059, D-066).
 */
export const INVITATION_REFUSAL_MESSAGES = {
  not_a_party: "Sign in with the address the invitation was sent to.",
  already_in_a_group: "You already belong to a family group, so you can't join another one yet.",
  invitation_expired: "This invitation has expired. Ask for a new one.",
  invitation_closed: "This invitation can no longer be used.",
} as const satisfies Partial<Record<DenialReason, string>>;
