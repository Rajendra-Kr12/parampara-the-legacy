import { normalizeEmail, type NormalizedEmail } from "@parampara/validation";
import { describe, expect, it } from "vitest";
import type { Membership } from "./membership";
import {
  INVITATION_REFUSAL_MESSAGES,
  PENDING_MEMBER_CAPABILITIES,
  can,
  type Action,
  type Actor,
  type ClaimResource,
  type GroupResource,
  type InvitationResource,
  type PersonResource,
  type ResourceByAction,
} from "./permissions";
import { invitationExpiresAt } from "./policy-config";

// Synthetic people from docs/acceptance-criteria.md: Kiran administers group A, Anil is
// a member of A, Hari is invited to A and pending, Zed belongs nowhere, Bala administers B.
const now = Date.UTC(2026, 9, 10);
const context = { nowMs: now };

function email(value: string): NormalizedEmail {
  const result = normalizeEmail(value);
  if (!result.ok) {
    throw new Error("test fixture email is invalid");
  }
  return result.email;
}

type AccountActor = Extract<Actor, { kind: "account" }>;

function account(
  name: string,
  memberships: readonly Membership[],
  overrides: Partial<AccountActor> = {},
): Actor {
  return {
    kind: "account",
    accountId: `acct-${name}`,
    accountState: "verified",
    personId: name,
    verifiedEmails: [email(`${name}@example.com`)],
    memberships,
    ...overrides,
  };
}

const kiran = account("kiran", [{ groupId: "group-a", state: "active", role: "administrator" }]);
const anil = account("anil", [{ groupId: "group-a", state: "active", role: "member" }]);
const hari = account("hari", [{ groupId: "group-a", state: "pending" }]);
const zed = account("zed", []);
const bala = account("bala", [{ groupId: "group-b", state: "active", role: "administrator" }]);
const signedOut: Actor = { kind: "signedOut" };
const unverified = account(
  "kiran",
  [{ groupId: "group-a", state: "active", role: "administrator" }],
  {
    accountState: "unverified",
  },
);

const groupA: GroupResource = { type: "group", groupId: "group-a" };
const groupB: GroupResource = { type: "group", groupId: "group-b" };
const person = (personId: string, groupId = "group-a"): PersonResource => ({
  type: "person",
  personId,
  groupId,
});

function invitation(overrides: Partial<InvitationResource> = {}): InvitationResource {
  return {
    type: "invitation",
    id: "inv-1",
    groupId: "group-a",
    inviterAccountId: "acct-kiran",
    invitee: { email: email("hari@example.com"), accountId: null },
    state: "awaitingInvitee",
    statement: { term: "cousin", subject: "invitee", statedBy: "inviter" },
    expiresAt: invitationExpiresAt(now),
    inviteeHasActiveMembershipElsewhere: false,
    ...overrides,
  };
}
const awaitingInviter = invitation({
  state: "awaitingInviter",
  statement: { term: "nephew", subject: "invitee", statedBy: "invitee" },
});
const awaitingDisclosure = invitation({ state: "awaitingDisclosure", statement: null });

const claim: ClaimResource = {
  type: "claim",
  groupId: "group-a",
  proposerAccountId: "acct-anil",
  eligibleReviewerAccountIds: ["acct-kiran", "acct-anil"],
};

/** One group-A resource for every action, so a table can sweep all of them. */
const sample: { readonly [A in Action]: ResourceByAction[A] } = {
  "group.found": { type: "none" },
  "group.readTree": groupA,
  "person.readProfile": person("kiran"),
  "person.readPrivateDetails": person("kiran"),
  "person.updateOwnProfile": person("kiran"),
  "invitation.create": groupA,
  "invitation.view": invitation(),
  "invitation.resend": invitation(),
  "invitation.confirm": invitation(),
  "invitation.correct": invitation(),
  "invitation.disclose": awaitingDisclosure,
  "invitation.reject": invitation(),
  "claim.propose": groupA,
  "claim.review": claim,
};
const allActions = Object.keys(sample) as Action[];

function check<A extends Action>(actor: Actor, action: A, resource: ResourceByAction[A]) {
  return can(actor, action, resource, context);
}

describe("can(actor, action, resource)", () => {
  describe("denials", () => {
    it.each(allActions)("a signed-out caller is denied %s", (action) => {
      expect(check(signedOut, action, sample[action])).toEqual({
        allowed: false,
        reason: "signed_out",
      });
    });

    it.each(allActions)("AC-2.01 an unverified account is denied %s", (action) => {
      expect(check(unverified, action, sample[action])).toEqual({
        allowed: false,
        reason: "account_not_verified",
      });
    });

    it.each(allActions.filter((action) => !PENDING_MEMBER_CAPABILITIES[action]))(
      "AC-2.24 a pending member is denied %s",
      (action) => {
        expect(check(hari, action, sample[action])).toEqual({
          allowed: false,
          reason: "membership_pending",
        });
      },
    );

    it.each<[string, () => unknown, string]>([
      [
        "AC-2.22 pending member reads another person's profile",
        () => check(hari, "person.readProfile", person("kiran")),
        "membership_pending",
      ],
      [
        "AC-2.22 pending member reads another person's contact details",
        () => check(hari, "person.readPrivateDetails", person("kiran")),
        "not_own_record",
      ],
      [
        "AC-2.22 pending member edits another person's profile",
        () => check(hari, "person.updateOwnProfile", person("kiran")),
        "not_own_record",
      ],
      [
        "AC-2.22 pending member views someone else's invitation",
        () =>
          check(
            hari,
            "invitation.view",
            invitation({ invitee: { email: email("ravi@example.com"), accountId: null } }),
          ),
        "not_a_party",
      ],
      [
        "AC-2.24 pending member sends an invitation",
        () => check(hari, "invitation.create", groupA),
        "membership_pending",
      ],
      [
        "AC-2.24 pending member proposes a claim",
        () => check(hari, "claim.propose", groupA),
        "membership_pending",
      ],
      [
        "AC-2.24 pending member reviews a claim",
        () => check(hari, "claim.review", { ...claim, eligibleReviewerAccountIds: ["acct-hari"] }),
        "membership_pending",
      ],
      [
        "AC-2.25 third party confirms",
        () => check(anil, "invitation.confirm", invitation()),
        "not_a_party",
      ],
      [
        "AC-2.25 third party corrects",
        () => check(anil, "invitation.correct", invitation()),
        "not_a_party",
      ],
      [
        "AC-2.25 third party rejects",
        () => check(anil, "invitation.reject", invitation()),
        "not_a_party",
      ],
      [
        "AC-2.25 third party confirms a correction for the inviter",
        () => check(anil, "invitation.confirm", awaitingInviter),
        "not_a_party",
      ],
      [
        "AC-2.26 inviter confirms their own statement",
        () => check(kiran, "invitation.confirm", invitation()),
        "action_not_allowed",
      ],
      [
        "AC-2.26 invitee confirms their own correction",
        () => check(hari, "invitation.confirm", awaitingInviter),
        "action_not_allowed",
      ],
      [
        "AC-2.26 stating party confirms when state and statement disagree",
        () =>
          check(
            hari,
            "invitation.confirm",
            invitation({ statement: { term: "cousin", subject: "invitee", statedBy: "invitee" } }),
          ),
        "own_statement",
      ],
      [
        "AC-2.19 an account without the invited email confirms",
        () => check(account("ravi", []), "invitation.confirm", invitation()),
        "not_a_party",
      ],
      [
        "AC-2.19 another account confirms an invitation bound to Hari",
        () =>
          check(
            account("imposter", [], { verifiedEmails: [email("hari@example.com")] }),
            "invitation.confirm",
            invitation({ invitee: { email: email("hari@example.com"), accountId: "acct-hari" } }),
          ),
        "not_a_party",
      ],
      [
        "AC-2.16 invitee confirms at the configured expiry",
        () => can(hari, "invitation.confirm", invitation({ expiresAt: now }), context),
        "invitation_expired",
      ],
      [
        "AC-2.16 inviter resends an expired invitation",
        () => can(kiran, "invitation.resend", invitation({ expiresAt: now }), context),
        "invitation_expired",
      ],
      [
        "AC-2.17 invitee confirms an accepted invitation again",
        () => check(hari, "invitation.confirm", invitation({ state: "accepted" })),
        "invitation_closed",
      ],
      [
        "AC-2.17 invitee rejects a rejected invitation",
        () => check(hari, "invitation.reject", invitation({ state: "rejected" })),
        "invitation_closed",
      ],
      [
        "AC-2.27 non-member invites into group A",
        () => check(zed, "invitation.create", groupA),
        "not_a_member",
      ],
      [
        "AC-2.27 non-member reads group A's tree",
        () => check(zed, "group.readTree", groupA),
        "not_a_member",
      ],
      [
        "AC-2.27 non-member reads a group A profile",
        () => check(zed, "person.readProfile", person("kiran")),
        "not_a_member",
      ],
      [
        "AC-2.27 non-member views a group A invitation",
        () => check(zed, "invitation.view", invitation()),
        "not_a_party",
      ],
      [
        "AC-2.22 pending invitee views an old rejected invitation",
        () => check(hari, "invitation.view", invitation({ state: "rejected" })),
        "invitation_closed",
      ],
      [
        "AC-2.22 pending invitee views an old accepted invitation",
        () => check(hari, "invitation.view", invitation({ state: "accepted" })),
        "invitation_closed",
      ],
      [
        "AC-2.22 AC-2.16 pending invitee views an invitation stored as expired",
        () => check(hari, "invitation.view", invitation({ state: "expired" })),
        "invitation_expired",
      ],
      [
        "AC-2.22 AC-2.16 pending invitee views an invitation past its configured expiry",
        () => check(hari, "invitation.view", invitation({ expiresAt: now })),
        "invitation_expired",
      ],
      [
        "AC-2.22 an account pending in group A views its pending invitation into group B",
        () => check(hari, "invitation.view", invitation({ groupId: "group-b" })),
        "not_a_member",
      ],
      [
        "D-070 active inviter views an invitation the invitee declined",
        () => check(kiran, "invitation.view", invitation({ state: "rejected" })),
        "invitation_closed",
      ],
      [
        "D-070 active inviter views an accepted invitation",
        () => check(kiran, "invitation.view", invitation({ state: "accepted" })),
        "invitation_closed",
      ],
      [
        "D-070 AC-2.16 active inviter views an invitation past its configured expiry",
        () => check(kiran, "invitation.view", invitation({ expiresAt: now })),
        "invitation_expired",
      ],
      [
        "AC-2.27 an inviter whose membership ended views their invitation",
        () =>
          check(
            account("kiran", [{ groupId: "group-a", state: "ended" }]),
            "invitation.view",
            invitation(),
          ),
        "not_a_member",
      ],
      [
        "AC-2.24 an inviter whose membership is pending views their invitation",
        () =>
          check(
            account("kiran", [{ groupId: "group-a", state: "pending" }]),
            "invitation.view",
            invitation(),
          ),
        "membership_pending",
      ],
      [
        "AC-2.28 group A administrator invites into group B",
        () => check(kiran, "invitation.create", groupB),
        "not_a_member",
      ],
      [
        "AC-2.28 group A administrator reads group B's tree",
        () => check(kiran, "group.readTree", groupB),
        "not_a_member",
      ],
      [
        "AC-2.28 group B administrator reads group A's tree",
        () => check(bala, "group.readTree", groupA),
        "not_a_member",
      ],
      [
        "AC-2.28 group B administrator reads a group A profile",
        () => check(bala, "person.readProfile", person("anil")),
        "not_a_member",
      ],
      [
        "an administrator reads a member's contact details",
        () => check(kiran, "person.readPrivateDetails", person("anil")),
        "not_own_record",
      ],
      [
        "an account with no person record reads private details",
        () =>
          check(account("new", [], { personId: null }), "person.readPrivateDetails", person("new")),
        "not_own_record",
      ],
      [
        "D-059 an active member founds a second group",
        () => check(kiran, "group.found", { type: "none" }),
        "already_in_a_group",
      ],
      [
        "D-059 invitee active in group B accepts into group A",
        () =>
          check(
            account("hari", [{ groupId: "group-b", state: "active", role: "member" }]),
            "invitation.confirm",
            invitation(),
          ),
        "already_in_a_group",
      ],
      [
        "D-059 inviter accepts for an invitee active elsewhere",
        () =>
          check(kiran, "invitation.confirm", {
            ...awaitingInviter,
            inviteeHasActiveMembershipElsewhere: true,
          }),
        "already_in_a_group",
      ],
      [
        "an inviter whose membership is pending confirms",
        () =>
          check(
            account("kiran", [{ groupId: "group-a", state: "pending" }]),
            "invitation.confirm",
            awaitingInviter,
          ),
        "membership_pending",
      ],
      [
        "an inviter whose membership ended confirms",
        () =>
          check(
            account("kiran", [{ groupId: "group-a", state: "ended" }]),
            "invitation.confirm",
            awaitingInviter,
          ),
        "not_a_member",
      ],
      [
        "the invitee resends",
        () => check(hari, "invitation.resend", invitation()),
        "membership_pending",
      ],
      [
        "an active invitee resends",
        () => check(account("hari", []), "invitation.resend", invitation()),
        "not_a_party",
      ],
      [
        "the inviter withdraws while awaiting the invitee",
        () => check(kiran, "invitation.reject", invitation()),
        "action_not_allowed",
      ],
      [
        "the proposer reviews their own claim",
        () => check(anil, "claim.review", claim),
        "proposer_cannot_review",
      ],
      [
        "an ineligible member reviews a claim",
        () =>
          check(
            account("ravi", [{ groupId: "group-a", state: "active", role: "member" }]),
            "claim.review",
            claim,
          ),
        "not_an_eligible_reviewer",
      ],
    ])("%s", (_name, decide, reason) => {
      expect(decide()).toEqual({ allowed: false, reason });
    });
  });

  describe("allowed", () => {
    it.each<[string, () => unknown]>([
      [
        "AC-2.22 pending member reads their own profile",
        () => check(hari, "person.readProfile", person("hari")),
      ],
      [
        "AC-2.22 pending member reads their own contact details",
        () => check(hari, "person.readPrivateDetails", person("hari")),
      ],
      [
        "AC-2.22 pending member views their pending invitation",
        () => check(hari, "invitation.view", invitation()),
      ],
      [
        "AC-2.22 pending invitee views their current invitation awaiting their reply",
        () => check(hari, "invitation.view", awaitingInviter),
      ],
      [
        "AC-2.22 pending invitee views their current invitation awaiting disclosure",
        () => check(hari, "invitation.view", awaitingDisclosure),
      ],
      [
        "AC-2.06 active inviter views their pending invitation",
        () => check(kiran, "invitation.view", invitation()),
      ],
      [
        "AC-2.07 invitee confirms the inviter's statement",
        () => check(hari, "invitation.confirm", invitation()),
      ],
      [
        "AC-2.08 invitee corrects the inviter's statement",
        () => check(hari, "invitation.correct", invitation()),
      ],
      [
        "AC-2.08 inviter confirms the invitee's correction",
        () => check(kiran, "invitation.confirm", awaitingInviter),
      ],
      [
        "AC-2.09 invitee discloses a relationship",
        () => check(hari, "invitation.disclose", awaitingDisclosure),
      ],
      ["AC-2.21 invitee rejects", () => check(hari, "invitation.reject", invitation())],
      [
        "AC-2.21 inviter declines a correction",
        () => check(kiran, "invitation.reject", awaitingInviter),
      ],
      [
        "D-059 invitee active elsewhere may still decline",
        () =>
          check(
            account("hari", [{ groupId: "group-b", state: "active", role: "member" }]),
            "invitation.reject",
            invitation(),
          ),
      ],
      ["AC-2.06 member invites into their group", () => check(anil, "invitation.create", groupA)],
      [
        "inviter views and resends their pending invitation",
        () =>
          check(kiran, "invitation.view", invitation()).allowed &&
          check(kiran, "invitation.resend", invitation()),
      ],
      ["member reads the group tree", () => check(anil, "group.readTree", groupA)],
      [
        "member reads another member's profile",
        () => check(anil, "person.readProfile", person("kiran")),
      ],
      [
        "an active member of A with a pending invitation into B keeps working in A",
        () =>
          check(
            account("anil", [
              { groupId: "group-a", state: "active", role: "member" },
              { groupId: "group-b", state: "pending" },
            ]),
            "group.readTree",
            groupA,
          ),
      ],
      [
        "D-059 a verified account with no group founds one",
        () => check(zed, "group.found", { type: "none" }),
      ],
      [
        "an eligible reviewer who did not propose reviews a claim",
        () => check(kiran, "claim.review", claim),
      ],
    ])("%s", (_name, decide) => {
      expect(decide()).toEqual({ allowed: true });
    });
  });

  it("classifies every action for pending members", () => {
    expect(Object.keys(PENDING_MEMBER_CAPABILITIES).sort()).toEqual([...allActions].sort());
  });

  it("D-059 D-066 refusal messages name no group, member or address", () => {
    for (const message of Object.values(INVITATION_REFUSAL_MESSAGES)) {
      expect(message).not.toMatch(/group-|acct-|@|kiran|hari/i);
    }
    expect(INVITATION_REFUSAL_MESSAGES.not_a_party).toBe(
      "Sign in with the address the invitation was sent to.",
    );
  });
});
