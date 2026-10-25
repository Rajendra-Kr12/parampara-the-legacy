/**
 * Family group membership and roles (docs/domain-model.md, D-059, AC-2.10).
 * Nobody becomes an active member without a relationship confirmed by the other party;
 * founding a group is the single recorded exception.
 */
import type { GroupId } from "./ids";

export type MembershipState = "pending" | "active" | "ended";

/** Roles attach only to an active membership and are scoped to its group (AC-2.28). */
export type Role = "member" | "administrator";

export type Membership =
  | { readonly groupId: GroupId; readonly state: "active"; readonly role: Role }
  | { readonly groupId: GroupId; readonly state: "pending" | "ended" };

/** What moved a membership. Feature 8 adds leaving and removal (active to ended). */
export type MembershipCause =
  | "founded_group"
  | "signed_in_through_invitation"
  | "invitation_accepted"
  | "invitation_rejected"
  | "invitation_expired";

interface MembershipTransition {
  readonly from: MembershipState | "none";
  readonly cause: MembershipCause;
  readonly to: MembershipState;
}

/** Every membership transition Feature 2 allows. Anything else is refused. */
export const MEMBERSHIP_TRANSITIONS: readonly MembershipTransition[] = [
  { from: "none", cause: "founded_group", to: "active" },
  { from: "none", cause: "signed_in_through_invitation", to: "pending" },
  { from: "pending", cause: "invitation_accepted", to: "active" },
  { from: "pending", cause: "invitation_rejected", to: "ended" },
  { from: "pending", cause: "invitation_expired", to: "ended" },
];

/**
 * The state `cause` moves a membership to, or null when the move is not allowed. An
 * ended membership never comes back; joining again takes a fresh invitation.
 */
export function nextMembershipState(
  from: MembershipState | "none",
  cause: MembershipCause,
): MembershipState | null {
  return MEMBERSHIP_TRANSITIONS.find((t) => t.from === from && t.cause === cause)?.to ?? null;
}

/** The role a membership gets when it becomes active (D-059: the founder administers). */
export function roleOnActivation(cause: "founded_group" | "invitation_accepted"): Role {
  return cause === "founded_group" ? "administrator" : "member";
}
