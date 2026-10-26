import { describe, expect, it } from "vitest";
import { normalizeEmail } from "./email";

describe("normalizeEmail", () => {
  it.each([
    ["missing: undefined", undefined],
    ["missing: number", 42],
    ["missing: empty", ""],
    ["missing: blank", "   "],
  ])("rejects %s", (_name, input) => {
    expect(normalizeEmail(input)).toEqual({ ok: false, reason: "missing" });
  });

  it.each([
    ["no at sign", "hari.example.com"],
    ["two at signs", "hari@kiran@example.com"],
    ["empty local part", "@example.com"],
    ["empty domain", "hari@"],
    ["single-label domain", "hari@localhost"],
    ["numeric top-level label", "hari@example.123"],
    ["leading dot", ".hari@example.com"],
    ["double dot", "hari..k@example.com"],
    ["inner space", "ha ri@example.com"],
    ["display-name form", "Hari <hari@example.com>"],
    ["quoted local part", '"hari"@example.com'],
    ["IP literal domain", "hari@[127.0.0.1]"],
    ["hyphen at label edge", "hari@-example.com"],
    ["non-ASCII local part", "హరి@example.com"],
    ["control character", "hari\u0000@example.com"],
    ["local part over 64", `${"a".repeat(65)}@example.com`],
    [
      "address over 254",
      `hari@${"a".repeat(63)}.${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(60)}.com`,
    ],
  ])("rejects %s", (_name, input) => {
    expect(normalizeEmail(input)).toEqual({ ok: false, reason: "invalid" });
  });

  it.each([
    ["plain", "hari@example.com", "hari@example.com"],
    ["surrounding space trimmed", "  hari@example.com\n", "hari@example.com"],
    ["case folded", "Hari.Kumar@Example.COM", "hari.kumar@example.com"],
    ["plus tag kept", "hari+family@example.com", "hari+family@example.com"],
    ["dots kept", "h.a.r.i@gmail.com", "h.a.r.i@gmail.com"],
    ["subdomain", "hari@mail.example.co.in", "hari@mail.example.co.in"],
    ["punycode domain", "hari@xn--h1aa.xn--p1ai", "hari@xn--h1aa.xn--p1ai"],
  ])("accepts %s", (_name, input, expected) => {
    expect(normalizeEmail(input)).toEqual({ ok: true, email: expected });
  });

  it("gives two spellings of one address the same normalized value", () => {
    const first = normalizeEmail(" HARI@example.com");
    const second = normalizeEmail("hari@EXAMPLE.com ");
    expect(first.ok && second.ok && first.email === second.email).toBe(true);
  });

  it("never echoes the rejected value", () => {
    const value = "not an email but private text";
    expect(JSON.stringify(normalizeEmail(value))).not.toContain("private");
  });
});
