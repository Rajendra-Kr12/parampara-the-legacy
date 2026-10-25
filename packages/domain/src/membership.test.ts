import { describe, expect, it } from "vitest";
import {
  nextMembershipState,
  roleOnActivation,
  type MembershipCause,
  type MembershipState,
} from "./membership";

const causes: readonly MembershipCause[] = [
  "founded_group",
  "signed_in_through_invitation",
  "invitation_accepted",
  "invitation_rejected",
  "invitation_expired",
];

describe("membership", () => {
  describe("AC-2.10 nobody becomes active without a confirmed relationship, except the founder", () => {
    it("a new membership becomes active only by founding the group", () => {
      const activating = causes.filter((cause) => nextMembershipState("none", cause) === "active");
      expect(activating).toEqual(["founded_group"]);
    });

    it("a pending membership becomes active only when the invitation is accepted", () => {
      const activating = causes.filter(
        (cause) => nextMembershipState("pending", cause) === "active",
      );
      expect(activating).toEqual(["invitation_accepted"]);
    });

    it("signing in through an invitation leaves the invitee pending", () => {
      expect(nextMembershipState("none", "signed_in_through_invitation")).toBe("pending");
    });

    it.each<[MembershipState, MembershipCause]>(
      causes.flatMap((cause) => [["active", cause] as const, ["ended", cause] as const]),
    )("refuses %s by %s (an ended membership never comes back)", (from, cause) => {
      expect(nextMembershipState(from, cause)).toBeNull();
    });

    it.each(["invitation_rejected", "invitation_expired"] as const)(
      "a %s ends a pending membership",
      (cause) => {
        expect(nextMembershipState("pending", cause)).toBe("ended");
      },
    );
  });

  it("the founder administers the group and an accepted invitee is a member (D-059)", () => {
    expect(roleOnActivation("founded_group")).toBe("administrator");
    expect(roleOnActivation("invitation_accepted")).toBe("member");
  });
});
