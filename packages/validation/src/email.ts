/**
 * Email contact normalization for invitations and profiles (Feature 2 is email only,
 * D-060). A normalized email is the only form the domain compares, so an invitation
 * sent to " Hari@Example.COM " is accepted by the account that verified
 * "hari@example.com" and by no other (AC-2.19, D-066).
 *
 * Results never echo the rejected value, so a caller cannot copy personal data into an
 * error message or a log by accident.
 */

declare const normalizedEmailBrand: unique symbol;

/** An email that passed `normalizeEmail`. Only that function creates one. */
export type NormalizedEmail = string & { readonly [normalizedEmailBrand]: true };

export type EmailResult =
  | { readonly ok: true; readonly email: NormalizedEmail }
  | { readonly ok: false; readonly reason: "missing" | "invalid" };

// RFC 5321 limits: 64 octets for the local part, 254 for the whole address.
const maxLocalLength = 64;
const maxEmailLength = 254;

// Unquoted local parts only (RFC 5322 dot-atom), ASCII. Quoted local parts, comments,
// IP-literal domains and non-ASCII addresses are rejected: no verified account in
// Feature 2 needs them, and every extra form is another way for two strings to name
// the same mailbox.
const localPart = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;
// At least two labels, each 1 to 63 characters, no leading or trailing hyphen, and an
// alphabetic top-level label (punycode `xn--` labels are allowed).
const domainLabel = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/;
const topLevelLabel = /^(?:[A-Za-z]{2,63}|xn--[A-Za-z0-9-]{1,59})$/;

/**
 * Trims surrounding whitespace and lower-cases the whole address. No provider-specific
 * rewriting (Gmail dots or `+` tags are kept), because that would merge mailboxes that
 * the provider itself treats as different accounts.
 */
export function normalizeEmail(input: unknown): EmailResult {
  if (typeof input !== "string" || input.trim() === "") {
    return { ok: false, reason: "missing" };
  }
  const candidate = input.trim();
  if (candidate.length > maxEmailLength) {
    return { ok: false, reason: "invalid" };
  }
  const at = candidate.indexOf("@");
  if (at <= 0 || at !== candidate.lastIndexOf("@")) {
    return { ok: false, reason: "invalid" };
  }
  const local = candidate.slice(0, at);
  const domain = candidate.slice(at + 1);
  if (local.length > maxLocalLength || !localPart.test(local)) {
    return { ok: false, reason: "invalid" };
  }
  const labels = domain.split(".");
  const topLevel = labels.at(-1) ?? "";
  if (
    labels.length < 2 ||
    !labels.every((label) => domainLabel.test(label)) ||
    !topLevelLabel.test(topLevel)
  ) {
    return { ok: false, reason: "invalid" };
  }
  return { ok: true, email: candidate.toLowerCase() as NormalizedEmail };
}
