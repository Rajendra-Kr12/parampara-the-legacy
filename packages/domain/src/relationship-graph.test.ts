import { describe, expect, it } from "vitest";
import {
  ancestorsOf,
  buildAcceptedRelationship,
  canTransitionRelationship,
  checkDirectEdge,
  isGraphIndexProjectable,
  type AcceptingParties,
  type DirectEdge,
} from "./relationship-graph";

// Synthetic family: Ravi is Kiran's parent, Kiran is Hari's parent, Meena is Ravi's parent.
const parentOf = (parentPersonId: string, childPersonId: string): DirectEdge => ({
  type: "parent_child",
  parentPersonId,
  childPersonId,
});
const edges = [parentOf("ravi", "kiran"), parentOf("kiran", "hari"), parentOf("meena", "ravi")];

const parties: AcceptingParties = {
  inviter: { accountId: "acct-kiran", personId: "kiran" },
  invitee: { accountId: "acct-hari", personId: "hari" },
};

describe("relationship graph rules", () => {
  it("walks every ancestor through parent-child edges", () => {
    expect([...ancestorsOf("hari", edges)].sort()).toEqual(["kiran", "meena", "ravi"]);
    expect(ancestorsOf("meena", edges).size).toBe(0);
  });

  describe("AC-2.30 a person can never become their own ancestor", () => {
    it.each([
      ["self parent", "kiran", "kiran", "parent", "self_relationship"],
      ["self partner", "kiran", "kiran", "partner", "self_relationship"],
      ["child stated as parent", "hari", "kiran", "parent", "ancestor_cycle"],
      ["grandchild stated as parent", "hari", "meena", "parent", "ancestor_cycle"],
      ["grandparent stated as child", "meena", "hari", "child", "ancestor_cycle"],
      ["partner of own parent", "kiran", "ravi", "partner", "partner_is_ancestor"],
      ["partner of own grandchild", "meena", "hari", "partner", "partner_is_ancestor"],
    ] as const)("rejects %s", (_name, subject, target, term, reason) => {
      expect(checkDirectEdge(subject, target, term, edges)).toEqual({ ok: false, reason });
    });

    it.each([
      ["a new parent", "anil", "hari", "parent", parentOf("anil", "hari")],
      ["a new child", "anil", "kiran", "child", parentOf("kiran", "anil")],
      ["a second parent", "bala", "kiran", "parent", parentOf("bala", "kiran")],
    ] as const)("accepts %s", (_name, subject, target, term, edge) => {
      expect(checkDirectEdge(subject, target, term, edges)).toEqual({ ok: true, edge });
    });

    it("stores a partner edge unordered, so both directions are one edge", () => {
      const forward = checkDirectEdge("kiran", "anil", "partner", edges);
      const backward = checkDirectEdge("anil", "kiran", "partner", edges);
      expect(forward).toEqual({
        ok: true,
        edge: { type: "partner", personIds: ["anil", "kiran"] },
      });
      expect(backward).toEqual(forward);
    });

    it("allows partners who are cousins: overlapping paths are valid data", () => {
      const family = [
        parentOf("g", "p1"),
        parentOf("g", "p2"),
        parentOf("p1", "c1"),
        parentOf("p2", "c2"),
      ];
      expect(checkDirectEdge("c1", "c2", "partner", family).ok).toBe(true);
    });
  });

  describe("accepted relationship records (D-058 record contract)", () => {
    it("writes a direct statement as a typed edge, reading subject is the term of target", () => {
      const result = buildAcceptedRelationship(
        { term: "parent", subject: "inviter", statedBy: "inviter" },
        {
          inviter: { accountId: "acct-anil", personId: "anil" },
          invitee: { accountId: "acct-hari", personId: "hari" },
        },
        "inv-1",
        edges,
      );
      expect(result).toEqual({
        ok: true,
        record: {
          form: "edge",
          state: "accepted",
          edge: parentOf("anil", "hari"),
          statingActorId: "acct-anil",
          invitationId: "inv-1",
        },
      });
    });

    it("writes a kin_stated term as a record that is never an edge", () => {
      const result = buildAcceptedRelationship(
        { term: "uncle", subject: "invitee", statedBy: "inviter" },
        parties,
        "inv-2",
        edges,
      );
      expect(result).toEqual({
        ok: true,
        record: {
          form: "kin_stated",
          state: "accepted",
          subjectPersonId: "hari",
          targetPersonId: "kiran",
          termCode: "uncle",
          statingActorId: "acct-kiran",
          invitationId: "inv-2",
        },
      });
    });

    it("records the stating actor separately from the direction", () => {
      const result = buildAcceptedRelationship(
        { term: "cousin", subject: "inviter", statedBy: "invitee" },
        parties,
        "inv-3",
        [],
      );
      expect(result.ok && result.record.statingActorId).toBe("acct-hari");
      expect(
        result.ok && result.record.form === "kin_stated" && result.record.subjectPersonId,
      ).toBe("kiran");
    });

    it.each(["cousin", "parent"] as const)(
      "AC-2.30 rejects a %s statement between one person's own records",
      (term) => {
        const self = {
          inviter: parties.inviter,
          invitee: { accountId: "acct-other", personId: "kiran" },
        };
        expect(
          buildAcceptedRelationship(
            { term, subject: "invitee", statedBy: "inviter" },
            self,
            "inv-4",
            [],
          ),
        ).toEqual({
          ok: false,
          reason: "self_relationship",
        });
      },
    );

    it("AC-2.30 rejects a statement that would close a cycle at acceptance", () => {
      expect(
        buildAcceptedRelationship(
          { term: "parent", subject: "invitee", statedBy: "inviter" },
          parties,
          "inv-5",
          edges,
        ),
      ).toEqual({ ok: false, reason: "ancestor_cycle" });
    });
  });

  it("relationship states: only pending moves, and accepted changes only through a Feature 5 claim", () => {
    expect(canTransitionRelationship("pending", "accepted")).toBe(true);
    expect(canTransitionRelationship("pending", "rejected")).toBe(true);
    expect(canTransitionRelationship("pending", "expired")).toBe(true);
    expect(canTransitionRelationship("accepted", "rejected")).toBe(false);
    expect(canTransitionRelationship("rejected", "accepted")).toBe(false);
    expect(canTransitionRelationship("expired", "pending")).toBe(false);
  });

  it.each([
    ["accepted edge", "edge", "accepted", true],
    ["pending edge", "edge", "pending", false],
    ["rejected edge", "edge", "rejected", false],
    ["expired edge", "edge", "expired", false],
    ["accepted kin_stated", "kin_stated", "accepted", false],
  ] as const)(
    "graph index projects only accepted typed edges: %s",
    (_name, form, state, projected) => {
      expect(isGraphIndexProjectable({ form, state })).toBe(projected);
    },
  );
});
