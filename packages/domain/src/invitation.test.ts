import { normalizeEmail, type NormalizedEmail } from "@parampara/validation";
import { describe, expect, it } from "vitest";
import {
  INVITATION_TRANSITIONS,
  decideInvitationEvent,
  effectiveInvitationState,
  openInvitation,
  partyOf,
  refreshInvitation,
  type AcceptanceInput,
  type InvitationEvent,
  type InvitationFacts,
  type InvitationState,
} from "./invitation";
import { invitationPolicy } from "./policy-config";

const dayMs = 24 * 60 * 60 * 1000;
const sentAt = Date.UTC(2026, 9, 1);
const expiresAt = sentAt + invitationPolicy.expiryDays * dayMs;
const beforeExpiry = expiresAt - 1;

function email(value: string): NormalizedEmail {
  const result = normalizeEmail(value);
  if (!result.ok) {
    throw new Error("test fixture email is invalid");
  }
  return result.email;
}

const kiran = { accountId: "acct-kiran", verifiedEmails: [email("kiran@example.com")] };
const hari = { accountId: "acct-hari", verifiedEmails: [email("hari@example.com")] };
const anil = { accountId: "acct-anil", verifiedEmails: [email("anil@example.com")] };

const acceptance: AcceptanceInput = {
  parties: {
    inviter: { accountId: "acct-kiran", personId: "kiran" },
    invitee: { accountId: "acct-hari", personId: "hari" },
  },
  acceptedEdges: [],
};

function invitation(overrides: Partial<InvitationFacts> = {}): InvitationFacts {
  return {
    id: "inv-1",
    groupId: "group-a",
    inviterAccountId: "acct-kiran",
    invitee: { email: email("hari@example.com"), accountId: null },
    state: "awaitingInvitee",
    statement: { term: "cousin", subject: "invitee", statedBy: "inviter" },
    expiresAt,
    ...overrides,
  };
}

const awaitingInviter = invitation({
  state: "awaitingInviter",
  statement: { term: "nephew", subject: "invitee", statedBy: "invitee" },
});
const awaitingDisclosure = invitation({ state: "awaitingDisclosure", statement: null });

describe("invitation state machine", () => {
  describe("denials first", () => {
    it.each([
      ["AC-2.25 third party is not a party", anil, null],
      [
        "AC-2.19 an account without the invited email is not the invitee",
        { accountId: "acct-x", verifiedEmails: [email("other@example.com")] },
        null,
      ],
      ["AC-2.19 the invited email verified by the account makes it the invitee", hari, "invitee"],
      ["the inviter", kiran, "inviter"],
    ] as const)("%s", (_name, candidate, party) => {
      expect(partyOf(invitation(), candidate)).toBe(party);
    });

    it("AC-2.19 once bound, only the bound account is the invitee, even with the same email", () => {
      const bound = invitation({
        invitee: { email: email("hari@example.com"), accountId: "acct-hari" },
      });
      expect(
        partyOf(bound, { accountId: "acct-imposter", verifiedEmails: hari.verifiedEmails }),
      ).toBeNull();
      expect(partyOf(bound, hari)).toBe("invitee");
    });

    it.each<[string, InvitationFacts, InvitationEvent, string]>([
      [
        "AC-2.26 inviter cannot confirm their own statement",
        invitation(),
        { action: "confirm", by: "inviter", acceptance },
        "action_not_allowed",
      ],
      [
        "AC-2.26 invitee cannot confirm their own correction",
        awaitingInviter,
        { action: "confirm", by: "invitee", acceptance },
        "action_not_allowed",
      ],
      [
        "nothing to confirm before disclosure",
        awaitingDisclosure,
        { action: "confirm", by: "inviter", acceptance },
        "action_not_allowed",
      ],
      [
        "inviter cannot correct",
        invitation(),
        { action: "correct", by: "inviter", term: "cousin", subject: "invitee" },
        "action_not_allowed",
      ],
      [
        "inviter cannot disclose",
        awaitingDisclosure,
        { action: "disclose", by: "inviter", term: "cousin", subject: "invitee" },
        "action_not_allowed",
      ],
      [
        "inviter cannot withdraw while awaiting the invitee",
        invitation(),
        { action: "reject", by: "inviter" },
        "action_not_allowed",
      ],
      [
        "AC-2.29 unsupported correction",
        invitation(),
        { action: "correct", by: "invitee", term: "maternal uncle", subject: "inviter" },
        "unsupported_term",
      ],
      [
        "AC-2.32 display label is not a code",
        awaitingDisclosure,
        { action: "disclose", by: "invitee", term: "Mama", subject: "inviter" },
        "unsupported_term",
      ],
      [
        "AC-2.32 free text disclosure",
        awaitingDisclosure,
        { action: "disclose", by: "invitee", term: "uncle by marriage", subject: "inviter" },
        "unsupported_term",
      ],
    ])("%s", (_name, facts, event, reason) => {
      expect(decideInvitationEvent(facts, event, beforeExpiry)).toEqual({ ok: false, reason });
    });

    it("AC-2.26 a confirm by the stating party is refused even if the table were bypassed", () => {
      const inconsistent = invitation({
        statement: { term: "cousin", subject: "invitee", statedBy: "invitee" },
      });
      expect(
        decideInvitationEvent(
          inconsistent,
          { action: "confirm", by: "invitee", acceptance },
          beforeExpiry,
        ),
      ).toEqual({
        ok: false,
        reason: "own_statement",
      });
    });

    it("AC-2.16 at the configured expiry every action is refused and the state does not move", () => {
      const events: InvitationEvent[] = [
        { action: "confirm", by: "invitee", acceptance },
        { action: "correct", by: "invitee", term: "cousin", subject: "inviter" },
        { action: "reject", by: "invitee" },
      ];
      const facts = invitation();
      for (const event of events) {
        expect(decideInvitationEvent(facts, event, expiresAt)).toEqual({
          ok: false,
          reason: "invitation_expired",
        });
      }
      expect(facts.state).toBe("awaitingInvitee");
      expect(effectiveInvitationState(facts, beforeExpiry)).toBe("awaitingInvitee");
      expect(effectiveInvitationState(facts, expiresAt)).toBe("expired");
    });

    it.each<InvitationState>(["accepted", "rejected", "expired"])(
      "AC-2.17 a %s invitation cannot be used again, even by its invitee",
      (state) => {
        const closed = invitation({ state });
        const reason = state === "expired" ? "invitation_expired" : "invitation_closed";
        expect(
          decideInvitationEvent(closed, { action: "confirm", by: "invitee", acceptance }, sentAt),
        ).toEqual({ ok: false, reason });
        expect(decideInvitationEvent(closed, { action: "reject", by: "invitee" }, sentAt)).toEqual({
          ok: false,
          reason,
        });
      },
    );

    it("AC-2.30 a confirmation that would close an ancestor cycle changes nothing", () => {
      const facts = invitation({
        statement: { term: "parent", subject: "invitee", statedBy: "inviter" },
      });
      const cyclic = {
        ...acceptance,
        acceptedEdges: [
          { type: "parent_child", parentPersonId: "kiran", childPersonId: "hari" } as const,
        ],
      };
      expect(
        decideInvitationEvent(
          facts,
          { action: "confirm", by: "invitee", acceptance: cyclic },
          beforeExpiry,
        ),
      ).toEqual({
        ok: false,
        reason: "ancestor_cycle",
      });
    });
  });

  describe("allowed paths", () => {
    it("AC-2.07 inviter states cousin and the invitee's confirmation accepts it with a kin_stated record", () => {
      const result = decideInvitationEvent(
        invitation(),
        { action: "confirm", by: "invitee", acceptance },
        beforeExpiry,
      );
      expect(result.ok && result.state).toBe("accepted");
      expect(result.ok && result.record).toMatchObject({
        form: "kin_stated",
        termCode: "cousin",
        state: "accepted",
      });
    });

    it("AC-2.08 the invitee's correction goes back to the inviter, and only the inviter accepts it", () => {
      const corrected = decideInvitationEvent(
        invitation(),
        { action: "correct", by: "invitee", term: "nephew", subject: "invitee" },
        beforeExpiry,
      );
      expect(corrected).toEqual({
        ok: true,
        state: "awaitingInviter",
        statement: { term: "nephew", subject: "invitee", statedBy: "invitee" },
        record: null,
      });
      const accepted = decideInvitationEvent(
        awaitingInviter,
        { action: "confirm", by: "inviter", acceptance },
        beforeExpiry,
      );
      expect(accepted.ok && accepted.state).toBe("accepted");
      expect(accepted.ok && accepted.record?.statingActorId).toBe("acct-hari");
    });

    it("AC-2.09 the invitee discloses, and it is accepted only when the inviter confirms", () => {
      const disclosed = decideInvitationEvent(
        awaitingDisclosure,
        { action: "disclose", by: "invitee", term: "child", subject: "invitee" },
        beforeExpiry,
      );
      expect(disclosed.ok && disclosed.state).toBe("awaitingInviter");
      expect(disclosed.ok && disclosed.record).toBeNull();
    });

    it.each<[string, InvitationFacts, "inviter" | "invitee"]>([
      ["invitee rejects while awaiting the invitee", invitation(), "invitee"],
      ["invitee rejects while awaiting disclosure", awaitingDisclosure, "invitee"],
      ["invitee rejects while awaiting the inviter", awaitingInviter, "invitee"],
      ["inviter declines a correction", awaitingInviter, "inviter"],
    ])("AC-2.21 %s: rejected and no record", (_name, facts, by) => {
      expect(decideInvitationEvent(facts, { action: "reject", by }, beforeExpiry)).toMatchObject({
        ok: true,
        state: "rejected",
        record: null,
      });
    });

    it("only the other party to the current statement ever confirms (AC-2.25, AC-2.26)", () => {
      for (const t of INVITATION_TRANSITIONS.filter((x) => x.action === "confirm")) {
        expect(t.by).toBe(t.from === "awaitingInvitee" ? "invitee" : "inviter");
      }
    });
  });

  describe("opening and refreshing", () => {
    it.each([
      ["missing contact", "", "missing_contact"],
      ["invalid contact", "not-an-email", "invalid_contact"],
      ["inviting your own verified email", " KIRAN@example.com", "self_invitation"],
    ])("refuses %s", (_name, inviteeEmail, reason) => {
      expect(
        openInvitation({
          inviterVerifiedEmails: kiran.verifiedEmails,
          inviteeEmail,
          request: { kind: "askToDisclose" },
          nowMs: sentAt,
        }),
      ).toEqual({ ok: false, reason });
    });

    it("AC-2.29 refuses an unsupported stated term", () => {
      expect(
        openInvitation({
          inviterVerifiedEmails: kiran.verifiedEmails,
          inviteeEmail: "hari@example.com",
          request: { kind: "state", term: "mom's brother", subject: "invitee" },
          nowMs: sentAt,
        }),
      ).toEqual({ ok: false, reason: "unsupported_term" });
    });

    it("AC-2.06 AC-2.16 opens a pending email invitation that expires after the configured period", () => {
      expect(
        openInvitation({
          inviterVerifiedEmails: kiran.verifiedEmails,
          inviteeEmail: " Hari@Example.com ",
          request: { kind: "state", term: "cousin", subject: "invitee" },
          nowMs: sentAt,
        }),
      ).toEqual({
        ok: true,
        channel: "email",
        inviteeEmail: "hari@example.com",
        state: "awaitingInvitee",
        statement: { term: "cousin", subject: "invitee", statedBy: "inviter" },
        expiresAt,
      });
    });

    it("AC-2.20 re-inviting refreshes a pending invitation and restarts the configured expiry", () => {
      const later = sentAt + 3 * dayMs;
      expect(refreshInvitation(invitation(), later)).toEqual({
        ok: true,
        expiresAt: later + invitationPolicy.expiryDays * dayMs,
      });
    });

    it.each<[InvitationState | "past expiry", string]>([
      ["accepted", "invitation_closed"],
      ["rejected", "invitation_closed"],
      ["past expiry", "invitation_expired"],
    ])(
      "AC-2.16 a %s invitation is not refreshed; the inviter opens a fresh one",
      (state, reason) => {
        const facts = state === "past expiry" ? invitation() : invitation({ state });
        expect(refreshInvitation(facts, expiresAt)).toEqual({ ok: false, reason });
      },
    );
  });
});
