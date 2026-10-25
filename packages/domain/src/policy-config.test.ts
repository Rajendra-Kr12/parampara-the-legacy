import { describe, expect, it } from "vitest";
import {
  checkFoundingLimit,
  checkInvitationLimits,
  groupFoundingPolicy,
  invitationExpiresAt,
  invitationPolicy,
  invitationTokenPolicy,
  isPastExpiry,
  isWellFormedInvitationToken,
} from "./policy-config";

const dayMs = 24 * 60 * 60 * 1000;

describe("policy config (D-059, D-061)", () => {
  it("holds the decided values", () => {
    expect(invitationPolicy.expiryDays).toBe(14);
    expect(invitationPolicy.maxOpenPerInviter).toBe(20);
    expect(invitationPolicy.maxNewPerInviterPerDay).toBe(10);
    expect(invitationPolicy.channels).toEqual(["email"]);
  });

  it("AC-2.16 expiry is the configured period after sending, from that instant on", () => {
    const sentAt = Date.UTC(2026, 9, 1);
    const expiresAt = invitationExpiresAt(sentAt);
    expect(expiresAt - sentAt).toBe(invitationPolicy.expiryDays * dayMs);
    expect(isPastExpiry(expiresAt, expiresAt - 1)).toBe(false);
    expect(isPastExpiry(expiresAt, expiresAt)).toBe(true);
  });

  it("AC-2.18 tokens carry at least 128 bits and are stored only as a hash", () => {
    expect(invitationTokenPolicy.randomBytes * 8).toBeGreaterThanOrEqual(
      invitationTokenPolicy.minEntropyBits,
    );
    expect(invitationTokenPolicy.minEntropyBits).toBeGreaterThanOrEqual(128);
    expect(invitationTokenPolicy.storage).toBe("hash-only");
  });

  it.each([
    ["too short", "A".repeat(42), false],
    ["too long", "A".repeat(44), false],
    ["padding", `${"A".repeat(42)}=`, false],
    ["standard base64 characters", `${"A".repeat(42)}+`, false],
    ["not a string", 12345, false],
    ["unpadded base64url of 32 bytes", `${"A".repeat(41)}-_`, true],
  ] as const)("token shape: %s", (_name, token, wellFormed) => {
    expect(isWellFormedInvitationToken(token)).toBe(wellFormed);
  });

  it.each([
    ["under both limits", 19, 9, null],
    ["at the open limit", invitationPolicy.maxOpenPerInviter, 0, "too_many_open_invitations"],
    ["at the daily limit", 0, invitationPolicy.maxNewPerInviterPerDay, "daily_invitation_limit"],
  ] as const)(
    "invitation limits: %s",
    (_name, openByInviter, sentByInviterInLast24Hours, refusal) => {
      expect(checkInvitationLimits({ openByInviter, sentByInviterInLast24Hours })).toBe(refusal);
    },
  );

  it("founding is rate limited from the same config", () => {
    const limit = groupFoundingPolicy.maxFoundedPerAccountPerDay;
    expect(checkFoundingLimit({ foundedByAccountInLast24Hours: limit - 1 })).toBeNull();
    expect(checkFoundingLimit({ foundedByAccountInLast24Hours: limit })).toBe(
      "daily_founding_limit",
    );
  });
});
