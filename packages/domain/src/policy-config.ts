/**
 * Invitation, token and founding policy as data: the one config file D-059 and D-061
 * name. Changing a value is a change here plus a decision-log note, never a code change,
 * and tests read the values from here (AC-2.16).
 */

const dayMs = 24 * 60 * 60 * 1000;

export const invitationPolicy = {
  /** An invitation expires this long after it is sent or refreshed (D-061). */
  expiryDays: 14,
  /** Re-inviting a pending contact refreshes the open invitation (AC-2.20). */
  refreshExpiryOnReinvite: true,
  /** Open invitations one inviter may have at once (D-061). */
  maxOpenPerInviter: 20,
  /** New invitations one inviter may send in any 24 hours (D-061). */
  maxNewPerInviterPerDay: 10,
  /** Feature 2 sends email only; the channel is recorded so phone can follow (D-060). */
  channels: ["email"],
} as const;

export const invitationTokenPolicy = {
  /** Random bytes per token: 256 bits, above the 128-bit floor of AC-2.18. */
  randomBytes: 32,
  minEntropyBits: 128,
  /** Encoding of the token in the link: unpadded base64url. */
  encoding: "base64url",
  /** Only a hash is stored; the plaintext goes to the delivery adapter once (AC-2.18). */
  storage: "hash-only",
  /** Opening a link never uses it up; only an accepted, verified action does. */
  consumedBy: "verified-action",
} as const;

export const groupFoundingPolicy = {
  /** Groups one account may found in any 24 hours (D-059 rate limit; proposed default). */
  maxFoundedPerAccountPerDay: 1,
} as const;

export function invitationExpiresAt(sentAtMs: number): number {
  return sentAtMs + invitationPolicy.expiryDays * dayMs;
}

/** True from the expiry instant onwards. */
export function isPastExpiry(expiresAtMs: number, nowMs: number): boolean {
  return nowMs >= expiresAtMs;
}

const base64UrlLength = Math.ceil((invitationTokenPolicy.randomBytes * 8) / 6);
const tokenShape = new RegExp(`^[A-Za-z0-9_-]{${String(base64UrlLength)}}$`);

/**
 * A cheap shape check before any hash lookup, so obviously malformed input is refused
 * early. It proves nothing about the token: only a hash match does.
 */
export function isWellFormedInvitationToken(input: unknown): input is string {
  return typeof input === "string" && tokenShape.test(input);
}

export type LimitRefusal =
  "too_many_open_invitations" | "daily_invitation_limit" | "daily_founding_limit";

/** Applied before a new invitation is created; a refresh of a pending one is not new. */
export function checkInvitationLimits(counts: {
  readonly openByInviter: number;
  readonly sentByInviterInLast24Hours: number;
}): LimitRefusal | null {
  if (counts.openByInviter >= invitationPolicy.maxOpenPerInviter) {
    return "too_many_open_invitations";
  }
  if (counts.sentByInviterInLast24Hours >= invitationPolicy.maxNewPerInviterPerDay) {
    return "daily_invitation_limit";
  }
  return null;
}

export function checkFoundingLimit(counts: {
  readonly foundedByAccountInLast24Hours: number;
}): LimitRefusal | null {
  return counts.foundedByAccountInLast24Hours >= groupFoundingPolicy.maxFoundedPerAccountPerDay
    ? "daily_founding_limit"
    : null;
}
